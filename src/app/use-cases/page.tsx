import { createPageMetadata } from "../seo";
import SeoIndexPageView from "../seo-content/index-page";
import { getSeoPages } from "@/lib/cms";

export const metadata = createPageMetadata({
  title: "LinkedIn outbound use cases - Omentir",
  description:
    "How founders, small sales teams, and operators use Omentir to find buyers on LinkedIn, run outreach, and book demos.",
  path: "/use-cases",
  keywords: [
    "LinkedIn outbound for founders",
    "book demos from LinkedIn",
    "AI SDR use cases",
    "competitor commenter prospecting",
  ],
});

export default async function UseCasesIndexPage() {
  const pages = await getSeoPages("use-cases");
  return (
    <SeoIndexPageView
      family="use-cases"
      title="LinkedIn outbound use cases"
      description="Concrete jobs Omentir is built for. Each page is one motion, not a keyword variant."
      pages={pages}
    />
  );
}
