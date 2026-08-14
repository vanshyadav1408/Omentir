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
