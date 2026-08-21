"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { siteUrl } from "@/app/seo";
import type { AgentApiKey } from "@/lib/server/types";
import { useSidebarResource } from "@/app/use-sidebar-resource";
import { ApiKeyRowsSkeleton, ContentReveal } from "@/app/app-skeletons";
import { TextField } from "@/app/ui/text-field";
import { useBodyScrollLock } from "@/app/use-body-scroll-lock";
import { useWorkspaceTimeZone } from "@/app/workspace-time-zone";
import { formatZonedDate } from "@/lib/time-zone";

type ApiKeysViewProps = {
  agentApiKeys: AgentApiKey[];
  /** Plan has no API access: the keys section renders blurred behind an upgrade prompt. */
  locked?: boolean;
  createAgentApiKeyAction: (formData: FormData) => Promise<string>;
  revokeAgentApiKeyAction: (formData: FormData) => void | Promise<void>;
};

const ENDPOINTS = [
  { label: "Connector URL (MCP server)", value: `${siteUrl}/api/agent/v1/mcp` },
  { label: "REST base URL", value: `${siteUrl}/api/agent/v1` },
  { label: "OpenAPI schema", value: `${siteUrl}/api/agent/v1/openapi.json` },
  { label: "Authentication", value: "Sign in when prompted, or Authorization: Bearer <your-api-key>" },
];

type ConnectStep = { text: string; code?: string };
type ConnectMethod = {
  icon: string;
  title: string;
  blurb: string;
  details?: string[];
  steps: ConnectStep[];
  troubleshooting?: string[];
};

const CONNECT_METHODS: ConnectMethod[] = [
  {
    icon: "bolt",
    title: "Claude, ChatGPT, Grok & other chat apps",
    blurb:
      "Paste one URL and sign in. These apps have no place to put an API key, so Omentir issues one for them after you approve the connection.",
    details: [
      "No key to create, copy, or paste - approving the prompt is the whole setup.",
      "Approving creates a key named after the app on this page; revoking it disconnects the app at once.",
      "Included with every paid Omentir plan, the same as every other API connection.",
    ],
    steps: [
      {
        text: "In Claude: Settings → Connectors → Add custom connector. In ChatGPT: Settings → Connectors → Add. In Grok: Settings → Connectors. Paste this URL:",
        code: `${siteUrl}/api/agent/v1/mcp`,
      },
      {
        text: "The app sends you to Omentir. Sign in if you are not already, then choose Connect workspace.",
      },
      {
        text: "You land back in the app with Omentir connected. Ask it \"what's my Omentir context?\" to confirm.",
      },
      {
        text: "Turn the connector on in that specific chat - most apps keep account-level connection and per-chat use separate.",
      },
    ],
    troubleshooting: [
      "No tools after connecting: switch the connector on in the chat's tools menu, then send a new message.",
      "Sent back with an error: your plan may not include API access. Check the plan, then add the connector again.",
      "Stuck on the Omentir sign-in page: open omentir.com, sign in there first, then retry adding the connector.",
      "To disconnect, revoke the key named after the app on this page.",
    ],
  },
  {
    icon: "terminal",
    title: "Claude Code, Cursor & other MCP clients",
    blurb:
      "Clients that support headers keep your key out of the URL - the safer option when it's available.",
    details: [
      "Use the header-based setup whenever your client supports it.",
      "The MCP endpoint is hosted by Omentir; you do not need to install or run a local server.",
      "Store the key in the client config or environment secret store your team already uses.",
    ],
    steps: [
      {
        text: "Add Omentir to the client's MCP config (Cursor: Settings → MCP; Claude Code: ~/.claude/mcp.json or `claude mcp add`):",
        code: `{
  "mcpServers": {
    "omentir": {
      "url": "${siteUrl}/api/agent/v1/mcp",
      "headers": {
        "Authorization": "Bearer <your-key>"
      }
    }
  }
}`,
      },
      {
        text: "Reload the client, then ask it to run get_context - a successful reply means you're connected.",
      },
      {
        text: "If your client shows raw MCP tool names, choose omentir_get_context first, then omentir_get_stats.",
      },
    ],
    troubleshooting: [
      "If no Omentir tools appear, reload the MCP client or restart the editor/terminal session.",
      "If tools appear but calls fail, confirm the Authorization header is exactly Bearer <your-key>.",
      "If your client has no place for headers, use the connector URL on its own - it will walk you through signing in instead.",
    ],
  },
  {
    icon: "smart_toy",
    title: "OpenClaw, Hermes & autonomous agents",
    blurb:
      "Hand your agent the agents.md guide, then give it the key when it asks. It manages lead discovery from chat.",
    details: [
      "Use this when an autonomous agent is coordinating the workflow instead of a built-in MCP connector.",
      "The agent should read /agents.md and /api/agent/v1/openapi.json before calling workspace tools.",
      "Keep approval boundaries explicit before creating, changing, pausing, resuming, or deleting a lead finder.",
    ],
    steps: [
      {
        text: "Give the agent the machine guide as its first instruction. It should read that page, then ask for your token.",
        code: `${siteUrl}/agents.md`,
      },
      {
        text: "The agent reads agents.md, then stops and asks for your Omentir token. Paste a key you created above; do not give it your Omentir password.",
      },
      {
        text: "It runs get_context + get_stats and briefs you on readiness before touching anything. Say \"find buyers\" when you're ready.",
      },
      {
        text: "Ask it to list existing agents before creating one, then use list_activity and list_leads to report discovery progress without guessing.",
      },
    ],
    troubleshooting: [
      "If the agent invents data, tell it to call Omentir tools again and cite the returned fields.",
      "If it creates duplicate lead finders after a timeout, remind it to list existing agents before retrying.",
      "If it cannot use MCP, have it call the REST endpoints with the Bearer token instead.",
    ],
  },
  {
    icon: "code",
    title: "Scripts & the REST API",
    blurb:
      "Core workspace reads and setup actions are available as plain REST endpoints under /api/agent/v1 - no MCP client required.",
    details: [
      "Use REST for server scripts, internal dashboards, cron jobs, or custom agent frameworks.",
      "Send JSON request bodies with Content-Type: application/json for POST, PUT, PATCH, and DELETE calls.",
      "The OpenAPI schema is the source of truth for paths, parameters, and request shapes.",
    ],
    steps: [
      {
        text: "Send your key as a Bearer token on each request. Quick test:",
        code: `curl ${siteUrl}/api/agent/v1/context \\
  -H "Authorization: Bearer <your-key>"`,
      },
      {
        text: "List lead groups:",
        code: `curl ${siteUrl}/api/agent/v1/groups \\
  -H "Authorization: Bearer <your-key>"`,
      },
      {
        text: "List discovered leads from one group:",
        code: `curl "${siteUrl}/api/agent/v1/leads?groupId=<group-id>&minFitScore=80&sortBy=fit_score_desc&limit=100" \\
  -H "Authorization: Bearer <your-key>"`,
      },
      {
        text: "See every endpoint, parameter, and response shape in the OpenAPI schema linked below.",
      },
    ],
    troubleshooting: [
      "401 Bearer token required: add the Authorization header.",
      "400 Invalid payload: compare your JSON body with the OpenAPI schema.",
      "After a creation timeout, list existing agents before retrying to avoid duplicates.",
    ],
  },
];

const DOCS = [
  {
    title: "Agent API and MCP",
    description: "Connect Claude, ChatGPT, or any MCP agent without sharing your LinkedIn password.",
    href: "/features/agent-api-and-mcp",
  },
  {
    title: "MCP integration",
    description: "The hosted MCP endpoint, who connects how, and tool groups.",
    href: "/integrations/mcp",
  },
  {
    title: "agents.md",
    description: "Machine-readable guide: call order, tools, and guardrails.",
    href: "/agents.md",
  },
  {
    title: "OpenAPI schema",
    description: "Full REST reference for scripts and custom integrations.",
    href: "/api/agent/v1/openapi.json",
  },
];

const selectAgentApiKeys = (data: Record<string, unknown>) =>
  (data.agentApiKeys as AgentApiKey[]) || [];

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h2
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-xl font-semibold tracking-tight text-zinc-950"
      >
        {title}
      </h2>
      <span className="mt-1.5 block h-0.5 w-8 rounded-full bg-[#ba3871]/60" aria-hidden />
      {description ? <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">{description}</p> : null}
    </div>
  );
}

/**
 * Upgrade prompt over the blurred keys section. The blurred content underneath
 * is marked `inert`, so this card is the only thing focus or a click can reach.
 */
function KeysLockOverlay() {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center px-4">
      <div className="w-full max-w-sm rounded-md border border-zinc-200 bg-white/95 p-5 text-center shadow-[0_10px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm">
        <span
          className="material-symbols-outlined text-[26px] leading-none text-[#ba3871]"
          aria-hidden="true"
        >
          lock
        </span>
        <h3
          style={{ fontFamily: "var(--font-varta)" }}
          className="mt-2 text-[15px] font-semibold text-zinc-950"
        >
          API keys need an active paid plan
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">
          Upgrade to create keys and connect Omentir to Claude, Cursor, or your
          own scripts.
        </p>
        <Link
          href="/upgrade"
          className="m3-btn m3-btn-filled mt-4 h-10 px-4 text-sm"
        >
          Upgrade plan
        </Link>
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      aria-label="Copy to clipboard"
      className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
    >
      <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">
        {copied ? "check" : "content_copy"}
      </span>
    </button>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative mt-2 rounded-md border border-zinc-200 bg-[#fbfaf6]">
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        aria-label="Copy to clipboard"
        className="absolute right-1.5 top-1.5 grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      >
        <span className="material-symbols-outlined text-[15px] leading-none" aria-hidden="true">
          {copied ? "check" : "content_copy"}
        </span>
      </button>
      <pre className="overflow-x-auto px-3 py-2.5 pr-10 text-[11.5px] leading-5 text-zinc-800">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function ApiKeysView({
  agentApiKeys,
  locked = false,
  createAgentApiKeyAction,
  revokeAgentApiKeyAction,
}: ApiKeysViewProps) {
  const timeZone = useWorkspaceTimeZone();
  const [pending, startTransition] = useTransition();
  const [keyLabel, setKeyLabel] = useState("");
  const [createdKey, setCreatedKey] = useState("");
  const [modalCopied, setModalCopied] = useState(false);
  useBodyScrollLock(Boolean(createdKey));
  const [selectedMethod, setSelectedMethod] = useState(0);
  const agentApiKeysResource = useSidebarResource(
    "agentApiKeys",
    agentApiKeys,
    selectAgentApiKeys,
  );
  const loadedAgentApiKeys = agentApiKeysResource.value;

  function handleCreateKey() {
    const formData = new FormData();
    formData.set("label", keyLabel.trim() || "AI agent");
    startTransition(async () => {
      const token = await createAgentApiKeyAction(formData);
      setCreatedKey(token);
      setKeyLabel("");
      agentApiKeysResource.reload();
    });
  }

  function handleRevokeKey(keyId: string) {
    const formData = new FormData();
    formData.set("keyId", keyId);
    startTransition(async () => {
      await revokeAgentApiKeyAction(formData);
      agentApiKeysResource.reload();
    });
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 md:ml-4 md:mr-0.5">
      {/* Header */}
      <div className="app-x hidden shrink-0 pt-6 md:block">
        <h1
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)]"
        >
          API
        </h1>
      </div>

      {/* Scrollable content */}
      <div className="mt-2 min-h-0 flex-1 overflow-hidden md:mt-0">
        <div className="app-x h-full overflow-y-auto">
          <div className="max-w-5xl pb-8 pt-1 sm:pb-10 sm:pt-2 md:pb-3">
            <SectionHeader
              title="API keys"
              description="Connect Omentir to your favorite AI app."
            />

            <div className="relative">
              <div
                inert={locked || undefined}
                className={locked ? "select-none blur-[5px]" : undefined}
              >
                <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                  <TextField
                    label="Key label"
                    value={keyLabel}
                    onChange={(event) => setKeyLabel(event.target.value)}
                    placeholder="Claude, Hermes, my-script..."
                  />
                  <button
                    type="button"
                    onClick={handleCreateKey}
                    disabled={pending}
                    className="m3-btn m3-btn-filled m3-btn-field disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Create
                  </button>
                </div>

                <div className="mt-4 rounded-md border border-zinc-200 bg-white">
                  {agentApiKeysResource.loading ? (
                    <ApiKeyRowsSkeleton />
                  ) : loadedAgentApiKeys.length ? (
                    <ContentReveal className="divide-y divide-zinc-100">
                    {loadedAgentApiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex flex-col items-start justify-between gap-3 px-4 py-3.5 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <div
                            style={{ fontFamily: "var(--font-varta)" }}
                            className="text-[14px] font-semibold text-zinc-950"
                          >
                            {key.label}
                          </div>
                          <div className="mt-0.5 text-[13px] font-medium text-zinc-700">
                            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px]">{key.tokenPrefix}...</code>
                            {" "}· Created {formatZonedDate(key.createdAt, timeZone)}
                            {key.lastUsedAt
                              ? ` · Last used ${formatZonedDate(key.lastUsedAt, timeZone)}`
                              : " · Never used"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(key.id)}
                          disabled={pending}
                          className="flex h-9 cursor-pointer items-center justify-center rounded-md border border-red-200 bg-white px-3 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="translate-y-px">Revoke</span>
                        </button>
                      </div>
                    ))}
                    </ContentReveal>
                  ) : (
                    <ContentReveal className="grid place-items-center px-4 py-8 text-center">
                      <span className="material-symbols-outlined text-3xl text-zinc-400">key</span>
                      <h2 className="mt-3 text-sm font-semibold text-zinc-900">No API keys yet</h2>
                      <p className="mt-1 text-xs text-zinc-500">Create one to use your regular chatbots for outreach.</p>
                    </ContentReveal>
                  )}
                </div>
              </div>
              {locked ? <KeysLockOverlay /> : null}
            </div>

            <div className="my-8 h-px bg-zinc-200" />

            <SectionHeader
              title="How to connect"
              description="Create a key above, then pick the app you're connecting."
            />

            <div className="relative mb-4 max-w-sm">
              <select
                value={selectedMethod}
                onChange={(event) => setSelectedMethod(Number(event.target.value))}
                aria-label="Choose how you're connecting Omentir"
                className="h-10 w-full cursor-pointer appearance-none rounded-md border border-zinc-200 bg-white pl-3 pr-9 text-[14px] font-semibold text-zinc-900 outline-none transition-colors focus:border-zinc-900"
              >
                {CONNECT_METHODS.map((method, index) => (
                  <option key={method.title} value={index}>
                    {method.title}
                  </option>
                ))}
              </select>
              <span
                className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[18px] leading-none text-zinc-600"
                aria-hidden="true"
              >
                expand_more
              </span>
            </div>

            <div>
              {[CONNECT_METHODS[selectedMethod]].map((method) => (
                <div key={method.title} className="rounded-md border border-zinc-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined -translate-y-[1.5px] text-[18px] leading-none text-[#ba3871]"
                      aria-hidden="true"
                    >
                      {method.icon}
                    </span>
                    <h3
                      style={{ fontFamily: "var(--font-varta)" }}
                      className="text-[14px] font-semibold text-zinc-950"
                    >
                      {method.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-[13px] font-medium leading-relaxed text-zinc-700">
                    {method.blurb}
                  </p>
                  {method.details?.length ? (
                    <ul className="mt-3 space-y-1.5 rounded-md bg-zinc-50 px-3 py-2.5">
                      {method.details.map((detail) => (
                        <li key={detail} className="flex gap-2 text-[13px] font-medium leading-relaxed text-zinc-700">
                          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zinc-400" aria-hidden="true" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <ol className="mt-3 space-y-2.5">
                    {method.steps.map((step, index) => (
                      <li key={index} className="flex gap-2.5">
                        <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-700">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium leading-relaxed text-zinc-800">
                            {step.text}
                          </p>
                          {step.code ? <CodeBlock code={step.code} /> : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                  {method.troubleshooting?.length ? (
                    <div className="mt-4 rounded-md border border-zinc-200 bg-[#fbfaf6] px-3 py-2.5">
                      <div
                        style={{ fontFamily: "var(--font-varta)" }}
                        className="text-[13px] font-semibold text-zinc-900"
                      >
                        Common issues
                      </div>
                      <ul className="mt-1.5 space-y-1.5">
                        {method.troubleshooting.map((item) => (
                          <li key={item} className="flex gap-2 text-[13px] font-medium leading-relaxed text-zinc-700">
                            <span className="material-symbols-outlined -mt-[1px] text-[14px] leading-none text-zinc-500" aria-hidden="true">
                              help
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="my-8 h-px bg-zinc-200" />

            <SectionHeader
              title="Endpoints"
              description="Point any MCP client at the MCP server, or call the REST API directly."
            />

            <div className="divide-y divide-zinc-100 rounded-md border border-zinc-200 bg-white">
              {ENDPOINTS.map((endpoint) => (
                <div key={endpoint.label} className="flex items-center gap-3 px-4 py-3">
                  <div
                    style={{ fontFamily: "var(--font-varta)" }}
                    className="w-32 shrink-0 text-[13px] font-semibold text-zinc-900 sm:w-36"
                  >
                    {endpoint.label}
                  </div>
                  <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-[13px] text-zinc-700">
                    {endpoint.value}
                  </code>
                  <CopyButton value={endpoint.value} />
                </div>
              ))}
            </div>

            <div className="my-8 h-px bg-zinc-200" />

            <SectionHeader
              title="Documentation"
              description="Guides for connecting agents and building on the API."
            />

            <div className="grid gap-3 sm:grid-cols-2">
              {DOCS.map((doc) => (
                <a
                  key={doc.href}
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-3 rounded-md border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400"
                >
                  <div className="min-w-0">
                    <div
                      style={{ fontFamily: "var(--font-varta)" }}
                      className="text-[14px] font-semibold text-zinc-950"
                    >
                      {doc.title}
                    </div>
                    <div className="mt-0.5 text-[13px] font-medium text-zinc-700">
                      {doc.description}
                    </div>
                  </div>
                  <span
                    className="material-symbols-outlined shrink-0 text-[16px] leading-none text-zinc-500 transition-colors group-hover:text-zinc-900"
                    aria-hidden="true"
                  >
                    open_in_new
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* One-time key reveal — high-consequence: no scrim dismiss (must copy/done) */}
      {createdKey ? (
        <div className="m3-modal-scrim z-[120]" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="api-key-created-title"
            className="m3-modal-surface"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="api-key-created-title" className="m3-dialog-title">
              API key created
            </h2>
            <p className="m3-dialog-body">Copy this key now. It will not be shown again.</p>
            <code className="mt-4 block overflow-x-auto whitespace-nowrap rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] px-3 py-2.5 text-[13px] text-[var(--md-sys-color-on-surface)]">
              {createdKey}
            </code>
            <div className="m3-dialog-actions">
              <button
                type="button"
                onClick={() => {
                  setCreatedKey("");
                  setModalCopied(false);
                }}
                className="m3-dialog-btn m3-dialog-btn--text"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(createdKey).then(() => {
                    setModalCopied(true);
                    setTimeout(() => setModalCopied(false), 1500);
                  });
                }}
                className="m3-dialog-btn m3-dialog-btn--filled"
              >
                <span className="material-symbols-outlined ms-size-20" aria-hidden="true">
                  {modalCopied ? "check" : "content_copy"}
                </span>
                {modalCopied ? "Copied" : "Copy key"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
