"use client";

import Link from "next/link";
import { useState } from "react";

export type BlogRow = {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
};

export default function BlogsTable({ rows, categories }: { rows: BlogRow[]; categories: string[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const visible = rows.filter(
    (row) =>
      (!category || row.category === category) &&
      (!needle || row.title.toLowerCase().includes(needle) || row.description.toLowerCase().includes(needle)),
  );

  return (
    <section aria-label="All posts" className="mt-16 md:mt-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm" role="group" aria-label="Filter by category">
          {[null, ...categories].map((item) => (
            <button
              key={item ?? "all"}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={`cursor-pointer transition-colors ${
                category === item
                  ? "text-[var(--site-text)]"
                  : "text-[var(--site-text-2)] hover:text-[var(--site-text)]"
              }`}
            >
              {item ?? "All"}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          aria-label="Search posts"
          className="h-8 w-full rounded-full border border-[var(--site-border)] bg-[var(--site-card)] px-4 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-3)] focus:border-[var(--site-text-3)] sm:w-56"
        />
      </div>

      <ul className="blog-table mt-5">
        {visible.map((row) => (
          <li key={row.slug}>
            <Link href={`/blogs/${row.slug}`} className="blog-table-row">
              <span className="text-[var(--site-text-2)]">
                {row.date} &middot; {row.category}
              </span>
              <span className="min-w-0 text-[var(--site-text)]">{row.title}</span>
              <span className="hidden text-[var(--site-text-2)] md:block">{row.author}</span>
              <span className="hidden text-right text-[var(--site-text-2)] md:block">{row.readTime}</span>
            </Link>
          </li>
        ))}
        {visible.length === 0 ? (
          <li className="px-4 py-6 text-sm text-[var(--site-text-2)]">No posts match that search.</li>
        ) : null}
      </ul>
    </section>
  );
}
