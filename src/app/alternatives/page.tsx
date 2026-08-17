import { createPageMetadata } from "../seo";
import SeoIndexPageView from "../seo-content/index-page";
import { ALL_ALTERNATIVES } from "./alternative-data";

export const metadata = createPageMetadata({
  title: "Outbound tool roundups - Omentir",
  description:
    "Category shortlists for LinkedIn automation, AI SDRs, B2B databases, email sequencers, and Sales Navigator. Honest jobs, not swapped names.",
  path: "/alternatives",
  keywords: [
    "LinkedIn automation alternatives",
    "AI SDR alternatives",
    "B2B database alternatives",
    "Sales Navigator alternatives",
  ],
});

export default function AlternativesIndexPage() {
  return (
    <SeoIndexPageView
      family="alternatives"
      title="Outbound tool roundups"
      description="Pick the category first. Each roundup names the job, the usual tools, and when Omentir is the wrong buy."
      pages={ALL_ALTERNATIVES}
    />
  );
}
