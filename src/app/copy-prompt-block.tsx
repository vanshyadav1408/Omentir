"use client";

import { useState } from "react";

// Copy-to-clipboard block for the long "outreach operator" system prompt on
// the For Agents page. Shows the prompt in a scrollable panel with a Copy
// button pinned to the top-right so it stays reachable however tall it grows.
export default function CopyPromptBlock({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative mt-4 overflow-hidden rounded-xl border-2 border-black bg-[#171717] shadow-[0_18px_60px_rgba(15,23,42,0.10)]">
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 z-10 shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words px-4 py-3 pr-16 text-left text-[11px] leading-5 text-zinc-200 sm:text-[12px]">
        {prompt}
      </pre>
    </div>
  );
}
