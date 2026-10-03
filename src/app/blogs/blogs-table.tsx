"use client";

import { useState } from "react";
import BlogCard, { type BlogCardData } from "./blog-card";

export type BlogRow = BlogCardData & { description: string };

// Posts shown at first and added by each "Show more" (three full rows of
// the three-column card grid).
const PAGE_SIZE = 9;

/** Calendly-style blog index: category pills and search, the newest post as
 *  a wide featured row, then a three-column grid of image cards. */
export default function BlogsTable({ rows, categories }: { rows: BlogRow[]; categories: string[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);

  const needle = query.trim().toLowerCase();
  const visible = rows.filter(
    (row) =>
      (!category || row.category === category) &&
      (!needle || row.title.toLowerCase().includes(needle) || row.description.toLowerCase().includes(needle)),
  );
  // Only the unfiltered list opens on a featured post.
  const featured = !category && !needle ? visible[0] : undefined;
  const grid = featured ? visible.slice(1) : visible;

  return (
    <section aria-label="All posts">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[null, ...categories].map((item) => (
            <button
              key={item ?? "all"}
              type="button"
              aria-pressed={category === item}
              onClick={() => {
                setCategory(item);
                setShown(PAGE_SIZE);
              }}
              className="cal-filter-pill"
            >
              {item ?? "All"}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setShown(PAGE_SIZE);
          }}
          placeholder="Search"
          aria-label="Search posts"
          className="site-input w-full sm:w-64"
        />
      </div>

      {featured ? (
        <div className="cal-post-featured-wrap">
          <BlogCard post={featured} featured />
        </div>
      ) : null}

      <ul className="cal-post-grid mt-12">
        {/* Every post stays in the HTML so crawlers find a link to it; the
            ones past "Show more" are only hidden. */}
        {grid.map((row, index) => (
          <li key={row.slug} hidden={index >= shown}>
            <BlogCard post={row} />
          </li>
        ))}
        {visible.length === 0 ? (
          <li className="py-6 text-sm text-[var(--site-text-2)]">No posts match that search.</li>
        ) : null}
      </ul>

      {grid.length > shown ? (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((count) => count + PAGE_SIZE)}
            className="site-btn site-btn-outline"
          >
            Show more
          </button>
        </div>
      ) : null}
    </section>
  );
}
