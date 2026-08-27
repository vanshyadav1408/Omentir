/** First ChatGPT connector session. Replace brackets. Keep the last two sentences. */
export const CHATGPT_FIRST_JOB_PROMPT = `You are operating my Omentir workspace from this ChatGPT conversation.

My product helps [buyer] get [result]. Best-fit accounts are [company type, size, region]. Strong signals: [signal]. Skip [bad fit].

You are connected over MCP. You do not have my LinkedIn password. Start with get_context, then list_agents. If no finder matches this ICP, show me a create_agent config and wait for a yes.

This session ends when I close the tab. Do not pretend you will keep working overnight.

Pull up to 30 people. For each one write fit 1-5, the evidence, any risk, and a two-sentence draft that cites a real trigger. If a note could fit two buyers, rewrite it.

Do not send. Do not enroll. Do not sign into LinkedIn.
Do not create, delete, or reply unless I ask in this chat.`;

export const CHATGPT_MCP_URL = "https://omentir.com/api/agent/v1/mcp";
