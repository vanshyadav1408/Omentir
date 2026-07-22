"use client";

import { useState } from "react";

// Small copy-to-clipboard control for the public MCP endpoint. Credentials are
// configured separately as an Authorization header and never appear in URLs.
export default function CopyConnectorUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 flex items-stretch gap-2">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] px-3 py-2 text-left text-[12px] text-[var(--md-sys-color-on-surface)] sm:text-[13px]">
        {url}
      </code>
      <button
        type="button"
        onClick={copy}
        className="m3-btn m3-btn-filled-secondary shrink-0 rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
