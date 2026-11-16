"use client";

import { type ReactNode, useId, useState } from "react";

export type FaqItem = { question: ReactNode; answer: ReactNode };

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** FAQ rows: a small bare "+", the question, and the answer sliding open
 *  underneath. Several rows can be open at once. Styled by `.cal-faq-*`. */
export default function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const baseId = useId();
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
    <div className="cal-faq">
      {items.map((item, index) => {
        const isOpen = open.has(index);
        const panelId = `${baseId}-answer-${index}`;
        return (
          <div key={index} className={`cal-faq-row${isOpen ? " is-open" : ""}`}>
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="cal-faq-q"
            >
              <span className="cal-faq-icon">
                <PlusIcon />
              </span>
              <span className="cal-faq-text">{item.question}</span>
            </button>
            <div id={panelId} className="cal-faq-a" role="region" aria-hidden={!isOpen}>
              <div className="overflow-hidden">
                <p>{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
