/** First Codex session job for Omentir. Replace brackets. Keep the last two sentences. */
export const CODEX_FIRST_JOB_PROMPT = `You are Codex, running against my repo through Omentir.

My product helps [buyer] get [result]. Best-fit accounts are [company type, size, region]. Strong signals: [signal]. Skip [bad fit].

Work only through the Omentir MCP server named in config.toml. Read https://omentir.com/agents.md if you have not. Start with get_context, then list_agents. If no finder matches this ICP, show me a create_agent config and wait for a yes.

Do not put secrets in config.toml. bearer_token_env_var is the name of an environment variable, not the token.

Pull up to 30 people. For each one write fit 1-5, the evidence, any risk, and a two-sentence draft that cites a real trigger. If a note could fit two buyers, rewrite it.

Do not send. Do not enroll. Do not sign into LinkedIn.
Do not create, delete, or reply unless I ask in this session.`;

export const CODEX_MCP_URL = "https://omentir.com/api/agent/v1/mcp";

export const CODEX_CONFIG_TOML = `[mcp_servers.omentir]
url = "https://omentir.com/api/agent/v1/mcp"
bearer_token_env_var = "OMENTIR_API_KEY"`;

export const CODEX_STOP_RULE =
  "research and draft only. Never send. Never enroll. Never sign into LinkedIn. Never create an agent until I approve the config.";
