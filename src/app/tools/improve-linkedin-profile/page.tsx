import LinkedInProfileTool from "../linkedin-profile-tool";
import { ToolPageChrome } from "../tool-page";
import { getTool } from "../tools-data";
import { createPageMetadata } from "../../seo";

const tool = getTool("improve-linkedin-profile")!;

export const metadata = createPageMetadata({
  title: `${tool.title} - Omentir`,
  description: tool.description,
  path: tool.href,
  keywords: [...tool.keywords],
});

export default function ImproveLinkedInProfilePage() {
  return (
    <ToolPageChrome tool={tool}>
      <LinkedInProfileTool mode="improve" />
    </ToolPageChrome>
  );
}
