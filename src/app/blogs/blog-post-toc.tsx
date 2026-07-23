"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  label: string;
  level: 1 | 2;
  emoji?: string;
}

interface BlogPostTocProps {
  tocItems: readonly TocItem[];
}

function useActiveSection(tocItems: readonly TocItem[]) {
  const [activeSection, setActiveSection] = useState(tocItems[0]?.id || "");

  useEffect(() => {
    if (tocItems.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: "-120px 0px -60% 0px",
      threshold: 0,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    tocItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => {
      tocItems.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) observer.unobserve(el);
      });
    };
  }, [tocItems]);

  return activeSection;
}

export function BlogPostMobileToc({ tocItems }: BlogPostTocProps) {
  const activeSection = useActiveSection(tocItems);
  const [isOpen, setIsOpen] = useState(false);

  if (tocItems.length === 0) return null;

  return (
    <div className="blog-post-toc mb-6 block rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-4 shadow-[var(--md-sys-card-elevation-rest)] md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between font-semibold text-[var(--md-sys-color-on-surface)]"
      >
        <span className="flex items-center gap-2 text-sm">
          <span className="text-[var(--md-sys-color-primary)]" aria-hidden="true">
            #
          </span>{" "}
          Table of Contents
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-5 w-5 text-[var(--md-sys-color-on-surface-variant)] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <nav className="mt-4 space-y-2 border-t border-[var(--md-sys-color-outline-variant)] pt-3 text-[13px] font-medium leading-relaxed">
          {tocItems.map((item) => {
            const isActive = activeSection === item.id;

            if (item.level === 1) {
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setIsOpen(false)}
                  className={`block py-1 transition-colors hover:text-[var(--md-sys-color-on-surface)] ${
                    isActive
                      ? "font-bold text-[var(--md-sys-color-on-surface)]"
                      : "text-[var(--md-sys-color-on-surface-variant)]"
                  }`}
                >
                  {item.label}
                </a>
              );
            }

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-1.5 py-0.5 pl-4 text-[12px] transition-colors hover:text-[var(--md-sys-color-on-surface)] ${
                  isActive
                    ? "font-semibold text-[var(--md-sys-color-on-surface)]"
                    : "text-[var(--md-sys-color-on-surface-variant)]"
                }`}
              >
                {item.emoji ? <span>{item.emoji}</span> : null}
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export function BlogPostDesktopToc({ tocItems }: BlogPostTocProps) {
  const activeSection = useActiveSection(tocItems);

  if (tocItems.length === 0) return null;

  return (
    <aside className="blog-post-toc sticky top-24 hidden w-full shrink-0 self-start border-l border-[var(--md-sys-color-outline-variant)] py-1 pl-5 md:block">
      <h4
        style={{ fontFamily: "var(--font-varta)" }}
        className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]"
      >
        Table of Contents
      </h4>
      <nav className="thin-scroll max-h-[70vh] space-y-2 overflow-y-auto pr-2 text-[13px] font-medium leading-relaxed">
        {tocItems.map((item) => {
          const isActive = activeSection === item.id;

          if (item.level === 1) {
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`block py-1 transition-colors hover:text-[var(--md-sys-color-on-surface)] ${
                  isActive
                    ? "font-bold text-[var(--md-sys-color-on-surface)]"
                    : "text-[var(--md-sys-color-on-surface-variant)]"
                }`}
              >
                {item.label}
              </a>
            );
          }

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`flex items-center gap-1.5 py-0.5 pl-4 text-[12px] transition-colors hover:text-[var(--md-sys-color-on-surface)] ${
                isActive
                  ? "font-semibold text-[var(--md-sys-color-on-surface)]"
                  : "text-[var(--md-sys-color-on-surface-variant)]"
              }`}
            >
              {item.emoji ? <span>{item.emoji}</span> : null}
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
