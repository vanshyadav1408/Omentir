export const FEATURE_NAV_ITEMS = [
  { label: "Steal Customers", href: "/features/steal-customers", icon: "target" },
  { label: "AI LinkedIn outreach", href: "/features/ai-linkedin-outreach", icon: "message" },
  { label: "Lead finders", href: "/features/lead-finders", icon: "search" },
  { label: "Unified inbox", href: "/features/unified-inbox", icon: "inbox" },
  { label: "Agent API and MCP", href: "/features/agent-api-and-mcp", icon: "network" },
  { label: "My Product", href: "/features/my-product", icon: "product" },
  { label: "Campaigns and send windows", href: "/features/campaigns-and-send-windows", icon: "send" },
  { label: "LinkedIn account safety", href: "/features/linkedin-account-safety", icon: "shield" },
  { label: "Lead groups and scoring", href: "/features/lead-groups-and-scoring", icon: "people" },
  { label: "Open source self-hosting", href: "/features/open-source-self-hosting", icon: "code" },
  { label: "Reply drafts", href: "/features/reply-drafts", icon: "inbox" },
  { label: "Demo booking", href: "/features/demo-booking", icon: "send" },
  { label: "LinkedIn warmup", href: "/features/linkedin-warmup", icon: "shield" },
] as const;

export type FeatureNavIcon = (typeof FEATURE_NAV_ITEMS)[number]["icon"];
