import LinkedInProfileTool from "../linkedin-profile-tool";
import { ToolPageChrome } from "../tool-page";
import { getTool } from "../tools-data";
import { createPageMetadata } from "../../seo";

const tool = getTool("linkedin-profile-rating")!;

export const metadata = createPageMetadata({
  title: `${tool.title} - Omentir`,
  description: tool.description,
  path: tool.href,
  keywords: [...tool.keywords],
});

export default function LinkedInProfileRatingPage() {
  return (
    <ToolPageChrome tool={tool}>
      <LinkedInProfileTool mode="rating" />
    </ToolPageChrome>
  );
}
