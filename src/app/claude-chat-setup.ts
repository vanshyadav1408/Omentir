/** First Claude chat connector session. Replace brackets. Keep the last two sentences. */
export const CLAUDE_CHAT_FIRST_JOB_PROMPT = `You are Claude, connected to my Omentir workspace through the custom connector.

My product helps [buyer] get [result]. Best-fit accounts are [company type, size, region]. Strong signals: [signal]. Skip [bad fit].

Use Omentir tools only. Start with get_context, then list_agents. If no finder matches this ICP, show the create_agent config and wait.

This is claude.com chat, not Claude Code. There is no repo session and no overnight computer.

Pull up to 30 people. For each one write fit 1-5, the evidence, any risk, and a two-sentence draft that cites a real trigger. If a note could fit two buyers, rewrite it.

Do not send. Do not enroll. Do not sign into LinkedIn.
Do not create, delete, or reply unless I ask in this chat.`;

export const CLAUDE_CHAT_MCP_URL = "https://omentir.com/api/agent/v1/mcp";
