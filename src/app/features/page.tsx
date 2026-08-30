import { createPageMetadata } from "../seo";
import SeoIndexPageView from "../seo-content/index-page";
import { getSeoPages } from "@/lib/cms";

export const metadata = createPageMetadata({
  title: "Omentir features - Omentir",
  description:
    "LinkedIn lead discovery, AI outreach, reply drafts, demo booking, campaigns, account safety, and agent API. One workspace for B2B outbound.",
  path: "/features",
  keywords: [
    "Omentir features",
    "LinkedIn outreach software",
    "AI SDR features",
    "LinkedIn lead finders",
    "Steal Customers",
  ],
});

export default async function FeaturesIndexPage() {
  const pages = await getSeoPages("features");
  return (
    <SeoIndexPageView
      family="features"
      title="Omentir features"
      description="Each page covers one product job with setup steps, honest tradeoffs, and when to use something else."
      pages={pages}
    />
  );
}
