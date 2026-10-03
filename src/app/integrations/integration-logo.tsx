const INTEGRATION_LOGOS: Record<
  string,
  { src: string; name: string; preserveColor?: boolean }
> = {
  claude: { src: "/integration-logos/claude.svg", name: "Claude" },
  chatgpt: { src: "/integration-logos/chatgpt.svg", name: "ChatGPT" },
  cursor: { src: "/integration-logos/cursor.svg", name: "Cursor" },
  mcp: { src: "/integration-logos/mcp.svg", name: "MCP" },
  grok: {
    src: "/integration-logos/grok.svg",
    name: "Grok",
    preserveColor: true,
  },
  "grok-bot": {
    src: "/integration-logos/grok-bot.svg",
    name: "Grok Bot",
    preserveColor: true,
  },
  "meta-muse": {
    src: "/integration-logos/meta-muse.webp",
    name: "Meta Muse",
    preserveColor: true,
  },
  "openai-dots": {
    src: "/integration-logos/openai-dots.webp",
    name: "OpenAI Dots",
    preserveColor: true,
  },
  "manus-cue": {
    src: "/integration-logos/manus-cue.webp",
    name: "Manus Cue",
    preserveColor: true,
  },
  openclaw: {
    src: "/integration-logos/openclaw.svg",
    name: "OpenClaw",
    preserveColor: true,
  },
  "rest-api": {
    src: "/integration-logos/rest-api.svg",
    name: "REST Agent API",
  },
  "claude-code": {
    src: "/integration-logos/claude-code.svg",
    name: "Claude Code",
  },
  codex: {
    src: "/integration-logos/codex.svg",
    name: "Codex",
  },
};

export function integrationName(slug: string) {
  return INTEGRATION_LOGOS[slug]?.name ?? slug;
}

export default function IntegrationLogo({
  slug,
  size = "md",
}: {
  slug: string;
  size?: "sm" | "md";
}) {
  const logo = INTEGRATION_LOGOS[slug];
  if (!logo) return null;

  const box =
    size === "sm"
      ? "h-8 w-8 rounded-lg p-1.5"
      : "h-12 w-12 rounded-xl p-2.5";

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] ${box}`}
    >
      {/* Local copies of the official or published service marks. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.src}
        alt={`${logo.name} logo`}
        className={`h-full w-full object-contain ${logo.preserveColor ? "" : "dark:invert"}`}
      />
    </span>
  );
}

/** Marks drawn in their real brand color. Brands whose mark is black or
 *  white (Cursor, Grok, MCP, Codex) and OpenClaw, which ships its own
 *  colors, keep the default treatment. REST API is Omentir's own icon. */
const BRAND_COLOR: Record<string, string> = {
  claude: "#d97757",
  "claude-code": "#d97757",
  chatgpt: "#10a37f",
  "rest-api": "var(--cal-blue)",
};

/** Marketing logo: the brand-colored mark (the single-color logo file used
 *  as a mask over its brand color) or, for mono brands, the plain logo. */
export function IntegrationMark({ slug }: { slug: string }) {
  const color = BRAND_COLOR[slug];
  if (!color) return <IntegrationLogo slug={slug} />;
  const mask = `url(/integration-logos/${slug}.svg)`;
  return (
    <span className="grid h-12 w-12 place-items-center p-2.5">
      <span
        role="img"
        aria-label={`${integrationName(slug)} logo`}
        className="cal-brand-mark"
        style={{ backgroundColor: color, maskImage: mask, WebkitMaskImage: mask }}
      />
    </span>
  );
}
