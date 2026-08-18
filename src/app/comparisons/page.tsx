import { createPageMetadata } from "../seo";
import SeoIndexPageView from "../seo-content/index-page";
import { ALL_COMPARISONS } from "./comparison-data";

export const metadata = createPageMetadata({
  title: "AI Sales Tool Alternatives - Omentir",
  description:
    "Honest matchups for Gojiberry, Apollo, Instantly, Smartlead, and other AI sales tools. Channel fit, discovery models, and when Omentir is the better buy.",
  path: "/comparisons",
  keywords: [
    "AI sales tool alternatives",
    "Gojiberry alternatives",
    "Apollo alternatives",
    "Instantly alternatives",
    "Smartlead alternatives",
    "LinkedIn outreach alternatives",
  ],
});

export default function ComparisonsIndexPage() {
  return (
    <SeoIndexPageView
      family="comparisons"
      title="AI sales tool alternatives"
      description="Omentir versus popular AI sales and outbound tools. Channel fit, workflows, and tradeoffs before you choose."
      pages={ALL_COMPARISONS}
      compactHero
    />
  );
}
