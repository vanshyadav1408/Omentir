import { describe, expect, test } from "bun:test";
import { agentMcpTools, agentToolInputSchemas } from "./agent-tools";

describe("agent MCP tools", () => {
  test("exposes the product UI actions that used to be app-only, so an API key can run the same workspace work", () => {
    const names = agentMcpTools.map((tool) => tool.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "omentir_draft_agent_setup",
        "omentir_analyze_website",
        "omentir_import_csv_leads",
        "omentir_export_leads",
        "omentir_delete_group",
        "omentir_run_scheduled_action_now",
        "omentir_stop_lead_outreach",
        "omentir_list_inbox",
        "omentir_get_chat_messages",
        "omentir_reply_to_chat",
        "omentir_complete_follow_up",
        "omentir_list_workspaces",
        "omentir_switch_workspace",
      ]),
    );
    expect(names).not.toContain("omentir_create_api_key");
    expect(names).not.toContain("omentir_connect_linkedin");
    expect(names).not.toContain("omentir_create_workspace");
    expect(names).not.toContain("omentir_delete_workspace");
  });

  test("switch workspace rebinds the existing token because minting a second key is human-only", () => {
    expect(agentToolInputSchemas.omentir_switch_workspace.required).toEqual(["workspaceId"]);
    expect(agentMcpTools.find((tool) => tool.name === "omentir_switch_workspace")?.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: false,
    });
  });

  test("create agent accepts outreach-only and custom steps because those are how the wizard launches CSV campaigns", () => {
    const mode = agentToolInputSchemas.omentir_create_agent.properties.mode;
    expect(mode.enum).toContain("outreach");
    expect(agentToolInputSchemas.omentir_create_agent.properties.csvContents).toBeTruthy();
    expect(agentToolInputSchemas.omentir_create_agent.properties.steps).toBeTruthy();
  });

  test("list leads has offset because a 500-row fetch used to hide people the Leads page still showed", () => {
    expect(agentToolInputSchemas.omentir_list_leads.properties.offset).toBeTruthy();
  });
});
