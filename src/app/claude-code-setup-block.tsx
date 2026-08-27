"use client";

import { PromptCopyBox, PromptCopyButton } from "./grok-bot-setup-block";
import {
  CLAUDE_CODE_FIRST_JOB_PROMPT,
  CLAUDE_CODE_MCP_URL,
  CLAUDE_CODE_STOP_RULE,
} from "./claude-code-setup";

export { PromptCopyButton };

export default function ClaudeCodeSetupBlock({
  prompt = CLAUDE_CODE_FIRST_JOB_PROMPT,
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
          Create a revocable API key and put it in the environment Claude Code
          already uses for secrets. Do not commit it.
        </li>
        <li>
          Point Claude Code at{" "}
          <span className="font-mono text-sm">{CLAUDE_CODE_MCP_URL}</span> with
          Authorization Bearer. REST at{" "}
          <span className="font-mono text-sm">
            https://omentir.com/api/agent/v1
          </span>{" "}
          is the same workspace if you prefer HTTP.
        </li>
        <li>
          Fetch{" "}
          <a href="https://omentir.com/agents.md" className="text-blue-600 hover:underline">
            agents.md
          </a>{" "}
          before you let it create anything. Put this in the session: {CLAUDE_CODE_STOP_RULE}
        </li>
        <li>
          Paste the job below. Replace the brackets. Keep the last two sentences.
        </li>
      </ol>
      <PromptCopyBox prompt={prompt} label="Paste into Claude Code" />
    </div>
  );
}
