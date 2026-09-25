import type { BlogItem } from "@/lib/cms";
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

/** Every post, newest first, in a filterable table. Nothing is pinned. */
export default function BlogsList({ blogs }: BlogsListProps) {
  const sorted = [...blogs].sort(sortByNewestPublishedDate);

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

  return <BlogsTable rows={rows} categories={categories} />;
}
