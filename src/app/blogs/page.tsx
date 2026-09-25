import JsonLd from "../json-ld";
import { MarketingFooter, MarketingHeader } from "../marketing-shell";
import BlogsList from "./blogs-list";
import { getLiveBlogs } from "@/lib/cms";
import { createBlogCollectionJsonLd, createPageMetadata } from "../seo";

const title = "LinkedIn outreach blogs";
const description =
  "Guides, templates, and playbooks for LinkedIn outreach, outbound sequences, and booking demos.";

export const metadata = createPageMetadata({
  title,
  description,
  path: "/blogs",
  keywords: [
    "B2B sales blog",
    "LinkedIn outreach templates",
    "outbound sales guide",
    "sales sequence case study",
    "lead generation tactics",
  ],
});

export default async function BlogsIndexPage() {
  const blogs = await getLiveBlogs();
  const jsonLd = createBlogCollectionJsonLd(blogs);

  return (
    <>
      <JsonLd id="blogs-jsonld" data={jsonLd} />
      <main className="site-theme min-h-screen overflow-x-hidden">
        <MarketingHeader />
        <div className="omentir-primary-width min-w-0 pb-20 pt-24 md:pb-28 md:pt-28">
          {/* cursor.com/blog opens straight on the posts; the heading stays for
              screen readers and search engines. */}
          <h1 className="sr-only">{title}</h1>
          <BlogsList blogs={blogs} />
        </div>
        <MarketingFooter />
      </main>
    </>
  );
}
