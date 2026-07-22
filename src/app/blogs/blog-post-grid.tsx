import Image from "next/image";
import { BlogPostDesktopToc, BlogPostMobileToc } from "./blog-post-toc";

export interface TocItem {
  id: string;
  label: string;
  level: 1 | 2;
  emoji?: string;
}

export interface BlogPostGridProps {
  author: {
    name: string;
    avatarUrl: string;
  };
  publishedDate: string;
  bannerSrc: string;
  bannerAlt: string;
  slug: string;
  category: string;
  title: string;
  tocItems: readonly TocItem[];
  children: React.ReactNode;
}

export default function BlogPostGrid({
  author,
  publishedDate,
  bannerSrc,
  bannerAlt,
  tocItems,
  children,
}: BlogPostGridProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[1fr_240px] md:gap-12 lg:grid-cols-[1fr_280px] lg:gap-16">

      {/* Left Column: Content + Mobile Collapsible TOC */}
      <div className="w-full max-w-3xl">
        {/* Author Details Block */}
        <div className="mb-8 flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] shadow-sm">
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
              {publishedDate}
            </div>
          </div>
        </div>

        {/* Blog Banner Image — stay below fixed marketing header */}
        <div className="relative z-0 mb-12 aspect-[2/1] w-full overflow-hidden rounded-xl bg-[var(--md-sys-color-surface-container-low)]">
          <Image
            src={bannerSrc}
            alt={bannerAlt}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        <BlogPostMobileToc tocItems={tocItems} />

        <article className="blog-article prose prose-zinc max-w-none space-y-6 text-[1.05rem] leading-relaxed text-[var(--md-sys-color-on-surface)]">
          {children}
        </article>
      </div>

      <BlogPostDesktopToc tocItems={tocItems} />

    </div>
  );
}
