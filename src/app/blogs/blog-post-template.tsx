import { Children, isValidElement, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import FaqAccordion from "../faq-accordion";
import JsonLd from "../json-ld";
import {
  ArticleCrumbs,
  articlePathCrumbs,
  HeroGridBackdrop,
  MarketingHeader,
  MarketingFooter,
} from "../marketing-shell";
import { createBlogJsonLd, createBreadcrumbJsonLd, createFAQJsonLd, normalizeDate, siteUrl, absoluteAssetUrl } from "../seo";
import { MarkdownTwinLink } from "../seo-content/shared";
import { isSanityCdnUrl } from "@/sanity/lib/image";

export interface TocItem {
  id: string;
  label: string;
  level: 1 | 2;
  emoji?: string;
}

export interface BlogPostTemplateProps {
  title: string;
  description: string;
  slug: string;
  author?: {
    name: string;
    avatarUrl: string;
  };
  bannerSrc: string;
  bannerAlt?: string;
  bannerAspectRatio?: "2/1" | "3/2";
  tocItems: readonly TocItem[];
  faqItems?: ReadonlyArray<{ question: string; answer: string }>;
  visibleFaqItems?: ReadonlyArray<{ question: ReactNode; answer: ReactNode }>;
  publishedDate?: string;
  updatedDate?: string;
  category?: string;
  relatedPosts?: ReadonlyArray<{ slug: string; title: string }>;
  children: React.ReactNode;
}

function hasFaqSection(node: ReactNode): boolean {
  return Children.toArray(node).some((child) => {
    if (!isValidElement(child)) return false;
    const props = child.props as { id?: string; children?: ReactNode };
    if (props.id === "faqs" || props.id === "faq" || props.id === "frequently-asked-questions") {
      return true;
    }
    return props.children ? hasFaqSection(props.children) : false;
  });
}

export default function BlogPostTemplate({
  title,
  description,
  slug,
  author = { name: "Vansh Yadav", avatarUrl: "/founder.jpg" },
  bannerSrc,
  bannerAlt = "Blog post banner image",
  bannerAspectRatio,
  tocItems,
  faqItems = [],
  visibleFaqItems,
  publishedDate: publishedDateProp,
  updatedDate: updatedDateProp,
  category: categoryProp,
  relatedPosts,
  children,
}: BlogPostTemplateProps) {
  const canonicalTitle = title;
  const canonicalDescription = description;
  const canonicalBannerSrc = bannerSrc;
  const canonicalBannerAlt = bannerAlt;
  const category = categoryProp ?? "Playbooks";
  const publishedDate = publishedDateProp ?? "";
  const updatedDate = updatedDateProp || publishedDate;
  const relatedBlogs = relatedPosts ? relatedPosts.slice(0, 4) : [];
  const hasVisibleFaqs = hasFaqSection(children);
  const faqTocItem = tocItems.find((item) => item.label.toLowerCase().includes("faq"));
  const faqSectionId = faqTocItem?.id ?? "faqs";
  const renderedFaqItems = visibleFaqItems ?? faqItems;
  const jsonLd = [
    createBlogJsonLd({
      title: canonicalTitle,
      description: canonicalDescription,
      url: `${siteUrl}/blogs/${slug}`,
      publishedDate,
      modifiedDate: updatedDate,
      authorName: author.name,
      section: category,
      images: canonicalBannerSrc ? [absoluteAssetUrl(canonicalBannerSrc)] : [],
    }),
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: "Blogs", url: `${siteUrl}/blogs` },
      { name: canonicalTitle, url: `${siteUrl}/blogs/${slug}` },
    ]),
    ...(faqItems.length > 0 ? [createFAQJsonLd(faqItems)] : []),
  ];

  return (
    <>
      <JsonLd id={`blog-jsonld-${slug}`} data={jsonLd} />
      <main className="blog-post-page min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
        <MarketingHeader transparentAtTop />
        <div className="relative">
          <HeroGridBackdrop height="h-[60vh]" />
          <article className="omentir-secondary-width relative z-10 min-w-0 pb-16 pt-28 md:pb-24 md:pt-32">
            <ArticleCrumbs crumbs={articlePathCrumbs("blogs", slug)} />

            <h1
              style={{ fontFamily: "var(--font-varta)" }}
              className="max-w-2xl text-2xl font-semibold leading-snug tracking-tight text-[var(--md-sys-color-on-surface)] md:text-3xl md:leading-snug"
            >
              {canonicalTitle}
            </h1>

            <div className="mt-6 flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
                <Image
                  src={author.avatarUrl}
                  alt={author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                  {author.name}
                </div>
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  Published <time dateTime={normalizeDate(publishedDate)}>{publishedDate}</time>
                  {updatedDate !== publishedDate ? (
                    <>
                      {" "}
                      <span aria-hidden="true">&bull;</span> Updated{" "}
                      <time dateTime={normalizeDate(updatedDate)}>{updatedDate}</time>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {canonicalBannerSrc ? (
              <div
                className={`relative z-0 mt-8 w-full overflow-hidden rounded-xl bg-[var(--md-sys-color-surface-container-low)] ${
                  bannerAspectRatio === "3/2" ? "aspect-[3/2]" : "aspect-[2/1]"
                }`}
              >
                <Image
                  src={canonicalBannerSrc}
                  alt={canonicalBannerAlt}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 768px"
                  unoptimized={isSanityCdnUrl(canonicalBannerSrc)}
                />
              </div>
            ) : null}

            <div className="blog-article prose prose-zinc mt-12 max-w-none space-y-6 text-left text-base font-medium leading-8 text-[var(--md-sys-color-on-surface)] md:mt-16">
              {children}
            </div>

            {faqItems.length > 0 && !hasVisibleFaqs ? (
              <section id={faqSectionId} className="mt-16 md:mt-20">
                <h2
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--md-sys-color-on-surface)] md:text-3xl"
                >
                  Frequently asked <span className="text-gradient-brand">questions</span>
                </h2>
                <div className="mt-6 md:mt-8">
                  <FaqAccordion items={renderedFaqItems} />
                </div>
              </section>
            ) : null}

            {relatedBlogs.length > 0 ? (
              <section id="related" className="mt-16 md:mt-20">
                <h2
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
                >
                  Related articles
                </h2>
                <ul className="divide-y divide-[var(--md-sys-color-outline-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
                  {relatedBlogs.map((blog) => (
                    <li key={blog.slug}>
                      <Link href={`/blogs/${blog.slug}`} className="group block py-4">
                        <span className="font-semibold text-[var(--md-sys-color-on-surface)] transition-colors group-hover:text-[var(--md-sys-color-primary)]">
                          {blog.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <MarkdownTwinLink path={`/blogs/${slug}`} title={canonicalTitle} />

            <div className="mt-16 rounded-3xl border-2 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] px-6 py-8 text-center md:mt-20 md:px-10 md:py-10">
              <p className="text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">
                Run the outreach from your own LinkedIn account
              </p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
                Omentir finds ICP-fit buyers, drafts connection notes and messages, and keeps
                replies in one inbox. You still choose the daily send limits.
              </p>
              <Link
                href="/signup"
                className="m3-btn m3-btn-filled-secondary mt-6 inline-flex h-11 cursor-pointer px-6 text-sm"
              >
                Try Omentir
              </Link>
            </div>
          </article>
        </div>
        <MarketingFooter />
      </main>
    </>
  );
}
