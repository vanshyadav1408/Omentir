import { Children, isValidElement, type ReactNode } from "react";
import Link from "next/link";
import FaqAccordion from "../faq-accordion";
import JsonLd from "../json-ld";
import { MarketingHeader, MarketingFooter } from "../marketing-shell";
import BlogPostGrid from "./blog-post-grid";
import { createBlogJsonLd, createBreadcrumbJsonLd, createFAQJsonLd, siteUrl } from "../seo";
import { ALL_BLOGS } from "./blog-data";

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
  publishedDate?: string;
  updatedDate?: string;
  author?: {
    name: string;
    avatarUrl: string;
  };
  bannerSrc: string;
  bannerAlt?: string;
  tocItems: readonly TocItem[];
  faqItems?: ReadonlyArray<{ question: string; answer: string }>;
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
  publishedDate = "May 20, 2026",
  updatedDate = "May 21, 2026",
  author = { name: "Vansh Yadav", avatarUrl: "/founder.jpg" },
  bannerSrc,
  bannerAlt = "Blog post banner image",
  tocItems,
  faqItems = [],
  children,
}: BlogPostTemplateProps) {
  const blogItem = ALL_BLOGS.find((b) => b.slug === slug);
  const category = blogItem ? blogItem.category : "Playbooks";
  const relatedBlogs = ALL_BLOGS.filter(
    (blog) => blog.slug !== slug && blog.category === category
  ).slice(0, 3);
  const hasVisibleFaqs = hasFaqSection(children);
  const faqTocItem = tocItems.find((item) => item.label.toLowerCase().includes("faq"));
  const faqSectionId = faqTocItem?.id ?? "faqs";
  const jsonLd = [
    createBlogJsonLd({
      title,
      description,
      url: `${siteUrl}/blogs/${slug}`,
      publishedDate,
      modifiedDate: updatedDate,
      authorName: author.name,
      section: category,
      images: [bannerSrc.startsWith("http") ? bannerSrc : `${siteUrl}${bannerSrc}`],
    }),
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: "Blogs", url: `${siteUrl}/blogs` },
      { name: title, url: `${siteUrl}/blogs/${slug}` },
    ]),
    ...(faqItems.length > 0 ? [createFAQJsonLd(faqItems)] : []),
  ];

  return (
    <main className="blog-post-page relative isolate min-h-screen bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      <JsonLd id={`blog-jsonld-${slug}`} data={jsonLd} />
      {/* Shared Global Marketing Header */}
      <MarketingHeader />

      {/* Dedicated Premium Hero Section */}
      <section className="relative z-0 w-full border-b border-[var(--md-sys-color-outline-variant)]">
        <div
          className="grid min-h-[50vh] w-full sm:min-h-[55vh] lg:min-h-[60vh]"
          style={{ gridTemplate: '"hero" 1fr / 1fr' }}
        >
          {/* Foreground content - vertically centered but left-aligned block */}
          <div
            className="relative z-10 flex min-w-0 flex-col justify-center pb-12 pt-28 sm:pb-16 sm:pt-36 lg:pt-40"
            style={{ gridArea: "hero" }}
          >
            <div className="mx-auto flex w-full max-w-6xl flex-col items-start px-4 text-left sm:px-8">
              {/* Breadcrumbs inside the Hero */}
              <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                <Link
                  href="/"
                  className="flex items-center transition-colors hover:text-[var(--md-sys-color-on-surface)]"
                  aria-label="Home"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </Link>
                <span className="font-normal text-[var(--md-sys-color-outline)]" aria-hidden="true">
                  /
                </span>
                <Link
                  href="/blogs"
                  className="transition-colors hover:text-[var(--md-sys-color-on-surface)]"
                >
                  Blogs
                </Link>
                <span className="font-normal text-[var(--md-sys-color-outline)]" aria-hidden="true">
                  /
                </span>
                <span className="line-clamp-1 text-[var(--md-sys-color-on-surface)]">{title}</span>
              </nav>

              <h1
                style={{ fontFamily: "var(--font-varta)" }}
                className="mb-6 max-w-4xl text-[2rem] font-semibold leading-[1.12] tracking-tight text-[var(--md-sys-color-on-surface)] min-[380px]:text-[2.25rem] sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight"
              >
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--md-sys-color-on-surface-variant)] sm:text-lg">
                {description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Blog Wrapper for Body Content */}
      <div className="relative z-0 mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-16">
        {/* Interactive Blog Content & Dynamic Sidebar Navigation */}
        <BlogPostGrid
          author={author}
          publishedDate={publishedDate}
          bannerSrc={bannerSrc}
          bannerAlt={bannerAlt}
          slug={slug}
          category={category}
          title={title}
          tocItems={tocItems}
        >
          <>
            {children}
            {faqItems.length > 0 && !hasVisibleFaqs ? (
              <>
                <h2
                  id={faqSectionId}
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="mt-10 scroll-mt-28 border-b border-[var(--md-sys-color-outline-variant)] pb-2 pt-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
                >
                  Frequently Asked Questions
                </h2>
                <FaqAccordion items={faqItems} />
              </>
            ) : null}
          </>
        </BlogPostGrid>
      </div>

      {relatedBlogs.length > 0 ? (
        <section className="relative z-0 mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-24">
          <div className="border-t border-[var(--md-sys-color-outline-variant)] pt-14 sm:pt-16">
            <h2
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
            >
              Related articles
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {relatedBlogs.map((blog) => (
                <Link
                  key={blog.slug}
                  href={`/blogs/${blog.slug}`}
                  className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-5 shadow-[var(--md-sys-card-elevation-rest)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--md-sys-color-primary)] hover:shadow-[var(--md-sys-card-elevation-hover)]"
                >
                  <div className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                    {blog.category} <span aria-hidden="true">&bull;</span> {blog.readTime}
                  </div>
                  <h3
                    style={{ fontFamily: "var(--font-varta)" }}
                    className="mt-3 text-base font-semibold leading-snug text-[var(--md-sys-color-on-surface)]"
                  >
                    {blog.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-6 text-[var(--md-sys-color-on-surface-variant)]">
                    {blog.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Shared Global Marketing Footer */}
      <MarketingFooter />
    </main>
  );
}
