import { describe, expect, test } from "bun:test";
import {
  contractOutreachMessage,
  outreachMessageViolations,
  type OutreachCheckContext,
} from "./outreach-message-checks";
import { containsPricingDetails } from "./server/reply-automation-policy";

const base: OutreachCheckContext = {
  kind: "first",
  leadFirstName: "Priya",
  leadHasReplied: false,
  allowCallAsk: false,
  pricingAllowed: false,
  maxChars: 250,
};

function check(message: string, overrides: Partial<OutreachCheckContext> = {}) {
  return outreachMessageViolations(message, { ...base, ...overrides }, containsPricingDetails);
}

describe("outreachMessageViolations", () => {
  test("passes a plain first message that states its reason and asks one easy question", () => {
    expect(
      check(
        "Hi, I saw you're hiring three engineers at once. I'm building a tool that shortlists applicants for small teams. Are you screening them yourself?",
      ),
    ).toEqual([]);
  });

  test("rejects using the lead's name because a stranger's DM with a first name reads as mail merge", () => {
    expect(check("Hi, Priya, are you hiring this quarter?")).toContain("addresses the lead by name");
    // A short name must not match inside an ordinary word.
    expect(check("Hi, have you already hired for it?", { leadFirstName: "Al" })).toEqual([]);
  });

  test("first message needs one question so the lead has something easy to answer", () => {
    expect(check("Hi, I'm building a hiring tool.")).toContain("first message needs exactly one question");
    expect(check("Hi, are you hiring? Is it hard?")).toContain("first message needs exactly one question");
  });

  test("rejects the phrases that make a message read as a sales template", () => {
    expect(check("Hi, we help startups streamline hiring. Open to it?")).toEqual(
      expect.arrayContaining(["marketing buzzword", "\"we help [audience] [result]\" template"]),
    );
    expect(check("Just following up on my note, any thoughts?", { kind: "follow_up" })).toContain(
      "follow-up cliche",
    );
  });

  test("no call ask, link, or pricing before the lead has replied, since pitching into silence gets ignored", () => {
    expect(check("One more thing, would a quick call next week work?", { kind: "follow_up" })).toContain(
      "asks for a call or demo",
    );
    expect(check("Hi, you can see it at omentir.com. Worth a look?")).toContain("unapproved link");
    expect(check("Hi, it's $49 per month. Interested?")).toContain("mentions pricing");
  });

  test("never probes for pain before a reply, because a stranger asking what hurts reads as a discovery script", () => {
    expect(check("Do you ever run into mistakes from texted orders?", { kind: "follow_up" })).toContain(
      "probes for pain",
    );
    expect(check("Hi, is lead generation a struggle for you?")).toContain("probes for pain");
  });

  test("demo-goal campaigns may offer a call from message two, never in the first message", () => {
    const followUp = "If it's useful, I can show you in a short call. Is hiring still on your plate?";
    expect(check(followUp, { kind: "follow_up", allowCallAsk: true })).toEqual([]);
    expect(check(`Hi, ${followUp}`, { allowCallAsk: true })).toContain("asks for a call or demo");
  });

  test("replies may carry the approved booking link and pricing once the lead asked", () => {
    const link = "https://cal.com/vansh/demo";
    expect(
      check(`It's $49 a month. You can book a call here: ${link}`, {
        kind: "reply",
        leadHasReplied: true,
        pricingAllowed: true,
        allowedLink: link,
      }),
    ).toEqual([]);
  });

  // The AI can only type text. Before this check it told a lead "I'll send
  // that over to you today" and nobody ever sent anything, because the account
  // owner never heard about it.
  test("a reply can't promise to send something unless the owner was emailed about the request", () => {
    const reply = { kind: "reply" as const, leadHasReplied: true };
    const promise = "I'll send that over to you. Is your team mostly using email right now?";
    expect(check(promise, reply)).toContain("promises to send something");
    expect(check(promise, { ...reply, sendPromiseAllowed: true })).toEqual([]);
    for (const message of [
      "Let me email you the deck.",
      "Sure, sending it over now.",
      "I'll get that over this week.",
      "We'll share the case study.",
    ]) {
      expect(check(message, reply)).toContain("promises to send something");
    }
  });

  // The owner sends it whenever they read the email. A deadline the AI made
  // up is the part of the promise most likely to be broken.
  test("a backed promise still can't say when, because only the owner knows when they'll send it", () => {
    const backed = { kind: "reply" as const, leadHasReplied: true, sendPromiseAllowed: true };
    for (const message of [
      "I'll send that over to you today.",
      "I'll send it over shortly.",
      "Let me email you the deck right away.",
    ]) {
      expect(check(message, backed)).toContain("says when it will be sent");
    }
    // "right now" belongs to the question, not to the promise.
    expect(check("I'll send that over. Are your reps doing their own messaging right now?", backed)).toEqual([]);
  });

  test("an offer is not a promise, since the lead still has to say yes before anyone owes them anything", () => {
    expect(
      check("I can send a short video of it if that's useful. Are you on email for outbound today?", {
        kind: "reply",
        leadHasReplied: true,
      }),
    ).toEqual([]);
  });

  test("nothing is ever attached, even when the owner knows about the request", () => {
    expect(
      check("I've attached the overview.", { kind: "reply", leadHasReplied: true, sendPromiseAllowed: true }),
    ).toContain("claims an attachment");
  });

  test("sharing the approved booking link is delivered in the message, so it is not an empty promise", () => {
    const link = "https://cal.com/vansh/demo";
    expect(
      check(`Let me share my calendar so you can book a call: ${link}`, {
        kind: "reply",
        leadHasReplied: true,
        allowedLink: link,
      }),
    ).toEqual([]);
  });

  test("rejects over-length drafts instead of truncating them mid-thought", () => {
    expect(check(`Hi, ${"a ".repeat(140)}?`)).toContain("over 250 characters");
  });
});

describe("contractOutreachMessage", () => {
  test("contracts the stiff phrasing people never type in a DM", () => {
    expect(contractOutreachMessage("It is $59 a month. I am here if it does not fit.")).toBe(
      "It's $59 a month. I'm here if it doesn't fit.",
    );
  });

  test("leaves a sentence-final \"it is\" alone, where a contraction would be ungrammatical", () => {
    expect(contractOutreachMessage("That is what it is.")).toBe("That's what it is.");
  });
});
