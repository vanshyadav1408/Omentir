import Image from "next/image";
import Link from "next/link";
import type { BlogItem } from "@/lib/cms";
import { isSanityCdnUrl } from "@/sanity/lib/image";
import { DEFAULT_BLOG_AUTHOR, shortBlogDate } from "./blog-post-template";
import BlogsTable, { type BlogRow } from "./blogs-table";

type BlogsListProps = {
  blogs: BlogItem[];
};

const CATEGORY_ORDER = [
  "Updates",
  "Playbooks",
  "Outreach",
  "Guides",
  "Case Studies",
  "Copywriting",
  "Automation",
  "Comparisons",
];

const PUBLISHED_MONTH_INDEX: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function getPublishedDateTimestamp(blog: BlogItem) {
  const match = blog.publishedDate.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);

  if (!match) {
    return 0;
  }

  const [, monthName, day, year] = match;
  const month = PUBLISHED_MONTH_INDEX[monthName.toLowerCase()];

  if (!month) {
    return 0;
  }

  return Number(year) * 10000 + month * 100 + Number(day);
}

function sortByNewestPublishedDate(a: BlogItem, b: BlogItem) {
  const dateDifference = getPublishedDateTimestamp(b) - getPublishedDateTimestamp(a);

  if (dateDifference !== 0) {
    return dateDifference;
  }

  if (a.slug === b.slug) {
    return 0;
  }

  return a.slug > b.slug ? 1 : -1;
}

function FeaturedCard({ blog, large = false }: { blog: BlogItem; large?: boolean }) {
  return (
    <Link
      href={`/blogs/${blog.slug}`}
      className={`blog-card group flex min-w-0 flex-col overflow-hidden ${large ? "md:row-span-2" : ""}`}
    >
      <div className={`relative w-full bg-[var(--site-card-2)] ${large ? "aspect-[2/1] md:aspect-auto md:flex-1" : "aspect-[2/1]"}`}>
        {blog.bannerSrc ? (
          <Image
            src={blog.bannerSrc}
            alt={blog.bannerAlt}
            fill
            className="object-cover"
            sizes={large ? "(min-width: 768px) 760px, 100vw" : "(min-width: 768px) 460px, 100vw"}
            priority={large}
            unoptimized={isSanityCdnUrl(blog.bannerSrc)}
          />
        ) : null}
      </div>
      <div className="px-4 pb-4 pt-3 md:px-5 md:pb-5">
        <p className="text-sm text-[var(--site-text-2)]">
          {shortBlogDate(blog.publishedDate)} &middot; {blog.category}
        </p>
        <h2 className={`mt-1 leading-snug text-[var(--site-text)] ${large ? "text-[1.375rem]" : "text-lg"}`}>
          {blog.title}
        </h2>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--site-text-2)]">{blog.description}</p>
        <p className="mt-3 flex items-center gap-2 text-sm text-[var(--site-text-2)]">
          <Image
            src={DEFAULT_BLOG_AUTHOR.avatarUrl}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 rounded-full object-cover"
          />
          {DEFAULT_BLOG_AUTHOR.name} &middot; {blog.readTime}
        </p>
      </div>
    </Link>
  );
}

/** cursor.com/blog layout: three newest posts as cards, then every post in a
 *  filterable table. */
export default function BlogsList({ blogs }: BlogsListProps) {
  const sorted = [...blogs].sort(sortByNewestPublishedDate);
  const [lead, ...rest] = sorted;
  const side = rest.slice(0, 2);

  const present = new Set(sorted.map((blog) => blog.category));
  const categories = [
    ...CATEGORY_ORDER.filter((category) => present.has(category)),
    ...[...present].filter((category) => !CATEGORY_ORDER.includes(category)).sort((a, b) => a.localeCompare(b)),
  ];

  const rows: BlogRow[] = sorted.map((blog) => ({
    slug: blog.slug,
    title: blog.title,
    description: blog.description,
    category: blog.category,
    date: shortBlogDate(blog.publishedDate),
    author: DEFAULT_BLOG_AUTHOR.name,
    readTime: blog.readTime.replace(/^(\d+)\s*min.*$/i, "$1m"),
  }));

  return (
    <>
      {lead ? (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <FeaturedCard blog={lead} large />
          {side.map((blog) => (
            <FeaturedCard key={blog.slug} blog={blog} />
          ))}
        </div>
      ) : null}
      <BlogsTable rows={rows} categories={categories} />
    </>
  );
}
