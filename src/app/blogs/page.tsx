import JsonLd from "../json-ld";
import { MarketingHeader, MarketingFooter } from "../marketing-shell";
import BlogsList from "./blogs-list";
import { ALL_BLOGS, CATEGORIES } from "./blog-data";
import { createBlogCollectionJsonLd, createPageMetadata } from "../seo";

export const metadata = createPageMetadata({
  title: "Blogs - Omentir",
  description: "Explore tactical, zero-fluff B2B outreach playbooks, connection templates, and guides to scale LinkedIn sales campaigns and book demos consistently.",
  path: "/blogs",
  keywords: [
    "B2B sales blog",
    "LinkedIn outreach templates",
    "outbound sales guide",
    "sales sequence case study",
    "lead generation tactics"
  ],
});

export default function BlogsIndexPage() {
  const jsonLd = createBlogCollectionJsonLd();

  return (
    <main className="min-h-screen bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      <JsonLd id="blogs-jsonld" data={jsonLd} />

      {/* Global Omentir Navigation */}
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative w-full border-b border-[var(--md-sys-color-outline-variant)]">
        <div
          className="grid min-h-[45vh] w-full sm:min-h-[50vh] lg:min-h-[55vh]"
          style={{ gridTemplate: '"hero" 1fr / 1fr' }}
        >
          {/* Foreground content */}
          <div
            className="relative z-10 flex min-w-0 flex-col justify-center pb-12 pt-28 sm:pb-16 sm:pt-36 lg:pt-40"
            style={{ gridArea: "hero" }}
          >
            <div className="mx-auto flex w-full max-w-6xl flex-col items-start px-4 text-left sm:px-8">

              <h1
                style={{ fontFamily: "var(--font-varta)" }}
                className="animate-fade-in mb-6 max-w-4xl text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight"
              >
                The Omentir Library
              </h1>

              <p className="max-w-2xl text-base leading-8 text-[var(--md-sys-color-on-surface-variant)] sm:text-lg">
                Tactical, zero-fluff guides and frameworks designed for solo founders, B2B sales teams, and modern growth operators to turn LinkedIn outreach into booked demos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-8 sm:pb-14">
        <BlogsList blogs={ALL_BLOGS} categories={CATEGORIES} />
      </section>

      {/* Global Omentir Footer */}
      <MarketingFooter />
    </main>
  );
}
