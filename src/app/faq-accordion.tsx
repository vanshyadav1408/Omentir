"use client";

import { type ReactNode, useState } from "react";

type FaqItem = { question: ReactNode; answer: ReactNode };

export default function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  function toggle(index: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="divide-y divide-[var(--md-sys-color-outline-variant)]">
      {items.map((item, index) => {
        const isOpen = open.has(index);
        return (
          <div key={index} className="py-5">
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              className="group flex w-full cursor-pointer items-center justify-between gap-4 px-1 text-left font-medium"
            >
              <span className="text-[var(--md-sys-color-on-surface)] transition-colors duration-150 ease-[cubic-bezier(0.2,0,0,1)] group-hover:text-[var(--md-sys-color-primary)]">
                {item.question}
              </span>
              <span
                aria-hidden="true"
                className={`shrink-0 text-2xl font-light leading-none text-[var(--md-sys-color-on-surface-variant)] transition-[color,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:text-[var(--md-sys-color-primary)] ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="mt-4 max-w-2xl text-sm font-normal leading-7 text-[var(--md-sys-color-on-surface-variant)] sm:text-base">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
