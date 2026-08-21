import Link from "next/link";
import type { BlogItem } from "./blog-data";

type BlogsListProps = {
  blogs: BlogItem[];
  categories: string[];
};

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

export default function BlogsList({ blogs, categories }: BlogsListProps) {
  const knownCategories = categories.filter((category) => category !== "All");
  const grouped = knownCategories
    .map((category) => ({
      category,
      pages: blogs.filter((blog) => blog.category === category).sort(sortByNewestPublishedDate),
    }))
    .filter((group) => group.pages.length > 0);

  const extraCategories = [
    ...new Set(
      blogs
        .map((blog) => blog.category)
        .filter((category) => !knownCategories.includes(category))
    ),
  ].sort((a, b) => a.localeCompare(b));

  const groups = [
    ...grouped,
    ...extraCategories.map((category) => ({
      category,
      pages: blogs.filter((blog) => blog.category === category).sort(sortByNewestPublishedDate),
    })),
  ];

  return (
    <div className="mt-16 space-y-14 md:mt-20">
      {groups.map((group) => (
        <section key={group.category}>
          <h2
            style={{ fontFamily: "var(--font-varta)" }}
            className="border-b border-[var(--md-sys-color-outline-variant)] pb-2 text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
          >
            {group.category}
          </h2>
          <ul className="divide-y divide-[var(--md-sys-color-outline-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
            {group.pages.map((blog) => (
              <li key={blog.slug}>
                <Link
                  href={`/blogs/${blog.slug}`}
                  className="group block py-4 text-[var(--md-sys-color-on-surface)] transition-colors hover:text-[var(--md-sys-color-primary)]"
                >
                  {blog.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
