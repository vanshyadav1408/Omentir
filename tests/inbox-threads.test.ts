import { describe, expect, test } from "bun:test";
import {
  dedupeLinkedInInboxThreads,
  storedConversationIsLiveMirror,
} from "../src/lib/inbox-threads";
import type { LinkedInInboxThread } from "../src/lib/server/types";

function thread(
  overrides: Partial<LinkedInInboxThread> & Pick<LinkedInInboxThread, "id">,
): LinkedInInboxThread {
  return {
    providerChatId: overrides.providerChatId || overrides.id,
    accountId: "acc_1",
    title: overrides.profileName || overrides.title || "LinkedIn chat",
    unread: false,
    updatedAt: "2026-08-21T12:00:00.000Z",
    messages: [],
    ...overrides,
  };
}

function preview(body: string, createdAt = "2026-08-21T12:00:00.000Z") {
  return [
    {
      id: "m1",
      chatId: "chat",
      direction: "outbound" as const,
      senderName: "You",
      body,
      createdAt,
    },
  ];
}

describe("dedupeLinkedInInboxThreads", () => {
  test("collapses Classic and Sales Navigator copies so the user cannot open the same person twice", () => {
    const body = "Hi, I reached out because you're a GTM lead.";
    const classic = thread({
      id: "classic-ezekiel",
      profileName: "Ezekiel Ogbekhilu",
      profileHeadline: "Helping Businesses Get More Clients",
      profileUrl: "https://www.linkedin.com/in/ezekiel-ogbekhilu",
      avatarUrl: "https://example.com/ezekiel.jpg",
      attendeeProviderId: "ACoAAAclassic",
      messages: preview(body),
    });
    const salesNav = thread({
      id: "salesnav-ezekiel",
      providerChatId: "sn-ezekiel",
      profileName: "Ezekiel Ogbekhilu",
      profileHeadline: "Helping Businesses Get More Clients",
      profileUrl: "https://www.linkedin.com/in/ezekiel-ogbekhilu",
      avatarUrl: "https://example.com/ezekiel.jpg",
      attendeeProviderId: "ACwAAAsales",
      messages: preview(body, "2026-08-21T12:00:40.000Z"),
    });

    const result = dedupeLinkedInInboxThreads([classic, salesNav]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("classic-ezekiel");
    expect(result[0]?.profileName).toBe("Ezekiel Ogbekhilu");
  });

  test("keeps the named row when one inbox copy failed attendee lookup", () => {
    const body = "Hi, I reached out because you build outbound.";
    const named = thread({
      id: "josh-etim",
      profileName: "Josh Etim",
      profileUrl: "https://www.linkedin.com/in/josh-etim",
      avatarUrl: "https://example.com/josh.jpg",
      messages: preview(body),
    });
    const unnamed = thread({
      id: "josh-unresolved",
      title: "LinkedIn chat",
      profileName: "LinkedIn chat",
      messages: preview(body),
    });

    const result = dedupeLinkedInInboxThreads([unnamed, named]);
    expect(result).toHaveLength(1);
    expect(result[0]?.profileName).toBe("Josh Etim");
    expect(result[0]?.id).toBe("josh-etim");
  });

  test("does not merge two different people who received the same template in the same minute", () => {
    const body = "Hi, I reached out because you're a GTM lead.";
    const ezekiel = thread({
      id: "ezekiel",
      profileName: "Ezekiel Ogbekhilu",
      messages: preview(body),
    });
    const joshua = thread({
      id: "joshua",
      profileName: "Joshua Bland",
      messages: preview(body),
    });

    expect(dedupeLinkedInInboxThreads([ezekiel, joshua])).toHaveLength(2);
  });

  test("keeps the same person on two connected accounts as two rows", () => {
    const body = "Hi, I reached out because you're a GTM lead.";
    const fromA = thread({
      id: "a-ezekiel",
      accountId: "acc_a",
      profileName: "Ezekiel Ogbekhilu",
      messages: preview(body),
    });
    const fromB = thread({
      id: "b-ezekiel",
      accountId: "acc_b",
      profileName: "Ezekiel Ogbekhilu",
      messages: preview(body),
    });

    expect(dedupeLinkedInInboxThreads([fromA, fromB])).toHaveLength(2);
  });
});

describe("storedConversationIsLiveMirror", () => {
  test("hides the Firestore copy when the live URL is a member id and the lead is a vanity slug", () => {
    const live = thread({
      id: "live-ezekiel",
      profileName: "Ezekiel Ogbekhilu",
      profileUrl: "https://www.linkedin.com/in/ACoAAAezekiel",
      messages: preview("Hi, I reached out because you're a GTM lead."),
    });
    expect(
      storedConversationIsLiveMirror(
        [live],
        {
          name: "Ezekiel Ogbekhilu",
          linkedInUrl: "https://www.linkedin.com/in/ezekiel-ogbekhilu",
        },
        preview("Hi, I reached out because you're a GTM lead."),
      ),
    ).toBe(true);
  });

  test("hides the named stored copy of an unresolved LinkedIn chat with the same last message", () => {
    const live = thread({
      id: "unresolved",
      profileName: "LinkedIn chat",
      messages: preview("Hi, I reached out because you build outbound."),
    });
    expect(
      storedConversationIsLiveMirror(
        [live],
        { name: "Josh Etim", linkedInUrl: "https://www.linkedin.com/in/josh-etim" },
        preview("Hi, I reached out because you build outbound."),
      ),
    ).toBe(true);
  });

  test("does not hide a stored conversation for a different person", () => {
    const live = thread({
      id: "live-ezekiel",
      profileName: "Ezekiel Ogbekhilu",
      profileUrl: "https://www.linkedin.com/in/ezekiel-ogbekhilu",
      messages: preview("Hi Ezekiel"),
    });
    expect(
      storedConversationIsLiveMirror(
        [live],
        { name: "Mila C.", linkedInUrl: "https://www.linkedin.com/in/mila-c" },
        preview("Hi Mila"),
      ),
    ).toBe(false);
  });
});
