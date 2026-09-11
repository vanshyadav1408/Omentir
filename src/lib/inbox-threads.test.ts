import { describe, expect, test } from "bun:test";
import { dedupeLinkedInInboxThreads } from "./inbox-threads";
import type { LinkedInInboxThread } from "./server/types";

function thread(
  overrides: Partial<LinkedInInboxThread> & Pick<LinkedInInboxThread, "id">,
): LinkedInInboxThread {
  return {
    providerChatId: overrides.id,
    accountId: "acc-1",
    title: "LinkedIn chat",
    unread: false,
    updatedAt: "2026-09-01T00:00:00.000Z",
    messages: [],
    ...overrides,
  };
}

describe("dedupeLinkedInInboxThreads", () => {
  test("drops a nameless LinkedIn chat copy that did not share identity or last message with the named person", () => {
    const named = thread({
      id: "classic-harish",
      title: "Harish Sarma",
      profileName: "Harish Sarma",
      attendeeProviderId: "ACoAAAHarish",
      updatedAt: "2026-08-28T00:00:00.000Z",
      messages: [
        {
          id: "m1",
          chatId: "classic-harish",
          direction: "inbound",
          senderName: "Harish Sarma",
          body: "Dear Vansh, We understand the importance",
          createdAt: "2026-08-28T00:00:00.000Z",
        },
      ],
    });
    const unnamed = thread({
      id: "salesnav-harish",
      title: "LinkedIn chat",
      profileName: "LinkedIn chat",
      attendeeProviderId: "ACwAAAHarish",
      updatedAt: "2026-08-28T00:00:00.000Z",
      messages: [
        {
          id: "m2",
          chatId: "salesnav-harish",
          direction: "inbound",
          senderName: "LinkedIn",
          body: "At the moment 2 of them write themselves",
          createdAt: "2026-08-28T00:00:00.000Z",
        },
      ],
    });

    const result = dedupeLinkedInInboxThreads([named, unnamed]);
    expect(result.map((item) => item.id)).toEqual(["classic-harish"]);
    expect(result.some((item) => item.profileName === "LinkedIn chat")).toBe(false);
  });

  test("still keeps the named row when an unnamed copy merges by matching last message", () => {
    const preview = {
      id: "m1",
      chatId: "classic",
      direction: "inbound" as const,
      senderName: "Naman Singh",
      body: "Hi Vansh, not really. Will reach out in future.",
      createdAt: "2026-08-27T00:00:00.000Z",
    };
    const named = thread({
      id: "classic",
      title: "Naman Singh",
      profileName: "Naman Singh",
      messages: [preview],
    });
    const unnamed = thread({
      id: "salesnav",
      title: "LinkedIn chat",
      profileName: "LinkedIn chat",
      messages: [{ ...preview, id: "m2", chatId: "salesnav" }],
    });

    const result = dedupeLinkedInInboxThreads([unnamed, named]);
    expect(result).toHaveLength(1);
    expect(result[0]?.profileName).toBe("Naman Singh");
  });

  test("does not drop a real person just because another thread is unnamed", () => {
    const named = thread({
      id: "salamatu",
      title: "Salamatu Oiza Isiaka",
      profileName: "Salamatu Oiza Isiaka",
    });
    const unnamed = thread({
      id: "orphan",
      title: "LinkedIn chat",
      profileName: "LinkedIn chat",
    });

    const result = dedupeLinkedInInboxThreads([named, unnamed]);
    expect(result.map((item) => item.profileName)).toEqual(["Salamatu Oiza Isiaka"]);
  });
});
