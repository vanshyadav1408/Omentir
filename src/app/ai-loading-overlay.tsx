"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

function subscribeToClient() {
  return () => {};
}

export default function AiLoadingOverlay({
  open,
  note,
  title,
  transparent = false,
  removeTopGradient = false,
}: {
  open: boolean;
  note: string;
  title?: string;
  transparent?: boolean;
  removeTopGradient?: boolean;
}) {
  const mounted = useSyncExternalStore(subscribeToClient, () => true, () => false);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      {removeTopGradient && (
        <style dangerouslySetInnerHTML={{ __html: `
          .navigation-feedback-bar, [class*="navigation-feedback-bar"] {
            display: none !important;
          }
        ` }} />
      )}
      <div
        className={`m3-dialog-scrim m3-ai-loading-scrim ${
          transparent ? "m3-ai-loading-scrim--transparent" : ""
        }`}
        aria-live="polite"
        aria-busy="true"
      >
        <div
          className="m3-dialog-surface m3-ai-loading-surface"
          role="status"
        >
          <div className="m3-ai-loading-content">
            <svg
              className="m3-ai-loading-indicator"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <circle
                className="m3-ai-loading-indicator__track"
                cx="24"
                cy="24"
                r="20"
                pathLength="100"
              />
              <circle
                className="m3-ai-loading-indicator__active"
                cx="24"
                cy="24"
                r="20"
                pathLength="100"
              />
            </svg>

            <div className="m3-ai-loading-copy">
              <p className="m3-ai-loading-title">{title || note}</p>
              {title ? <p className="m3-ai-loading-note">{note}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
