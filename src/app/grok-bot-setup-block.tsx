"use client";

import { useState } from "react";
import {
  GROK_BOT_FIRST_JOB_PROMPT,
  GROK_BOT_MCP_URL,
  GROK_BOT_STOP_RULE,
} from "./grok-bot-setup";

export function PromptCopyButton({
  prompt,
  className,
  idleLabel = "Copy the prompt",
}: {
  prompt: string;
  className?: string;
  idleLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(prompt).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => undefined
    );
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? "Copied" : idleLabel}
    </button>
  );
}

export function PromptCopyBox({
  prompt,
  label = "Paste into Grok Bot",
}: {
  prompt: string;
  label?: string;
}) {
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {label}
        </p>
        <PromptCopyButton
          prompt={prompt}
          idleLabel="Copy"
          className="rounded-md px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
        />
      </div>
      <pre className="whitespace-pre-wrap p-5 font-mono text-sm leading-7 text-zinc-800">
        {prompt}
      </pre>
    </div>
  );
}

export default function GrokBotSetupBlock({
  prompt = GROK_BOT_FIRST_JOB_PROMPT,
  heading,
  headingId,
}: {
  prompt?: string;
  heading?: string;
  headingId?: string;
}) {
  return (
    <div className={heading ? "my-8" : "my-6"}>
      {heading ? (
        <h2
          id={headingId}
          style={{ fontFamily: "var(--font-varta)" }}
          className="scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-2xl font-semibold tracking-tight text-black"
        >
          {heading}
        </h2>
      ) : null}
      <ol className="mt-5 list-decimal space-y-2 pl-5 text-zinc-800">
        <li>
          Finish Omentir first: LinkedIn connected, My Product written in two
          sentences a stranger would understand.
        </li>
        <li>
          In Grok Bot, open Settings, then Plugins. Add{" "}
          <span className="font-mono text-sm">{GROK_BOT_MCP_URL}</span>
          . Approve Connect workspace.
        </li>
        <li>
          Put this in the Bot description and leave it there: {GROK_BOT_STOP_RULE}
        </li>
        <li>
          If it asks you to take over the computer for a LinkedIn password,
          passkey, two-factor code, or CAPTCHA, refuse.
        </li>
        <li>
          Paste the job below. Replace the brackets. Keep the last two sentences.
        </li>
      </ol>
      <PromptCopyBox prompt={prompt} />
    </div>
  );
}
