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
            className="m3-modal-scrim new-agent-choice-mobile-scrim z-[200]"
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
                You can always add outreach to a lead group later with a campaign.
              </p>

              <div className="mt-5 grid gap-3">
                <Link
                  href="/agents/new?mode=leads"
                  onClick={() => setOpen(false)}
                  className="group flex items-start gap-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] px-4 py-3.5 transition hover:border-[#ba3871] hover:bg-[rgba(186,56,113,0.05)]"
                >
                  <span
                    className="material-symbols-outlined mt-0.5 text-xl font-light leading-none text-[#ba3871]"
                    aria-hidden="true"
                  >
                    person_search
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                      Only Lead
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)]">
                      Discovers and scores matching people into a lead group. You review them in
                      Leads and contact them yourself.
                    </span>
                  </span>
                </Link>

                <Link
                  href="/agents/new"
                  onClick={() => setOpen(false)}
                  className="group flex items-start gap-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] px-4 py-3.5 transition hover:border-[#ba3871] hover:bg-[rgba(186,56,113,0.05)]"
                >
                  <span
                    className="material-symbols-outlined mt-0.5 text-xl font-light leading-none text-[#ba3871]"
                    aria-hidden="true"
                  >
                    send
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                      Leads + outreach
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)]">
                      Also runs your LinkedIn connect and message sequence on the leads
                      automatically.
                    </span>
                  </span>
                </Link>

                <Link
                  href="/agents/new?mode=outreach"
                  onClick={() => setOpen(false)}
                  className="group flex items-start gap-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] px-4 py-3.5 transition hover:border-[#ba3871] hover:bg-[rgba(186,56,113,0.05)]"
                >
                  <span
                    className="material-symbols-outlined mt-0.5 text-xl font-light leading-none text-[#ba3871]"
                    aria-hidden="true"
                  >
                    upload_file
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                      Outreach Only <span className="font-normal">(Bring your own CSV)</span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)]">
                      Upload LinkedIn profiles and set up messaging without lead discovery.
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
