"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { useBodyScrollLock } from "@/app/use-body-scroll-lock";
import { useHydrated } from "@/app/use-hydrated";

// Trigger + choice dialog for starting a new agent. Every "create an agent"
// entry point in the app goes through this so the user first picks whether
// the agent only discovers leads or also runs outreach. The post-login
// onboarding setup flow intentionally does NOT use this - it always builds a
// full agent.
//
// The dialog is portaled to document.body so fixed positioning is never trapped
// under the app page-transition / enter-animation transforms (those create a
// containing block that makes the scrim miss the viewport and block clicks on
// the wrong layer).
export default function NewAgentButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const hydrated = useHydrated();
  useBodyScrollLock(open);

  // Close when the route changes (user picked a mode link) so the scrim never
  // survives into the next page and intercepts its buttons. Adjusted during
  // render rather than in an effect: an effect here fires a second render pass
  // after the new route already painted, so the scrim can still swallow a click
  // on the way out.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const dialog =
    open && hydrated
      ? createPortal(
          <div
            className="app-compact m3-modal-scrim new-agent-choice-mobile-scrim z-[200]"
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-agent-choice-title"
              className="m3-modal-surface new-agent-choice-mobile-dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="new-agent-choice-title" className="m3-dialog-title">
                What should this agent do?
              </h2>
              <p className="m3-dialog-body">
                Pick how this agent finds people and whether it runs outreach.
              </p>

              <div className="mt-5 grid gap-2 md:gap-3">
                <Link
                  href="/agents/new?mode=leads"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] px-4 py-3 transition hover:border-[#ba3871] hover:bg-[rgba(186,56,113,0.05)] md:items-start md:py-3.5"
                >
                  <span
                    className="material-symbols-outlined shrink-0 text-xl font-light leading-none text-[#ba3871] md:mt-0.5"
                    aria-hidden="true"
                  >
                    person_search
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                      Only Lead
                    </span>
                    <span className="mt-0.5 hidden text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)] md:block">
                      Discovers and scores matching people into a lead group. You review them in
                      Leads and contact them yourself.
                    </span>
                  </span>
                </Link>

                <Link
                  href="/agents/new"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] px-4 py-3 transition hover:border-[#ba3871] hover:bg-[rgba(186,56,113,0.05)] md:items-start md:py-3.5"
                >
                  <span
                    className="material-symbols-outlined shrink-0 text-xl font-light leading-none text-[#ba3871] md:mt-0.5"
                    aria-hidden="true"
                  >
                    send
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                      Leads + outreach
                      <span className="recommended-badge">Recommended</span>
                    </span>
                    <span className="mt-0.5 hidden text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)] md:block">
                      Also runs your LinkedIn connect and message sequence on the leads
                      automatically.
                    </span>
                  </span>
                </Link>

                <Link
                  href="/agents/new?mode=outreach"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] px-4 py-3 transition hover:border-[#ba3871] hover:bg-[rgba(186,56,113,0.05)] md:items-start md:py-3.5"
                >
                  <span
                    className="material-symbols-outlined shrink-0 text-xl font-light leading-none text-[#ba3871] md:mt-0.5"
                    aria-hidden="true"
                  >
                    upload_file
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                      Outreach Only <span className="font-normal">(Bring your own CSV)</span>
                    </span>
                    <span className="mt-0.5 hidden text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)] md:block">
                      Upload LinkedIn profiles and set up messaging without lead discovery.
                    </span>
                  </span>
                </Link>

                <Link
                  href="/agents/new?mode=steal"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] px-4 py-3 transition hover:border-[#ba3871] hover:bg-[rgba(186,56,113,0.05)] md:items-start md:py-3.5"
                >
                  <span
                    className="material-symbols-outlined shrink-0 text-xl font-light leading-none text-[#ba3871] md:mt-0.5"
                    aria-hidden="true"
                  >
                    group
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                      Steal Customers
                      <span className="inline-flex h-4 items-center rounded-[3px] border border-[#ba3871] bg-[rgba(186,56,113,0.08)] px-1.5 text-[9px] font-bold uppercase leading-none tracking-wide text-[#ba3871]">
                        Alpha
                      </span>
                    </span>
                    <span className="mt-0.5 hidden text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)] md:block">
                      Find people who comment under competitor posts and AI-reach out with that
                      post and comment context.
                    </span>
                  </span>
                </Link>
              </div>

              <div className="m3-dialog-actions">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="m3-dialog-btn m3-dialog-btn--text"
                >
                  Cancel
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {dialog}
    </>
  );
}
