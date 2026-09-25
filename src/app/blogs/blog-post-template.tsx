import { Children, isValidElement, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import FaqAccordion from "../faq-accordion";
import JsonLd from "../json-ld";
import { MarketingFooter, MarketingHeader } from "../marketing-shell";
import { createBlogJsonLd, createBreadcrumbJsonLd, createFAQJsonLd, normalizeDate, siteUrl, absoluteAssetUrl } from "../seo";
import { MarkdownTwinLink } from "../seo-content/shared";
import { isSanityCdnUrl } from "@/sanity/lib/image";

/** Every post is written by the founder unless a post says otherwise. */
export const DEFAULT_BLOG_AUTHOR = { name: "Vansh Yadav", avatarUrl: "/founder.jpg" };

/** "September 20, 2026" → "Sep 20, 2026", the way cursor.com/blog prints dates. */
export function shortBlogDate(date: string) {
  return date.replace(/^([A-Za-z]{3})[A-Za-z]*(\s)/, "$1$2");
}

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
  author = DEFAULT_BLOG_AUTHOR,
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
      <main className="blog-post-page site-theme min-h-screen overflow-x-hidden">
        <MarketingHeader />
        {/* cursor.com blog post layout: crumb on the left, one reading column. */}
        <div className="omentir-primary-width grid min-w-0 gap-6 pb-20 pt-28 md:grid-cols-[12rem_minmax(0,42rem)] md:gap-16 md:pb-28 md:pt-32 lg:grid-cols-[14rem_minmax(0,42rem)] lg:gap-24">
          <nav aria-label="Breadcrumb" className="text-sm text-[var(--site-text-2)] md:sticky md:top-28 md:self-start">
            <Link href="/blogs" className="transition-colors hover:text-[var(--site-text)]">
              Blog
            </Link>{" "}
            / {category}
          </nav>

          <article className="min-w-0">
            <p className="text-sm text-[var(--site-text-2)]">
              <time dateTime={normalizeDate(publishedDate)}>{shortBlogDate(publishedDate)}</time>
              {updatedDate !== publishedDate ? (
                <>
                  {" "}
                  &middot; Updated <time dateTime={normalizeDate(updatedDate)}>{shortBlogDate(updatedDate)}</time>
                </>
              ) : null}
            </p>
            <h1 className="mt-1 text-[1.75rem] leading-tight tracking-[-0.0125em] text-[var(--site-text)] md:text-[2rem]">
              {canonicalTitle}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-[var(--site-text-2)]">
              <Image
                src={author.avatarUrl}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 rounded-full object-cover"
              />
              {author.name}
            </p>

            {canonicalBannerSrc ? (
              <div
                className={`relative z-0 mt-8 w-full overflow-hidden rounded-[16px] border border-[var(--site-border)] bg-[var(--site-card)] ${
                  bannerAspectRatio === "3/2" ? "aspect-[3/2]" : "aspect-[2/1]"
                }`}
              >
                <Image
                  src={canonicalBannerSrc}
                  alt={canonicalBannerAlt}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 672px"
                  unoptimized={isSanityCdnUrl(canonicalBannerSrc)}
                />
              </div>
            ) : null}

            {tocItems.length > 0 ? (
              <details open className="blog-toc mt-8">
                <summary>Table of Contents</summary>
                <ol>
                  {tocItems.map((item) => (
                    <li key={item.id} className={item.level === 2 ? "pl-4" : undefined}>
                      <a href={`#${item.id}`}>{item.label}</a>
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}

            <div
              className="blog-article prose prose-zinc mt-10 max-w-none space-y-6 text-left text-base leading-7 text-[var(--site-text)]"
              data-blog-link-tone="olive"
            >
              {children}
            </div>

            {faqItems.length > 0 && !hasVisibleFaqs ? (
              <section id={faqSectionId} className="mt-16">
                <h2 className="text-[1.375rem] leading-tight text-[var(--site-text)]">
                  Frequently asked questions
                </h2>
                <div className="mt-6">
                  <FaqAccordion items={renderedFaqItems} />
                </div>
              </section>
            ) : null}

            {relatedBlogs.length > 0 ? (
              <section id="related" className="mt-16">
                <h2 className="text-sm text-[var(--site-text-2)]">Related articles</h2>
                <ul className="blog-table mt-4">
                  {relatedBlogs.map((blog) => (
                    <li key={blog.slug}>
                      <Link href={`/blogs/${blog.slug}`} className="block px-4 py-3 text-sm text-[var(--site-text)] transition-colors hover:bg-[var(--site-card-2)]">
                        {blog.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <MarkdownTwinLink path={`/blogs/${slug}`} title={canonicalTitle} />

            <div className="mt-16 rounded-[16px] border border-[var(--site-border)] bg-[var(--site-card)] px-6 py-8 md:px-8">
              <p className="text-lg text-[var(--site-text)]">
                Run the outreach from your own LinkedIn account
              </p>
              <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--site-text-2)]">
                Omentir finds ICP-fit buyers, drafts connection notes and messages, and keeps
                replies in one inbox. You still choose the daily send limits.
              </p>
              <Link href="/signup" className="site-btn site-btn-sm site-btn-primary mt-6">
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
