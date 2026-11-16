import { describe, expect, test } from "bun:test";
import { buildAgentMetrics, NO_AGENT_METRICS } from "./agent-metrics";

describe("per-agent outreach counts", () => {
  test("stages are cumulative, so a reply also counts as contacted, accepted and messaged", () => {
    const metrics = buildAgentMetrics(
      [{ id: "a1" }],
      [{ id: "l1", sourceAgentId: "a1", outreachStatus: "replied" }],
      [],
    );
    expect(metrics.a1).toMatchObject({ contacted: 1, accepted: 1, messaged: 1, replied: 1 });
  });

  test("a finished enrollment with connectionSentAt still counts the lead as contacted", () => {
    // The enrollment collapsed to stopped and the lead status was never set,
    // but connectionSentAt proves the invite went out.
    const metrics = buildAgentMetrics(
      [{ id: "a1" }],
      [{ id: "l1", sourceAgentId: "a1" }],
      [{ leadId: "l1", status: "stopped", connectionSentAt: "2026-11-01T00:00:00.000Z" }],
    );
    expect(metrics.a1).toMatchObject({ contacted: 1, accepted: 0 });
  });

  test("a lead status written back down does not erase a reply the enrollment recorded", () => {
    const metrics = buildAgentMetrics(
      [{ id: "a1" }],
      [{ id: "l1", sourceAgentId: "a1", outreachStatus: "connected" }],
      [{ leadId: "l1", status: "reply_received" }],
    );
    expect(metrics.a1.replied).toBe(1);
  });

  test("an enrollment that lost its stage defers to the lead's own status", () => {
    const metrics = buildAgentMetrics(
      [{ id: "a1" }],
      [{ id: "l1", sourceAgentId: "a1", outreachStatus: "messaged" }],
      [{ leadId: "l1", status: "error" }],
    );
    expect(metrics.a1).toMatchObject({ contacted: 1, accepted: 1, messaged: 1, replied: 0 });
  });

  test("a lead enrolled twice is counted once, at its furthest enrollment", () => {
    const metrics = buildAgentMetrics(
      [{ id: "a1" }],
      [{ id: "l1", sourceAgentId: "a1" }],
      [
        { leadId: "l1", status: "message_sent" },
        { leadId: "l1", status: "connection_sent" },
      ],
    );
    expect(metrics.a1).toMatchObject({ target: 1, contacted: 1, messaged: 1 });
  });

  test("only leads the agent sourced count, not other leads in a shared group", () => {
    const metrics = buildAgentMetrics(
      [{ id: "a1" }, { id: "a2" }],
      [
        { id: "l1", sourceAgentId: "a1", outreachStatus: "invited" },
        { id: "l2", sourceAgentId: "a2", outreachStatus: "invited" },
        { id: "l3", outreachStatus: "invited" },
      ],
      [],
    );
    expect(metrics.a1).toMatchObject({ target: 1, contacted: 1 });
    expect(metrics.a2).toMatchObject({ target: 1, contacted: 1 });
  });

  test("leads-only agents show their leads but zero outreach, even with stray enrollments", () => {
    const metrics = buildAgentMetrics(
      [{ id: "a1", leadsOnly: true }],
      [{ id: "l1", sourceAgentId: "a1", outreachStatus: "replied" }],
      [{ leadId: "l1", status: "reply_received" }],
    );
    expect(metrics.a1).toEqual({ ...NO_AGENT_METRICS, target: 1 });
  });

  test("accept rate is over contacted and reply rate over messaged, null when nothing to divide", () => {
    const metrics = buildAgentMetrics(
      [{ id: "a1" }, { id: "a2" }],
      [
        { id: "l1", sourceAgentId: "a1", outreachStatus: "invited" },
        { id: "l2", sourceAgentId: "a1", outreachStatus: "connected" },
        { id: "l3", sourceAgentId: "a1", outreachStatus: "messaged" },
        { id: "l4", sourceAgentId: "a1", outreachStatus: "replied" },
        { id: "l5", sourceAgentId: "a2" },
      ],
      [],
    );
    // 3 of 4 contacted accepted; 1 of 2 messaged replied.
    expect(metrics.a1).toMatchObject({ acceptRate: 75, replyRate: 50 });
    expect(metrics.a2).toMatchObject({ target: 1, acceptRate: null, replyRate: null });
  });
});
