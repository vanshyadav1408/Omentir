import { createPageMetadata } from "../seo";
import SeoIndexPageView from "../seo-content/index-page";
import { ALL_INTEGRATIONS } from "./integration-data";

export const metadata = createPageMetadata({
  title: "Integrations - Omentir",
  description:
    "Connect Omentir with Claude, ChatGPT, Cursor, and MCP. Operator paths for LinkedIn lead discovery and outreach without sharing your LinkedIn password.",
  path: "/integrations",
  keywords: [
    "Omentir integrations",
    "Claude Omentir",
    "ChatGPT Omentir",
    "Cursor MCP sales",
    "Omentir MCP server",
  ],
});

export default function IntegrationsIndexPage() {
  return (
    <SeoIndexPageView
      family="integrations"
      title="Omentir integrations"
      description="Concrete connect paths for the AI apps and protocols people actually use to operate Omentir."
      pages={ALL_INTEGRATIONS}
    />
  );
}
