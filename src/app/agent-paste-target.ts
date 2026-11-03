/** Which agent a page's paste-ready prompt is for, from the page slug.
 *  Undefined keeps the Grok Bot default used by the older pages. */
export function agentPasteTarget(slug: string): string | undefined {
  if (slug.includes("meta-muse")) return "Meta Muse";
  if (slug.includes("openai-dot") || slug.includes("sales-dot")) return "your Dot";
  if (slug.includes("manus-cue") || slug.includes("cue-agent")) return "Cue";
  if (slug.includes("gemini-spark")) return "Gemini Spark";
  if (slug.includes("gemini-coworker")) return "your Gemini agent";
  if (slug.includes("claude-duet")) return "Claude Duet";
  if (slug.includes("claude-cowork")) return "Cowork";
  if (slug.includes("autopilot")) return "Autopilot";
  if (slug.includes("workspace-agent")) return "your workspace agent";
  // Guides for the main Manus app (Automations, Studio), which Cue users run alongside it.
  if (slug.startsWith("manus-")) return "Manus";
  return undefined;
}
