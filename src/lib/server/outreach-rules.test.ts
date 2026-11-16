import { describe, expect, test } from "bun:test";
import { connectionNoteFor, inviteNotesFor, renderTemplate, writtenSequenceMessage } from "./outreach-rules";

describe("renderTemplate", () => {
  test("fills {{lastName}} because the sequence editor offers it, and an unfilled token would reach the lead as literal braces", () => {
    const rendered = renderTemplate("Hi {{firstName}} {{lastName}}", {
      name: "Ada Lovelace",
      company: "Analytical",
      title: "Engineer",
    });
    expect(rendered).toEqual({ text: "Hi Ada Lovelace", natural: true });
  });

  test("marks a message with {{leadReason}} as not sendable, so it is AI-drafted instead of sent with a hole in it", () => {
    const rendered = renderTemplate("Saw {{leadReason}}", { name: "Ada", company: "A", title: "B" });
    expect(rendered.natural).toBe(false);
  });
});

describe("writtenSequenceMessage", () => {
  const lead = { name: "Ada Lovelace", company: "Analytical", title: "Engineer" };
  const step = { id: "first-message", messageTemplate: "Hi {{firstName}} from the template" };

  test("sends the user's own message for this lead over the agent template, because a rewrite that still goes out as the template is the bug customers hit", () => {
    expect(writtenSequenceMessage(step, lead, { "first-message": "My own words, Ada" })).toEqual({
      text: "My own words, Ada",
      edited: true,
    });
  });

  test("sends the user's own message even when the step is AI-written, so AI never replaces text the user wrote", () => {
    const aiStep = { id: "second-message", messageTemplate: "" };
    expect(writtenSequenceMessage(aiStep, lead, { "second-message": "Written by me" })?.text).toBe("Written by me");
  });

  test("ignores edits for other steps and blank edits, falling back to the template", () => {
    expect(writtenSequenceMessage(step, lead, { "second-message": "Not this one", "first-message": "   " })).toEqual({
      text: "Hi Ada from the template",
      edited: false,
    });
  });

  test("returns nothing when there is no edit and the template cannot render cleanly, which is the only case AI drafts", () => {
    expect(writtenSequenceMessage({ id: "first-message", messageTemplate: "" }, lead, undefined)).toBeUndefined();
    expect(writtenSequenceMessage({ id: "first-message", messageTemplate: "Saw {{leadReason}}" }, lead, {})).toBeUndefined();
  });
});

describe("connectionNoteFor", () => {
  const lead = { name: "Ada Lovelace", company: "", title: "Engineer" };

  test("gives the exact note the invite carries, which is how the owner-message guard later recognises it in the thread", () => {
    expect(connectionNoteFor({ includeNote: true, noteTemplate: "Hi {{firstName}}, liked your talk." }, lead)).toBe(
      "Hi Ada, liked your talk.",
    );
  });

  test("gives no note for a bare invite or a template that would render with a hole in it", () => {
    expect(connectionNoteFor({ includeNote: false, noteTemplate: "Hi {{firstName}}" }, lead)).toBeUndefined();
    expect(connectionNoteFor({ includeNote: true, noteTemplate: "Loved what {{company}} is doing." }, lead)).toBeUndefined();
  });
});

describe("inviteNotesFor", () => {
  const connectStep = (noteTemplate: string) => ({
    id: "connect", type: "connect" as const, includeNote: true, noteTemplate,
  });

  // Accepting an invite refreshes the lead's title and company before the
  // first AI message. Re-rendering the note then gives different text, the
  // note in the thread looks hand-typed, and the sequence stopped at acceptance.
  test("keeps the note the invite actually carried after the lead's company changes", () => {
    const notes = inviteNotesFor(
      [{ connectionNote: "Hi Ada, saw your work at Acme." }],
      [{ steps: [connectStep("Hi {{firstName}}, saw your work at {{company}}.")] }],
      { name: "Ada Lovelace", company: "Analytical Engines Ltd", title: "Engineer" },
    );
    expect(notes).toContain("Hi Ada, saw your work at Acme.");
  });

  test("still recognises notes from invites sent before the note was stored", () => {
    const notes = inviteNotesFor(
      [{}],
      [{ steps: [connectStep("Hi {{firstName}}, saw your work at {{company}}.")] }],
      { name: "Ada Lovelace", company: "Acme", title: "Engineer" },
    );
    expect(notes).toEqual(["Hi Ada, saw your work at Acme."]);
  });
});
