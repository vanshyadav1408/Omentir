import { createPageMetadata } from "../../seo";
import FindLeadsForm from "../find-leads-form";
import { ToolPageChrome } from "../tool-page";
import { getTool } from "../tools-data";

const tool = getTool("find-leads")!;

export const metadata = createPageMetadata({
  title: `${tool.title} - Omentir`,
  description: tool.description,
  path: tool.href,
  keywords: [...tool.keywords],
});

export default function FindLeadsPage() {
  return (
    <ToolPageChrome tool={tool}>
      <FindLeadsForm />
    </ToolPageChrome>
  );
}
