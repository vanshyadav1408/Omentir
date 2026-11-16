import { describe, expect, test } from "bun:test";
import type { LeadPreview } from "@/lib/server/types";
import {
  buildOverviewSummary,
  countSendsInRange,
  findReplyLead,
} from "./overview-summary";

const NOW = Date.parse("2026-11-16T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();

function lead(overrides: Partial<LeadPreview> & { id: string }): LeadPreview {
  return {
    groupIds: ["g1"],
    linkedInUrl: "",
    name: overrides.id,
    title: "",
    company: "",
    location: "",
    fitScore: 50,
    createdAt: ago(200),
    updatedAt: ago(200),
    ...overrides,
  } as LeadPreview;
}

function summary(input: Partial<Parameters<typeof buildOverviewSummary>[0]>) {
  return buildOverviewSummary({
    agents: [],
    groups: [],
    leads: [],
    enrollments: [],
    conversations: [],
    timeZone: "UTC",
    now: NOW,
    ...input,
  });
}

describe("Overview send counts", () => {
  test("a finished sequence keeps its invite and message once the enrollment collapses to stopped", () => {
    // The enrollment forgets how far it got when the sequence ends; the
    // lead's status still says "messaged", so both sends must stay counted.
    const result = summary({
      leads: [lead({ id: "l1", outreachStatus: "messaged" })],
      enrollments: [
        { leadId: "l1", status: "stopped", connectionSentAt: ago(3), updatedAt: ago(1) },
      ],
    });
    expect(result.sends["7d"]).toEqual({ invitationsSent: 1, messagesSent: 1 });
  });

  test("a reply recorded on the enrollment survives the lead status being written down to connected", () => {
    const counts = countSendsInRange(
      [{ id: "l1", outreachStatus: "connected" }],
      [{ leadId: "l1", status: "reply_received", connectionSentAt: ago(5), updatedAt: ago(1) }],
      NOW - 7 * DAY,
    );
    expect(counts).toEqual({ invitationsSent: 1, messagesSent: 1, repliesReceived: 1 });
  });

  test("invites count by when they went out, so an 8-day-old invite is in 30d but not 7d", () => {
    const result = summary({
      leads: [lead({ id: "l1", outreachStatus: "invited" })],
      enrollments: [{ leadId: "l1", status: "connection_sent", connectionSentAt: ago(8), updatedAt: ago(8) }],
    });
    expect(result.sends["7d"].invitationsSent).toBe(0);
    expect(result.sends["30d"].invitationsSent).toBe(1);
    expect(result.sends["3m"].invitationsSent).toBe(1);
  });

  test("an enrollment with no stage and no lead status is not a send", () => {
    const result = summary({
      leads: [lead({ id: "l1", outreachStatus: "new" })],
      enrollments: [{ leadId: "l1", status: "queued", connectionSentAt: ago(1), updatedAt: ago(1) }],
    });
    expect(result.sends["7d"]).toEqual({ invitationsSent: 0, messagesSent: 0 });
  });

  test("month to date starts at midnight in the workspace zone, not UTC", () => {
    // Nov 1 00:30 in Kolkata is Oct 31 19:00 UTC: inside this month for an
    // Indian workspace. Oct 31 23:30 Kolkata is not.
    const result = summary({
      timeZone: "Asia/Kolkata",
      leads: [
        lead({ id: "inside", outreachStatus: "invited" }),
        lead({ id: "outside", outreachStatus: "invited" }),
      ],
      enrollments: [
        { leadId: "inside", status: "connection_sent", connectionSentAt: "2026-10-31T19:00:00.000Z" },
        { leadId: "outside", status: "connection_sent", connectionSentAt: "2026-10-31T18:00:00.000Z" },
      ],
    });
    expect(result.sends.month.invitationsSent).toBe(1);
  });
});

describe("Overview accepted connections", () => {
  test("count people, so a lead enrolled twice is one connection", () => {
    const result = summary({
      leads: [lead({ id: "l1", outreachStatus: "connected" })],
      enrollments: [
        { leadId: "l1", status: "connected" },
        { leadId: "l1", status: "message_sent" },
      ],
    });
    expect(result.acceptedConnections).toBe(1);
  });

  test("an invite that only went out is not an accepted connection", () => {
    const result = summary({
      leads: [lead({ id: "l1", outreachStatus: "invited" })],
      enrollments: [{ leadId: "l1", status: "stopped", connectionSentAt: ago(2) }],
    });
    expect(result.acceptedConnections).toBe(0);
  });

  test("a lead whose status was written down still counts from its furthest enrollment", () => {
    const result = summary({
      leads: [lead({ id: "l1", outreachStatus: "invited" })],
      enrollments: [{ leadId: "l1", status: "reply_received" }],
    });
    expect(result.acceptedConnections).toBe(1);
  });
});

describe("Overview hot opportunities", () => {
  test("use the agent group's lead count, once per group, and fall back to sourced leads", () => {
    const result = summary({
      agents: [
        { id: "a1", targetGroupId: "g1" },
        { id: "a2", targetGroupId: "g1" },
        { id: "a3", targetGroupId: "g2" },
      ],
      groups: [{ id: "g1", leadCount: 40 }, { id: "g2" }],
      leads: [
        lead({ id: "l1", sourceAgentId: "a3" }),
        lead({ id: "l2", sourceAgentId: "a3" }),
        lead({ id: "l3", sourceAgentId: "a1" }),
      ],
    });
    expect(result.hotOpportunities).toBe(42);
  });
});

describe("Overview hot leads", () => {
  test("are the five best fits, ties in list order, a missing score counting as zero", () => {
    const result = summary({
      leads: [
        lead({ id: "none", fitScore: undefined as unknown as number }),
        lead({ id: "a", fitScore: 70 }),
        lead({ id: "b", fitScore: 90 }),
        lead({ id: "c", fitScore: 70 }),
        lead({ id: "d", fitScore: 10 }),
        lead({ id: "e", fitScore: 80 }),
        lead({ id: "f", fitScore: 5 }),
      ],
    });
    expect(result.hotLeads.map((item) => item.id)).toEqual(["b", "e", "a", "c", "d"]);
    // Only what the card renders goes over the wire.
    expect(Object.keys(result.hotLeads[0]).sort()).toEqual(
      ["avatarUrl", "company", "fitScore", "id", "linkedInUrl", "name", "title"],
    );
  });
});

describe("Overview live activity", () => {
  test("keeps the last three months of days and drops older ones the chart can never show", () => {
    const result = summary({
      leads: [
        lead({ id: "recent", createdAt: ago(2) }),
        lead({ id: "edge", createdAt: ago(90) }),
        lead({ id: "old", createdAt: ago(200) }),
      ],
    });
    expect(result.liveActivity.map((day) => day.dateKey)).toEqual([
      ago(90).slice(0, 10),
      ago(2).slice(0, 10),
    ]);
    expect(result.liveActivity.every((day) => day.found === 1)).toBe(true);
  });
});

describe("reply lead matching", () => {
  const leads = [
    lead({ id: "first", name: "Ana Diaz", linkedInUrl: "https://www.linkedin.com/in/ana" }),
    lead({ id: "second", name: " ana diaz ", linkedInUrl: "https://www.linkedin.com/in/ana-2" }),
  ];

  test("matches on the exact profile URL", () => {
    expect(findReplyLead(leads, { profileUrl: "https://www.linkedin.com/in/ana-2" })?.id).toBe("second");
  });

  test("matches on name ignoring case and spaces, taking the first lead in list order", () => {
    expect(findReplyLead(leads, { profileName: "ANA DIAZ" })?.id).toBe("first");
  });

  test("returns null when nobody matches, so the thread's own name shows", () => {
    expect(findReplyLead(leads, { profileUrl: "https://www.linkedin.com/in/bo", profileName: "Bo" })).toBeNull();
  });
});
