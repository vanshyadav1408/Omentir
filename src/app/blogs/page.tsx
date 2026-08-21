import JsonLd from "../json-ld";
import {
  ArticleCrumbs,
  articlePathCrumbs,
  HeroGridBackdrop,
  MarketingHeader,
  MarketingFooter,
} from "../marketing-shell";
import BlogsList from "./blogs-list";
import { CATEGORIES, liveBlogs } from "./blog-data";
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

export default function BlogsIndexPage() {
  const jsonLd = createBlogCollectionJsonLd();

  return (
    <>
      <JsonLd id="blogs-jsonld" data={jsonLd} />
      <main className="min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
        <MarketingHeader transparentAtTop />
        <div className="relative">
          <HeroGridBackdrop height="h-[60vh]" />
          <div className="omentir-secondary-width relative z-10 min-w-0 pb-16 pt-28 md:pb-24 md:pt-32">
            <ArticleCrumbs crumbs={articlePathCrumbs("blogs")} />

            <h1
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-2xl font-semibold leading-snug tracking-tight text-[var(--md-sys-color-on-surface)] md:text-3xl"
            >
              {title}
            </h1>
            <p className="mt-12 max-w-2xl text-base font-medium leading-8 text-[var(--md-sys-color-on-surface)] md:mt-16">
              {description}
            </p>

            <BlogsList blogs={liveBlogs()} categories={CATEGORIES} />
          </div>
        </div>
        <MarketingFooter />
      </main>
    </>
  );
}
