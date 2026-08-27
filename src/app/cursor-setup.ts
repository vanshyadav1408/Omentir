/** First session job for Cursor over Omentir MCP. Replace brackets. Keep the last two sentences. */
export const CURSOR_FIRST_JOB_PROMPT = `You are sitting in my editor with the product repo open. Operate sales outreach through Omentir, not by guessing from a homepage.

My product helps [buyer] get [result]. Best-fit accounts are [company type, size, region]. Strong signals: [signal]. Skip [bad fit].

Work only through Omentir MCP or REST. Read https://omentir.com/agents.md if you have not. Start with get_context, then list_agents. If no finder matches this ICP, show me a create_agent config in this chat and wait for a yes.

If My Product disagrees with the file I have open, say so before you pull people.

Pull up to 30 people. For each one write fit 1-5, the evidence, any risk, and a two-sentence draft that cites a real trigger. If a note could fit two buyers, rewrite it.

Do not send. Do not enroll. Do not sign into LinkedIn.
Do not create, delete, or reply unless I ask in this session.`;

export const CURSOR_MCP_URL = "https://omentir.com/api/agent/v1/mcp";

export const CURSOR_STOP_RULE =
  "research and draft only. Never send. Never enroll. Never sign into LinkedIn. Never create an agent until I approve the config.";
