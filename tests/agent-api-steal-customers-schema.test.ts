import { describe, expect, test } from "bun:test";
import { createAgentPayloadSchema } from "../src/lib/server/agent-api-operations";

describe("Steal Customers create-agent API schema", () => {
  test("accepts steal_customers with competitor URLs and without ICP filters", () => {
    const parsed = createAgentPayloadSchema.safeParse({
      mode: "steal_customers",
      groupName: "Competitor commenters",
      name: "Steal Customers",
      signalSources: {
        competitorUrls: ["https://www.linkedin.com/company/example-competitor"],
        founderUrls: ["https://www.linkedin.com/in/example-employee"],
      },
      replyHandling: "ai_until_interest",
      sendWindow: "business",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.mode).toBe("steal_customers");
      expect(parsed.data.prompt).toBeUndefined();
      expect(parsed.data.filters).toBeUndefined();
      expect(parsed.data.signalSources.competitorUrls).toHaveLength(1);
      expect(parsed.data.signalSources.founderUrls).toHaveLength(1);
    }
  });

  test("accepts steal_customers with only founder/employee profile URLs", () => {
    const parsed = createAgentPayloadSchema.safeParse({
      mode: "steal_customers",
      groupName: "Employee posters",
      signalSources: {
        founderUrls: ["https://www.linkedin.com/in/competitor-ae"],
      },
    });
    expect(parsed.success).toBe(true);
  });

  test("rejects steal_customers without any competitor or founder/employee URL", () => {
    const parsed = createAgentPayloadSchema.safeParse({
      mode: "steal_customers",
      groupName: "Empty sources",
      signalSources: { competitorUrls: [], founderUrls: [] },
    });
    expect(parsed.success).toBe(false);
  });

  test("still requires prompt and filters for classic lead finders", () => {
    const missing = createAgentPayloadSchema.safeParse({
      mode: "signals",
      groupName: "Classic",
    });
    expect(missing.success).toBe(false);

    const complete = createAgentPayloadSchema.safeParse({
      mode: "signals",
      groupName: "Classic",
      prompt: "Founders of B2B tools",
      filters: {
        titles: ["Founder"],
        industries: ["Software"],
        locations: ["United States"],
        keywords: ["B2B"],
      },
    });
    expect(complete.success).toBe(true);
  });

  test("MCP/API minimal Steal Customers payload is valid end-to-end shape", () => {
    // What an MCP client or REST POST /api/agent/v1/agents body should send.
    const mcpToolArgs = {
      mode: "steal_customers",
      name: "Steal Customers",
      groupName: "Competitor commenters",
      signalSources: {
        competitorUrls: ["https://www.linkedin.com/company/acme-corp"],
        founderUrls: ["https://www.linkedin.com/in/acme-ae"],
      },
      replyHandling: "ai_until_interest",
      sendWindow: "business",
    };
    const parsed = createAgentPayloadSchema.safeParse(mcpToolArgs);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.mode).toBe("steal_customers");
    expect(parsed.data.signalSources.competitorUrls[0]).toContain("acme-corp");
    expect(parsed.data.signalSources.founderUrls[0]).toContain("acme-ae");
    // No ICP required on the wire; server fills from My Product.
    expect(parsed.data.prompt ?? "").toBe("");
    expect(parsed.data.filters).toBeUndefined();
  });
});
