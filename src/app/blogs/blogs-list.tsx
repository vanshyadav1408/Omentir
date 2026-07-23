"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { BlogItem } from "./blog-data";
import { TextField } from "@/app/ui/text-field";

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
  const dateDifference =
    getPublishedDateTimestamp(b) - getPublishedDateTimestamp(a);

  if (dateDifference !== 0) {
    return dateDifference;
  }

  if (a.slug === b.slug) {
    return 0;
  }

  return a.slug > b.slug ? 1 : -1;
}

export default function BlogsList({ blogs, categories }: BlogsListProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Curate 6 featured articles
  const featuredSlugs = useMemo(() => [
    "omentir-is-now-open-source",
    "introducing-omentir-v2",
    "openclaw-vs-chatgpt-sales",
    "mcp-outreach-tools",
    "openclaw-outreach-flows",
    "mcp-linkedin-outreach"
  ], []);

  const featuredBlogs = useMemo(() => {
    return blogs.filter(blog => featuredSlugs.includes(blog.slug))
      .sort((a, b) => featuredSlugs.indexOf(a.slug) - featuredSlugs.indexOf(b.slug));
  }, [blogs, featuredSlugs]);

  // Filter remaining blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      // Exclude all featured blogs from the list below to avoid duplicates
      if (featuredSlugs.includes(blog.slug)) return false;

      const matchesCategory =
        selectedCategory === "All" || blog.category === selectedCategory;

      const matchesSearch =
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    }).sort(sortByNewestPublishedDate);
  }, [blogs, selectedCategory, searchQuery, featuredSlugs]);

  return (
    <div className="w-full">
      {/* ========================================== */}
      {/* FEATURED ARTICLES SECTION (Asymmetric Grid) */}
      {/* ========================================== */}
      <div className="mb-20">
        <h2
          style={{ fontFamily: "var(--font-varta)" }}
          className="mb-8 border-b border-[var(--md-sys-color-outline-variant)] pb-3 text-2xl font-semibold text-[var(--md-sys-color-on-surface)]"
        >
          Featured Articles
        </h2>

        {featuredBlogs.map((blog, idx) => (
          <article
            key={blog.slug}
            className="group relative mb-8 overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] shadow-[var(--md-sys-card-elevation-rest)] transition-all duration-300 hover:border-[var(--md-sys-color-primary)] hover:shadow-[var(--md-sys-card-elevation-hover)]"
          >
            <Link href={`/blogs/${blog.slug}`} className="grid items-center gap-6 p-6 sm:p-8 md:grid-cols-2">
              {/* Aspect Ratio 2:1 Container */}
              <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-[var(--md-sys-color-surface-container-low)]">
                <Image
                  src={blog.bannerSrc}
                  alt={blog.bannerAlt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={idx < 2}
                />
              </div>

              <div className="flex h-full flex-col justify-between py-2">
                <div>
                  <div className="mb-4 flex items-center gap-3 text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                    <span className="rounded-full bg-[var(--md-sys-color-primary)] px-3 py-1 font-bold text-[var(--md-sys-color-on-primary)]">
                      {blog.category}
                    </span>
                    <span aria-hidden="true">&bull;</span>
                    <span>{blog.publishedDate}</span>
                    <span aria-hidden="true">&bull;</span>
                    <span>{blog.readTime}</span>
                  </div>

                  <h3
                    style={{ fontFamily: "var(--font-varta)" }}
                    className="mb-4 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] transition-colors duration-200 group-hover:text-[var(--md-sys-color-primary)] sm:text-3xl"
                  >
                    {blog.title}
                  </h3>

                  <p className="mb-6 text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)] sm:text-base">
                    {blog.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-[var(--md-sys-color-on-surface)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--md-sys-color-primary)]">
                  Read Article
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {/* ========================================== */}
      {/* ALL ARTICLES & INTERACTIVE FILTER SECTION  */}
      {/* ========================================== */}
      <div className="mt-20">
        <div className="mb-8 flex flex-col justify-between gap-6 border-b border-[var(--md-sys-color-outline-variant)] pb-5 md:flex-row md:items-center">
          <div>
            <h2
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-2xl font-semibold text-[var(--md-sys-color-on-surface)]"
            >
              All Library Articles
            </h2>
            <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
              Browse our complete library of tactical outbound resources
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full max-w-xs">
            <TextField
              variant="filled"
              label="Search articles"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leadingIcon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a1 1 0 11-1.414 1.415l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              trailingIcon={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="grid h-10 w-10 place-items-center text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                    aria-label="Clear search"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                ) : null
              }
            />
          </div>
        </div>

        {/* Filter categories tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "border-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-on-surface)] text-[var(--md-sys-color-surface)] shadow-sm"
                    : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-state-hover)] hover:text-[var(--md-sys-color-on-surface)]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Dynamic Articles Grid */}
        {filteredBlogs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBlogs.map((blog) => (
              <article
                key={blog.slug}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-5 shadow-[var(--md-sys-card-elevation-rest)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--md-sys-color-primary)] hover:shadow-[var(--md-sys-card-elevation-hover)]"
              >
                <Link href={`/blogs/${blog.slug}`} className="flex h-full flex-col justify-between">
                  <div>
                    {/* Fixed 2:1 aspect ratio banner */}
                    <div className="relative mb-4 aspect-[2/1] w-full overflow-hidden rounded-lg bg-[var(--md-sys-color-surface-container-low)]">
                      <Image
                        src={blog.bannerSrc}
                        alt={blog.bannerAlt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>

                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)]">
                      <span className="rounded bg-[var(--md-sys-color-primary-container)] px-2 py-0.5 tracking-wider text-[var(--md-sys-color-on-primary-container)]">
                        {blog.category}
                      </span>
                      <span aria-hidden="true">&bull;</span>
                      <span>{blog.publishedDate}</span>
                    </div>

                    <h3
                      style={{ fontFamily: "var(--font-varta)" }}
                      className="mb-2 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-[var(--md-sys-color-on-surface)] transition-colors duration-200 group-hover:text-[var(--md-sys-color-primary)]"
                    >
                      {blog.title}
                    </h3>

                    <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                      {blog.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[var(--md-sys-color-on-surface)] transition-colors group-hover:text-[var(--md-sys-color-primary)]">
                    <span>Read Article</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-xl border border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] py-16 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              className="mx-auto mb-4 h-12 w-12 text-[var(--md-sys-color-on-surface-variant)]"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 7.5h1.5m-1.5 3h1.5m-7.49 4.75h13.48c.452 0 .81-.368.81-.82V5.57c0-.451-.358-.82-.81-.82H4.51c-.452 0-.81.369-.81.82v8.86c0 .452.358.82.81.82zm1.66 4.9H17.83c1.12 0 1.63-1.309.84-2.1l-1.83-1.83a.75.75 0 00-1.06 0l-1.83 1.83a.75.75 0 000 1.06l1.83 1.83a.75.75 0 001.06 0z"
              />
            </svg>
            <h3
              style={{ fontFamily: "var(--font-varta)" }}
              className="mb-1 text-lg font-semibold text-[var(--md-sys-color-on-surface)]"
            >
              No articles found
            </h3>
            <p className="mb-6 px-4 text-sm text-[var(--md-sys-color-on-surface-variant)]">
              We couldn&apos;t find any playbooks matching &quot;{searchQuery}&quot; under category &quot;{selectedCategory}&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--md-sys-color-on-surface)] px-4 text-xs font-semibold text-[var(--md-sys-color-surface)] shadow-sm transition-colors hover:opacity-90"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
