"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { FormEvent, ReactNode } from "react";
import LogoMark from "@/app/logo-mark";
import AiLoadingOverlay from "@/app/ai-loading-overlay";
import { SelectField, type SelectOption } from "@/app/ui/select";
import { TextAreaField, TextField } from "@/app/ui/text-field";
import type { Agent } from "@/lib/server/types";
import {
  INDUSTRY_SUGGESTIONS,
  KEYWORD_SUGGESTIONS,
  LOCATION_SUGGESTIONS,
  SIGNAL_KEYWORD_SUGGESTIONS,
  TITLE_SUGGESTIONS,
} from "./suggestions";

type CompanyProfile = {
  companyName: string;
  description: string;
  industry: string;
  companySize: string;
  painPointsText: string;
  websiteUrl?: string;
};

type AgentSetupDraft = {
  agentName: string;
  groupName: string;
  titles: string[];
  industries: string[];
  locations: string[];
  keywords: string[];
  prompt: string;
  signalKeywords: string[];
  competitorUrls: string[];
  founderUrls: string[];
  campaignGoal: "warm" | "demo";
  messageTone: "professional" | "conversational" | "direct";
  connectionNote: string;
  firstMessage: string;
  followUpMessage: string;
};

type PreparedAgent = {
  agentId: string;
  groupName: string;
};

type AgentSetupProps = {
  createAgent: (formData: FormData) => void | Promise<void>;
  prepareAgent: (formData: FormData) => Promise<PreparedAgent>;
  draftSetup: () => Promise<AgentSetupDraft>;
  saveProductProfile?: (formData: FormData) => void | Promise<void>;
  profile?: CompanyProfile | null;
  initialAgent?: Agent | null;
  linkedInAccounts?: { id: string; displayName: string; accountId: string; avatarUrl?: string }[];
  setupMode?: boolean;
  // Leads-only agents stop after the Leads step: the agent discovers and
  // scores leads into its group but no campaign is created, so the user
  // contacts leads manually from the Leads section.
  leadsOnly?: boolean;
  outreachOnly?: boolean;
};

type StepKey = "icp" | "signals" | "leads" | "campaign" | "review";
type SeqKind = "connect" | "message" | "follow";

type SeqAction = {
  id: string;
  kind: SeqKind;
  title: string;
  enabled: boolean;
  mode: "ai" | "manual";
  manualMessage: string;
  aiPrompt: string;
  goal: string;
  tone: string;
  waitValue: number;
  waitUnit: "minutes" | "hours" | "days";
  includeNote?: boolean;
};

const initialTitles = [
  "CEO",
  "Founder",
  "Head of Sales",
  "VP Sales",
  "Sales Director",
  "Head of Growth",
  "VP Growth",
  "Revenue Leader",
];
const initialIndustries = ["SaaS", "Software Development", "Marketing Services", "AI / ML", "IT Services"];
const initialLocations = ["United States", "Canada", "United Kingdom", "Australia"];
const initialKeywords = ["B2B", "Growth", "Sales", "Revenue", "Outbound", "Pipeline", "Go to market"];
const initialSignalKeywords = ["hiring sales", "hiring growth", "outbound", "pipeline", "looking for a tool"];

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span
      style={{ fontFamily: "var(--font-varta)" }}
      className="relative z-30 inline-flex items-center gap-1 text-[14px] font-semibold leading-5 text-zinc-900"
    >
      {children}
    </span>
  );
}

function ProgressCheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function linkedInAccountOptions(
  accounts: { id: string; displayName: string; accountId: string; avatarUrl?: string }[],
): SelectOption[] {
  return accounts.map((account) => {
    const label = account.displayName || account.accountId || "LinkedIn account";
    return {
      value: account.id,
      label,
      imageUrl: account.avatarUrl,
      imageFallback: label,
    };
  });
}

function TextInput({
  value,
  onChange,
  name,
  placeholder,
  required,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  name: string;
  placeholder: string;
  required?: boolean;
  label?: string;
}) {
  return (
    <TextField
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      label={label}
      placeholder={placeholder}
    />
  );
}

function TagRow({
  label,
  name,
  values,
  setValues,
  placeholder,
  suggestions,
}: {
  label: string;
  name: string;
  values: string[];
  setValues: (values: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);

  function addValue(raw?: string) {
    const next = (raw ?? draft).trim();
    if (!next || values.some((v) => v.toLowerCase() === next.toLowerCase())) return;
    setValues([...values, next]);
    setDraft("");
    setHighlight(0);
  }

  const filtered = (() => {
    if (!suggestions || !focused) return [] as string[];
    const lowerSelected = new Set(values.map((v) => v.toLowerCase()));
    const q = draft.trim().toLowerCase();
    const pool = suggestions.filter((s) => !lowerSelected.has(s.toLowerCase()));
    const matched = q ? pool.filter((s) => s.toLowerCase().includes(q)) : pool;
    return matched.slice(0, 10);
  })();

  return (
    <div className="grid gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {values.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
      <div className="relative">
        <div
          className={`flex min-h-[56px] flex-wrap items-center gap-1.5 rounded-md border bg-[var(--md-sys-color-surface-container)] px-3 py-2 transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] ${
            focused
              ? "border-2 border-[var(--md-sys-color-primary)]"
              : "border border-[var(--md-sys-color-field-outline)] hover:border-[var(--md-sys-color-field-outline-hover)]"
          }`}
        >
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 py-1 pl-3 pr-2 text-[12px] font-medium leading-4 text-zinc-700"
            >
              {value}
              <button
                type="button"
                onClick={() => setValues(values.filter((item) => item !== value))}
                className="cursor-pointer text-zinc-500 hover:text-zinc-900"
                aria-label={`Remove ${value}`}
              >
                x
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setHighlight(0);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              // Text that is visibly present in the field must count even when
              // the user clicks Continue without pressing Enter first.
              addValue();
              setTimeout(() => setFocused(false), 120);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (filtered.length > 0) {
                  addValue(filtered[Math.min(highlight, filtered.length - 1)]);
                } else {
                  addValue();
                }
              } else if (event.key === "ArrowDown") {
                if (filtered.length === 0) return;
                event.preventDefault();
                setHighlight((h) => (h + 1) % filtered.length);
              } else if (event.key === "ArrowUp") {
                if (filtered.length === 0) return;
                event.preventDefault();
                setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
              } else if (event.key === "Escape") {
                setFocused(false);
              }
            }}
            placeholder={values.length ? "" : placeholder}
            className="h-8 min-w-[100px] flex-1 border-0 bg-transparent py-0 pl-2 pr-1 text-[16px] leading-8 text-[var(--md-sys-color-field-text)] shadow-none outline-none placeholder:text-[var(--md-sys-color-field-label)]"
          />
        </div>
        {filtered.length > 0 ? (
          <ul
            className="m3-menu m3-menu-enter m3-menu--origin-top m3-menu--compact absolute left-0 right-0 top-[calc(100%+4px)] z-50"
            role="listbox"
          >
            {filtered.map((option, idx) => (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={idx === highlight}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    addValue(option);
                  }}
                  onMouseEnter={() => setHighlight(idx)}
                  className={`m3-menu-item ${idx === highlight ? "bg-[var(--md-sys-menu-hover)]" : ""}`}
                >
                  <span className="m3-menu-item__label truncate">{option}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function seqUid() {
  return Math.random().toString(36).slice(2, 9);
}

function makeSeqAction(kind: SeqKind): SeqAction {
  if (kind === "connect")
    return {
      id: seqUid(),
      kind,
      title: "Connect request",
      enabled: true,
      mode: "ai",
      manualMessage:
        "Hi {{firstName}}, noticed {{company}} is focused on {{leadReason}} and thought it made sense to connect.",
      aiPrompt:
        "Write a short, friendly connection note that references {{leadReason}} and {{company}}. Under 280 characters.",
      goal: "Open the door",
      tone: "Friendly & professional",
      waitValue: 0,
      waitUnit: "days",
      includeNote: true,
    };
  if (kind === "message")
    return {
      id: seqUid(),
      kind,
      title: "First message",
      enabled: true,
      mode: "ai",
      manualMessage:
        "Hi {{firstName}},\nI noticed {{company}} is focused on {{leadReason}}. Worth a quick 15-min chat next week?",
      aiPrompt:
        "Write a friendly first message referencing {{signalSource}} and {{leadReason}}. End with a clear ask. Under 300 characters.",
      goal: "Book a meeting",
      tone: "Professional & friendly",
      waitValue: 1,
      waitUnit: "days",
    };
  return {
    id: seqUid(),
    kind,
    title: "Follow-up",
    enabled: true,
    mode: "ai",
    manualMessage:
      "Quick follow-up, {{firstName}}. Thought this was worth sending again.",
    aiPrompt:
      "Write a brief polite follow-up referencing {{signalSource}}. Under 280 characters.",
    goal: "Re-engage",
    tone: "Polite & low-pressure",
    waitValue: 18,
    waitUnit: "hours",
  };
}

function SeqIconRich({ kind, colorClass }: { kind: SeqKind; colorClass: string }) {
  if (kind === "connect") {
    return (
      <svg
        className={`h-5 w-5 ${colorClass}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    );
  }
  return (
    <svg
      className={`h-5 w-5 ${colorClass}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function CompanyInfoCard({
  companyName,
  industry,
  description,
  onEdit,
}: {
  companyName: string;
  industry: string;
  description: string;
  onEdit: () => void;
}) {
  const summary =
    [companyName, industry].filter(Boolean).join(" - ") || "No company info yet";
  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-[12px] font-bold uppercase tracking-wider text-zinc-900"
            >
              Company Information
            </span>
            <span
              style={{ fontFamily: "var(--font-varta)" }}
              className="rounded-full bg-[#fff5f6] px-2 py-0.5 text-[11px] font-semibold text-[#e85e6b]"
            >
              Account-level
            </span>
          </div>
          <p className="mt-1 truncate text-[13px] font-medium leading-5 text-zinc-700">
            {summary}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          style={{ fontFamily: "var(--font-varta)" }}
          className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 self-start rounded-md border border-[#e85e6b] bg-white px-3 text-[13px] font-semibold text-[#e85e6b] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-[#fff5f6] hover:text-[#ba3871] sm:self-center"
        >
          <span
            className="material-symbols-outlined text-[18px]! font-light leading-none"
            aria-hidden="true"
          >
            edit
          </span>
          <span className="translate-y-[1px] leading-none">Edit</span>
        </button>
      </div>
      <div className="flex items-start gap-3 bg-[#fff5f6] px-4 py-3.5">
        <span className="mt-0.5 text-[#e85e6b]">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 8 12 2" />
          </svg>
        </span>
        <p className="text-[13px] font-light leading-5 text-[#ba3871]">
          {description
            ? description.length > 200
              ? description.slice(0, 200) + "..."
              : description
            : "Add a company description to help AI personalize messages. You can edit it at the workspace level or just for your account."}
        </p>
      </div>
    </div>
  );
}

const COMPANY_INDUSTRY_OPTIONS = [
  "Software Development & SaaS",
  "Marketing & Advertising",
  "Financial Services",
  "Healthcare & Life Sciences",
  "E-commerce & Retail",
  "Education & EdTech",
  "Real Estate & Construction",
  "Manufacturing & Logistics",
  "Media & Entertainment",
  "Professional Services",
  "Hospitality & Travel",
  "Other",
];

const COMPANY_SIZE_OPTIONS = [
  "1 - 10 employees",
  "11 - 50 employees",
  "51 - 200 employees",
  "201 - 500 employees",
  "501 - 1,000 employees",
  "1,001 - 5,000 employees",
  "5,000+ employees",
];

function CompanyEditModal({
  open,
  saving,
  analyzing,
  analyzeError,
  values,
  setValues,
  onSubmit,
  onAnalyze,
  onClose,
}: {
  open: boolean;
  saving: boolean;
  analyzing: boolean;
  analyzeError?: string;
  values: {
    companyName: string;
    description: string;
    industry: string;
    companySize: string;
    painPointsText: string;
    websiteUrl: string;
  };
  setValues: {
    setCompanyName: (v: string) => void;
    setCompanyDescription: (v: string) => void;
    setCompanyIndustry: (v: string) => void;
    setCompanySize: (v: string) => void;
    setCompanyPainPoints: (v: string) => void;
    setWebsiteUrl: (v: string) => void;
  };
  onSubmit: () => void;
  onAnalyze: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  const isWorking = saving || analyzing;

  return (
    <div
      className="m3-dialog-scrim z-50"
      role="presentation"
      onClick={() => !isWorking && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-edit-company-title"
        className="m3-dialog-surface flex max-h-[90vh] flex-col overflow-hidden !p-0"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] px-6 py-4">
          <div>
            <h3 id="agent-edit-company-title" className="m3-dialog-title text-[17px]">
              Edit company info
            </h3>
            <p className="mt-0.5 text-[12px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
              These details help AI personalize outreach.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isWorking}
            aria-label="Close"
            className="ms-icon-button text-[var(--md-sys-color-on-surface-variant)] disabled:opacity-50"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <div className="grid gap-1.5">
            <div className="flex flex-row items-start gap-2">
              <TextField
                className="min-w-0 flex-1"
                label="Website"
                value={values.websiteUrl || ""}
                onChange={(event) => setValues.setWebsiteUrl(event.target.value)}
                placeholder="acme.com"
                error={analyzeError || undefined}
              />
              {/* mt-2 = outlined field top pad so button lines up with the 56px shell */}
              <button
                type="button"
                onClick={onAnalyze}
                disabled={isWorking || !values.websiteUrl.trim()}
                className="m3-btn m3-btn-filled mt-2 h-14 shrink-0 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {analyzing ? "Analysing..." : "AI Analyse"}
              </button>
            </div>
          </div>

          <TextField
            label="Company name"
            value={values.companyName}
            onChange={(event) => setValues.setCompanyName(event.target.value)}
          />
          <TextAreaField
            label="Description"
            value={values.description}
            onChange={(event) => setValues.setCompanyDescription(event.target.value)}
            rows={4}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Industry"
              options={COMPANY_INDUSTRY_OPTIONS}
              value={values.industry}
              onChange={setValues.setCompanyIndustry}
              placeholder="Select industry"
            />
            <SelectField
              label="Company size"
              options={COMPANY_SIZE_OPTIONS}
              value={values.companySize}
              onChange={setValues.setCompanySize}
              placeholder="Select size"
            />
          </div>
          <TextAreaField
            label="Pain points"
            value={values.painPointsText}
            onChange={(event) => setValues.setCompanyPainPoints(event.target.value)}
            rows={3}
          />
        </div>

        <div className="m3-dialog-actions border-t border-[var(--md-sys-color-outline-variant)] px-6 py-3.5 !mt-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isWorking}
            className="m3-dialog-btn m3-dialog-btn--text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isWorking}
            aria-busy={isWorking}
            className="m3-dialog-btn m3-dialog-btn--filled"
          >
            {saving ? <span className="m3-dialog-btn__spinner" aria-hidden /> : null}
            {saving ? "Saving" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function AgentSetup({
  createAgent,
  prepareAgent,
  draftSetup,
  saveProductProfile,
  profile,
  initialAgent,
  linkedInAccounts = [],
  setupMode = false,
  leadsOnly = false,
  outreachOnly = false,
}: AgentSetupProps) {
  const isEditing = Boolean(initialAgent);
  const router = useRouter();
  const [step, setStep] = useState<StepKey>(outreachOnly ? "leads" : "icp");
  const [pending, startTransition] = useTransition();
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [preparedAgent, setPreparedAgent] = useState<PreparedAgent | null>(null);
  const [preparedAgentId, setPreparedAgentId] = useState("");
  const [csvContents, setCsvContents] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [name, setName] = useState(initialAgent?.name || "New Agent");
  const [groupName, setGroupName] = useState(initialAgent?.targetGroupName || "");
  const [linkedInAccountId, setLinkedInAccountId] = useState(
    initialAgent?.linkedInAccountId || linkedInAccounts[0]?.id || "",
  );
  const linkedInAccountSelectOptions = useMemo(
    () => linkedInAccountOptions(linkedInAccounts),
    [linkedInAccounts],
  );
  const [outreachMode, setOutreachMode] = useState<"automatic" | "manual">("automatic");
  const [replyHandling, setReplyHandling] = useState<"ai" | "handoff">("ai");
  const [campaignGoal, setCampaignGoal] = useState<"warm" | "demo">("warm");
  const [messageTone, setMessageTone] = useState<"professional" | "conversational" | "direct">(
    "professional",
  );
  const [excludeFirstDegree, setExcludeFirstDegree] = useState(true);
  const [prompt, setPrompt] = useState(initialAgent?.prompt || "");
  const [titles, setTitles] = useState<string[]>(initialAgent?.filters.titles ?? []);
  const [industries, setIndustries] = useState<string[]>(initialAgent?.filters.industries ?? []);
  const [locations, setLocations] = useState<string[]>(initialAgent?.filters.locations ?? []);
  const [keywords, setKeywords] = useState<string[]>(initialAgent?.filters.keywords ?? []);
  const [signalKeywords, setSignalKeywords] = useState<string[]>(initialAgent?.signalSources?.keywords ?? []);
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(initialAgent?.signalSources?.competitorUrls || []);
  const [founderUrls, setFounderUrls] = useState<string[]>(initialAgent?.signalSources?.founderUrls || []);
  const [actions, setActions] = useState<SeqAction[]>(() => [
    makeSeqAction("connect"),
    makeSeqAction("message"),
    makeSeqAction("follow"),
  ]);

  // Company profile (editable inline via modal)
  const [companyName, setCompanyName] = useState(profile?.companyName ?? "");
  const [companyDescription, setCompanyDescription] = useState(profile?.description ?? "");
  const [companyIndustry, setCompanyIndustry] = useState(profile?.industry ?? "");
  const [companySize, setCompanySize] = useState(profile?.companySize ?? "");
  const [companyPainPoints, setCompanyPainPoints] = useState(profile?.painPointsText ?? "");
  const [companyWebsiteUrl, setCompanyWebsiteUrl] = useState(profile?.websiteUrl ?? "");
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companySaving, startCompanySaving] = useTransition();
  const [analyzingCompany, startAnalyzingCompany] = useTransition();
  const [companyAnalyzeError, setCompanyAnalyzeError] = useState("");

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.companyName ?? "");
      setCompanyDescription(profile.description ?? "");
      setCompanyIndustry(profile.industry ?? "");
      setCompanySize(profile.companySize ?? "");
      setCompanyPainPoints(profile.painPointsText ?? "");
      setCompanyWebsiteUrl(profile.websiteUrl ?? "");
    }
  }, [profile]);

  function handleCompanyAnalyze() {
    const normalized = companyWebsiteUrl.trim();
    if (!normalized) return;
    setCompanyAnalyzeError("");
    startAnalyzingCompany(async () => {
      try {
        const response = await fetch("/api/website-analysis", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ websiteUrl: normalized }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Could not fetch this website.");
        }
        setCompanyName(payload.companyName || "");
        setCompanyDescription(payload.productOverview || "");
        setCompanyIndustry(payload.industry || "");
        setCompanySize(payload.companySize || "");
        setCompanyPainPoints(payload.painPointsText || "");
      } catch (error) {
        setCompanyAnalyzeError(error instanceof Error ? error.message : "Website analysis failed.");
      }
    });
  }

  // Edit step modal
  const [editStepId, setEditStepId] = useState<string | null>(null);
  const [editStepMode, setEditStepMode] = useState<"manual" | "ai">("manual");
  const [editStepMessage, setEditStepMessage] = useState("");
  const [editStepWait, setEditStepWait] = useState(1);
  const [editStepWaitUnit, setEditStepWaitUnit] = useState<"hours" | "days">("days");
  const [editStepIncludeNote, setEditStepIncludeNote] = useState(true);

  // Inline wait-time editor between sequence blocks
  const [editWaitId, setEditWaitId] = useState<string | null>(null);

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLead, setPreviewLead] = useState("");
  const [setupStepError, setSetupStepError] = useState("");

  const steps = useMemo(() => {
    const all = [
      ["icp", "1", "ICP", "Define your ideal customer profile"],
      ["signals", "2", "Signals", "Choose intent signals"],
      ["leads", "3", "Leads", "Set filters & scoring"],
      ["campaign", "4", "Outreach", "Message & sequence"],
      ["review", "5", "Review", "Launch your agent"],
    ] as const;
    if (outreachOnly) return [
      ["leads", "1", "CSV", "Upload LinkedIn profiles"],
      ["campaign", "2", "Outreach", "Message & sequence"],
      ["review", "3", "Review", "Launch your agent"],
    ] as const;
    return leadsOnly ? all.slice(0, 3) : all;
  }, [leadsOnly, outreachOnly]);

  // The step whose Continue button launches the agent instead of advancing.
  const finalStep: StepKey = leadsOnly ? "leads" : "review";

  const stepIndex = steps.findIndex(([key]) => key === step);
  const [displayStepIndex, setDisplayStepIndex] = useState(stepIndex);

  useEffect(() => {
    if (displayStepIndex === stepIndex) return;

    let nextRaf = 0;
    const firstRaf = requestAnimationFrame(() => {
      nextRaf = requestAnimationFrame(() => setDisplayStepIndex(stepIndex));
    });
    return () => {
      cancelAnimationFrame(firstRaf);
      cancelAnimationFrame(nextRaf);
    };
  }, [displayStepIndex, stepIndex]);

  const setupIcpComplete = outreachOnly ||
    titles.length > 0 &&
    industries.length > 0 &&
    locations.length > 0 &&
    keywords.length > 0 &&
    prompt.trim().length > 0;

  function previousStep(value: StepKey): StepKey {
    if (outreachOnly && value === "campaign") return "leads";
    if (value === "review") return "campaign";
    if (value === "campaign") return "leads";
    if (value === "leads") return "signals";
    return "icp";
  }
  function nextStep(value: StepKey): StepKey {
    if (value === "icp") return "signals";
    if (value === "signals") return "leads";
    if (value === "leads") return "campaign";
    return "review";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== "review") {
      if (step === "icp" && !setupIcpComplete) {
        setSetupStepError("Complete each field on this step to continue.");
        return;
      }
      setSetupStepError("");
      if (step === "leads") {
        if (!groupName.trim()) {
          setDiscoveryError("Name your lead group to continue.");
          return;
        }
        if (outreachOnly && !csvContents.trim()) {
          setDiscoveryError("Choose a CSV file with LinkedIn profiles to continue.");
          return;
        }
        // Step headers allow jumping, so re-check the ICP here: discovery
        // must never run against a partially configured agent.
        if (!outreachOnly && !setupIcpComplete) {
          setDiscoveryError(
            "Fill every ICP field (job titles, industries, locations, keywords, and the lead description) before discovering leads.",
          );
          setStep("icp");
          return;
        }
        // Full outreach setup is only persisted from the final Launch action.
        // Creating the agent here used to strand users at their plan limit if
        // they refreshed or left before the campaign step was submitted.
        if (isEditing || !leadsOnly) {
          setStep("campaign");
          return;
        }
        if (preparedAgent?.groupName === groupName.trim()) {
          router.push("/leads");
          return;
        }
        const formData = new FormData(event.currentTarget);
        setDiscoveryError("");
        setDiscovering(true);
        try {
          const result = await prepareAgent(formData);
          setPreparedAgent(result);
          setPreparedAgentId(result.agentId);
          // Leads-only agents are complete once prepared: the agent and its
          // lead group exist and discovery is scheduled - no campaign step.
          router.push("/leads");
        } catch (error) {
          setDiscoveryError(
            error instanceof Error ? error.message : "Lead discovery failed.",
          );
        } finally {
          setDiscovering(false);
        }
        return;
      }
      if (step === "campaign" && !groupName.trim()) {
        setStep("leads");
        return;
      }
      setStep(nextStep(step));
      return;
    }
    const formData = new FormData(event.currentTarget);
    if (!setupIcpComplete) {
      setSubmitError(
        "Fill every ICP field (job titles, industries, locations, keywords, and the lead description) before launching the agent.",
      );
      setStep("icp");
      return;
    }
    if (
      outreachMode === "manual" &&
      !formData.get("firstMessage") &&
      !formData.get("secondMessage") &&
      !formData.get("thirdMessage")
    ) {
      setSubmitError(
        "Add at least one message to your outreach sequence before launching the agent.",
      );
      return;
    }
    setSubmitError("");
    startTransition(async () => {
      try {
        await createAgent(formData);
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "digest" in error &&
          String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
        ) {
          throw error;
        }
        setSubmitError(error instanceof Error ? error.message : "Agent launch failed.");
      }
    });
  }

  function handleCompanySave() {
    if (!saveProductProfile) {
      setCompanyModalOpen(false);
      return;
    }
    const formData = new FormData();
    formData.set("companyName", companyName);
    formData.set("description", companyDescription);
    formData.set("industry", companyIndustry);
    formData.set("companySize", companySize);
    formData.set("painPointsText", companyPainPoints);
    startCompanySaving(async () => {
      await saveProductProfile(formData);
      setCompanyModalOpen(false);
    });
  }

  function applyDraft() {
    setDraftError("");
    setDrafting(true);
    void (async () => {
      try {
        const draft = await draftSetup();
        setName(draft.agentName || "New Agent");
        setGroupName(draft.groupName);
        setTitles(draft.titles.length ? draft.titles : initialTitles);
        setIndustries(draft.industries.length ? draft.industries : initialIndustries);
        setLocations(draft.locations.length ? draft.locations : initialLocations);
        setKeywords(draft.keywords.length ? draft.keywords : initialKeywords);
        setPrompt(draft.prompt);
        setSignalKeywords(draft.signalKeywords.length ? draft.signalKeywords : initialSignalKeywords);
        setCompetitorUrls(draft.competitorUrls);
        setFounderUrls(draft.founderUrls);
        setCampaignGoal(draft.campaignGoal);
        setMessageTone(draft.messageTone);
        setOutreachMode("manual");
        setActions((current) => {
          const [connect, message, follow] = current.length >= 3
            ? current
            : [makeSeqAction("connect"), makeSeqAction("message"), makeSeqAction("follow")];
          return [
            {
              ...connect,
              enabled: true,
              mode: "manual",
              manualMessage: draft.connectionNote,
              includeNote: true,
            },
            {
              ...message,
              enabled: true,
              mode: "manual",
              manualMessage: draft.firstMessage,
            },
            {
              ...follow,
              enabled: true,
              mode: "manual",
              manualMessage: draft.followUpMessage,
            },
          ];
        });
      } catch (error) {
        setDraftError(error instanceof Error ? error.message : "Gemini could not fill the setup.");
      } finally {
        setDrafting(false);
      }
    })();
  }

  function renderStepContent() {
    if (step === "icp")
      return (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                style={{ fontFamily: "var(--font-varta)" }}
                className="text-[20px] font-semibold tracking-tight text-zinc-950"
              >
                Define your ideal customer profile
              </h2>
              <p className="mt-1 text-[14px] font-medium text-zinc-700">
                Tell us who your perfect customers are so Omentir can find the right people.
              </p>
              {draftError ? (
                <p className="mt-2 text-[12px] font-light text-red-600">{draftError}</p>
              ) : null}
              {setupStepError ? (
                <p className="mt-2 text-[12px] font-light text-red-600">{setupStepError}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={applyDraft}
              disabled={drafting}
              style={{ fontFamily: "var(--font-varta)" }}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 self-start rounded-md bg-[#ba3871] px-3 text-[13px] font-semibold leading-none text-white shadow-[0_10px_25px_rgba(186,56,113,0.28)] transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
            >
              <span className="translate-y-px">{drafting ? "Filling..." : "Fill with AI"}</span>
            </button>
          </div>
          <TagRow label="Target job titles" name="titles" values={titles} setValues={setTitles} placeholder="e.g. Sales Manager" suggestions={TITLE_SUGGESTIONS} />
          <TagRow label="Target industries" name="industries" values={industries} setValues={setIndustries} placeholder="e.g. Marketing" suggestions={INDUSTRY_SUGGESTIONS} />
          <TagRow label="Target locations" name="locations" values={locations} setValues={setLocations} placeholder="e.g. United States" suggestions={LOCATION_SUGGESTIONS} />
          <TagRow label="Mandatory keywords" name="keywords" values={keywords} setValues={setKeywords} placeholder="e.g. B2B" suggestions={KEYWORD_SUGGESTIONS} />
          <TextAreaField
            name="prompt"
            label="Describe the leads you want"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            placeholder="Describe the exact leads this agent should find."
          />
        </div>
      );

    if (step === "signals")
      return (
        <div className="flex flex-col gap-6">
          <div>
            <h2
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-[20px] font-semibold tracking-tight text-zinc-950"
            >
              Choose intent signals
            </h2>
            <p className="mt-1 text-[14px] font-medium text-zinc-700">
              Tell Omentir where to look for buying intent and market activity.
            </p>
          </div>
          <TagRow label="Intent signal keywords" name="signalKeywords" values={signalKeywords} setValues={setSignalKeywords} placeholder="e.g. hiring SDRs" suggestions={SIGNAL_KEYWORD_SUGGESTIONS} />
          <TagRow label="Competitor LinkedIn URLs" name="competitorUrls" values={competitorUrls} setValues={setCompetitorUrls} placeholder="https://linkedin.com/company/..." />
        </div>
      );

    if (step === "leads")
      return (
        <div className="flex flex-col gap-6">
          <div>
            <h2
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-[20px] font-semibold tracking-tight text-zinc-950"
            >
              {outreachOnly ? "Upload your LinkedIn accounts" : "Set filters & scoring"}
            </h2>
            <p className="mt-1 text-[14px] font-medium text-zinc-700">
              {outreachOnly
                ? "Bring your own CSV of people you want to contact. Importing does not send messages."
                : "Choose where qualified leads should go and how strict the agent should be."}
            </p>
          </div>
          <TextInput
            label="New lead group name"
            value={groupName}
            onChange={(value) => {
              setGroupName(value);
              setPreparedAgent(null);
              setDiscoveryError("");
            }}
            name="leadGroupNameVisible"
            placeholder="e.g. High-intent SaaS leaders"
            required
          />
          {outreachOnly ? (
            <label className="grid cursor-pointer gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-5 hover:border-[#ba3871]">
              <span className="text-[14px] font-semibold text-zinc-900">LinkedIn profiles CSV</span>
              <span className="text-[13px] leading-5 text-zinc-600">
                Required column: LinkedIn URL. Optional: Name, First Name, Last Name, Title, Company, Location. Up to 500 unique profiles.
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#ba3871] file:px-3 file:py-2 file:font-semibold file:text-white"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  setDiscoveryError("");
                  if (!file) { setCsvContents(""); setCsvFileName(""); return; }
                  if (file.size > 1_000_000) { setCsvContents(""); setDiscoveryError("CSV files must be smaller than 1 MB."); return; }
                  setCsvFileName(file.name);
                  setCsvContents(await file.text());
                }}
              />
              {csvFileName ? <span className="text-[12px] font-medium text-emerald-700">Ready to import: {csvFileName}</span> : null}
            </label>
          ) : null}
          {discoveryError ? (
            <p className="text-[13px] font-light text-red-600">{discoveryError}</p>
          ) : null}
        </div>
      );

    if (step === "campaign") return renderCampaignStep();
    return renderReviewStep();
  }

  function renderReviewStep() {
    const goalLabel =
      campaignGoal === "warm"
        ? "Start conversations with warm prospects"
        : "Book qualified sales calls/demos";
    const toneLabel =
      messageTone === "professional"
        ? "Professional"
        : messageTone === "conversational"
          ? "Conversational"
          : "Direct";

    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-[24px] font-semibold tracking-tight text-zinc-950"
          >
            Review your agent
          </h2>
          <p className="mt-1 text-[14px] font-medium text-zinc-700">
            Take a quick look and stay in control at every step.
          </p>
          {submitError ? (
            <p className="mt-2 text-[13px] font-light text-red-600">{submitError}</p>
          ) : null}
        </div>

        {/* Always-in-control banner */}
        <div className="flex items-start gap-3 rounded-md border border-[#f6c6d3] bg-[#fff5f6] px-4 py-3.5">
          <span className="mt-0.5 text-[#e85e6b]">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <p
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-[13px] font-semibold text-[#ba3871]"
          >
            You&apos;re always in control.{" "}
            <span className="font-light">
              You can pause or readjust your agent at any time.
            </span>
          </p>
        </div>

        {/* LEAD SOURCES */}
        <div className="rounded-md border border-zinc-200 bg-white p-5">
          <div
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-[12px] font-bold uppercase tracking-wider text-zinc-900"
          >
            Lead Sources
          </div>
          <div className="mt-3 grid gap-2 text-[14px] leading-6 text-zinc-700">
            {signalKeywords.length ? (
              <p>
                <span className="font-semibold text-zinc-900">Keyword engagement: </span>
                {signalKeywords.join(", ")}
              </p>
            ) : null}
            {competitorUrls.length ? (
              <p>
                <span className="font-semibold text-zinc-900">Competitor sources: </span>
                {competitorUrls.length} URL(s)
              </p>
            ) : null}
            {founderUrls.length ? (
              <p>
                <span className="font-semibold text-zinc-900">Founder sources: </span>
                {founderUrls.length} URL(s)
              </p>
            ) : null}
            {!signalKeywords.length && !competitorUrls.length && !founderUrls.length ? (
              <p className="font-medium text-zinc-700">No signal sources configured.</p>
            ) : null}
          </div>
        </div>

        {/* TARGETING */}
        <div className="rounded-md border border-zinc-200 bg-white p-5">
          <div
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-[12px] font-bold uppercase tracking-wider text-zinc-900"
          >
            Targeting
          </div>
          <div className="mt-3 grid gap-2 text-[14px] leading-6 text-zinc-700">
            <p>
              <span className="font-semibold text-zinc-900">Job roles: </span>
              {titles.join(", ") || "-"}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">Industries: </span>
              {industries.join(", ") || "-"}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">Location: </span>
              {locations.join(", ") || "-"}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">Company size: </span>
              {keywords.length ? keywords.join(", ") : "-"}
            </p>
            <p className="text-[13px] font-medium text-zinc-600">Match level: High precision</p>
          </div>
        </div>

        {/* OUTREACH */}
        <div className="rounded-md border border-zinc-200 bg-white p-5">
          <div
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-[12px] font-bold uppercase tracking-wider text-zinc-900"
          >
            Outreach
          </div>
          <div className="mt-3 grid gap-2 text-[14px] leading-6 text-zinc-700">
            <p>
              {outreachMode === "automatic" ? "AI-generated sequence" : "Manual sequence"}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">Goal: </span>
              {goalLabel}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">Tone: </span>
              {toneLabel}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">Steps: </span>
              {actions.filter((a) => a.enabled).length} ({" "}
              {actions
                .filter((a) => a.enabled)
                .map((a) =>
                  a.kind === "connect" ? "Connect" : a.kind === "message" ? "Message" : "Follow-up",
                )
                .join(" - ")}{" "}
              )
            </p>
            <p>
              <span className="font-semibold text-zinc-900">First-degree connections: </span>
              {excludeFirstDegree ? "Excluded" : "Included"}
            </p>
            {outreachMode === "automatic" ? (
              <p>
                <span className="font-semibold text-zinc-900">When a lead replies: </span>
                {replyHandling === "handoff"
                  ? "Hand off to you after the first reply"
                  : "AI handles the entire deal"}
              </p>
            ) : null}
          </div>
        </div>

        {/* What happens after launch */}
        <div className="rounded-md border border-[#f6c6d3] bg-[#fff5f6] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-[#e85e6b]">-&gt;</span>
            <span
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-[14px] font-semibold text-[#ba3871]"
            >
              What will happen after launch
            </span>
          </div>
          <ul className="mt-2 grid gap-1.5 text-[13px] font-light text-[#ba3871]">
            <li>New leads will be added continuously from automatic sources.</li>
            <li>You can pause your agent anytime, edit sources, targeting, and outreach.</li>
          </ul>
        </div>
      </div>
    );
  }

  function renderCampaignStep() {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-[20px] font-semibold tracking-tight text-zinc-950"
          >
            Outreach settings
          </h2>
          <p className="mt-1 text-[14px] font-medium text-zinc-700">
            {outreachMode === "automatic"
              ? "Fine-tune how AI crafts and sends your messages."
              : "Build the LinkedIn sequence your agent will run."}
          </p>
        </div>

        <SelectField
          label="LinkedIn account"
          options={linkedInAccountSelectOptions}
          value={linkedInAccountId}
          onChange={setLinkedInAccountId}
          placeholder="Select LinkedIn account"
        />

        {/* AI / Manual selector */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setOutreachMode("automatic")}
            className={
              "relative rounded-md border p-5 text-left transition " +
              (outreachMode === "automatic"
                ? "border-[#e85e6b] bg-[#fff5f6]"
                : "border-zinc-200 bg-white hover:bg-zinc-50")
            }
          >
            <span
              style={{ fontFamily: "var(--font-varta)" }}
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#ba3871] px-2.5 py-0.5 text-[11px] font-semibold text-white"
            >
              Recommended
            </span>
            <div style={{ fontFamily: "var(--font-varta)" }} className="text-[15px] font-semibold text-zinc-950">
              AI writes outreach
            </div>
            <div className="mt-1 text-[13px] font-medium text-zinc-700">Generate messages from lead context.</div>
          </button>
          <button
            type="button"
            onClick={() => setOutreachMode("manual")}
            className={
              "rounded-md border p-5 text-left transition " +
              (outreachMode === "manual"
                ? "border-[#e85e6b] bg-[#fff5f6]"
                : "border-zinc-200 bg-white hover:bg-zinc-50")
            }
          >
            <div style={{ fontFamily: "var(--font-varta)" }} className="text-[15px] font-semibold text-zinc-950">
              Manual messages
            </div>
            <div className="mt-1 text-[13px] font-medium text-zinc-700">Use exact messages you write.</div>
          </button>
        </div>

        {outreachMode === "manual" ? (
          renderOutreachSequence()
        ) : (
          <>
        {/* Company info card - used by AI to personalize messages */}
        <CompanyInfoCard
          companyName={companyName}
          industry={companyIndustry}
          description={companyDescription}
          onEdit={() => setCompanyModalOpen(true)}
        />

        <input type="hidden" name="campaignGoal" value={campaignGoal} />
        <input type="hidden" name="messageTone" value={messageTone} />
        <input type="hidden" name="replyHandling" value={replyHandling} />

        {/* Campaign Goal */}
        <div className="rounded-md border border-zinc-200 bg-white p-5">
          <div
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-[12px] font-bold uppercase tracking-wider text-zinc-900"
          >
            Campaign Goal
          </div>
          <div className="mt-4 grid gap-2.5">
            {(
              [
                {
                  id: "warm",
                  title: "Start conversations with warm prospects",
                  desc: "Build relationships through personalized conversations",
                },
                {
                  id: "demo",
                  title: "Book qualified sales calls/demos",
                  desc: "Direct approach to schedule meetings",
                },
              ] as const
            ).map((option) => {
              const active = campaignGoal === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCampaignGoal(option.id)}
                  className={
                    "flex items-start gap-3 rounded-md border px-4 py-3.5 text-left transition " +
                    (active
                      ? "border-[#e85e6b] bg-[#fff5f6]"
                      : "border-zinc-200 bg-white hover:bg-zinc-50")
                  }
                >
                  <span
                    className={
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition " +
                      (active ? "border-[#e85e6b]" : "border-zinc-300")
                    }
                  >
                    {active ? <span className="h-2.5 w-2.5 rounded-full bg-[#e85e6b]" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      style={{ fontFamily: "var(--font-varta)" }}
                      className="block text-[14px] font-semibold text-zinc-950"
                    >
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-[13px] font-medium text-zinc-700">
                      {option.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation handling - who takes over once a lead replies */}
        <div className="rounded-md border border-zinc-200 bg-white p-5">
          <div
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-[12px] font-bold uppercase tracking-wider text-zinc-900"
          >
            When a lead replies
          </div>
          <div className="mt-4 grid gap-2.5">
            {(
              [
                {
                  id: "ai",
                  title: "AI handles the entire deal",
                  desc: "AI keeps the conversation going and emails you only when the lead is ready to close.",
                },
                {
                  id: "handoff",
                  title: "Hand the conversation off to me",
                  desc: "AI stops after the lead's first reply and emails you to continue it yourself.",
                },
              ] as const
            ).map((option) => {
              const active = replyHandling === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setReplyHandling(option.id)}
                  className={
                    "flex items-start gap-3 rounded-md border px-4 py-3.5 text-left transition " +
                    (active
                      ? "border-[#e85e6b] bg-[#fff5f6]"
                      : "border-zinc-200 bg-white hover:bg-zinc-50")
                  }
                >
                  <span
                    className={
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition " +
                      (active ? "border-[#e85e6b]" : "border-zinc-300")
                    }
                  >
                    {active ? <span className="h-2.5 w-2.5 rounded-full bg-[#e85e6b]" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      style={{ fontFamily: "var(--font-varta)" }}
                      className="block text-[14px] font-semibold text-zinc-950"
                    >
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-[13px] font-medium text-zinc-700">
                      {option.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Tone */}
        <div className="rounded-md border border-zinc-200 bg-white p-5">
          <div
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-[12px] font-bold uppercase tracking-wider text-zinc-900"
          >
            Message Tone
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {(
              [
                { id: "professional", title: "Professional", desc: "Formal, polished" },
                { id: "conversational", title: "Conversational", desc: "Friendly, casual" },
                { id: "direct", title: "Direct", desc: "Bold, confident" },
              ] as const
            ).map((option) => {
              const active = messageTone === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMessageTone(option.id)}
                  className={
                    "rounded-md border px-4 py-4 text-center transition " +
                    (active
                      ? "border-[#e85e6b] bg-[#fff5f6]"
                      : "border-zinc-200 bg-white hover:bg-zinc-50")
                  }
                >
                  <div
                    style={{ fontFamily: "var(--font-varta)" }}
                    className="text-[15px] font-semibold text-zinc-950"
                  >
                    {option.title}
                  </div>
                  <div className="mt-1 text-[13px] font-medium text-zinc-700">{option.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skip first-degree connections */}
        <input type="hidden" name="excludeFirstDegree" value={excludeFirstDegree ? "on" : ""} />
        <button
          type="button"
          onClick={() => setExcludeFirstDegree((v) => !v)}
          className="flex w-full items-start gap-3 rounded-md border border-zinc-200 bg-white p-4 text-left transition hover:bg-zinc-50"
        >
          <span
            className={
              "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md transition " +
              (excludeFirstDegree ? "bg-[#ffe8ea] text-[#e85e6b]" : "border border-zinc-300 bg-white")
            }
          >
            {excludeFirstDegree ? (
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span
              style={{ fontFamily: "var(--font-varta)" }}
              className="block text-[14px] font-semibold text-zinc-950"
            >
              Automatically exclude first degree connections from your campaign
            </span>
            <span className="mt-0.5 block text-[13px] font-medium text-zinc-700">
              Skip people you&apos;re already connected with on LinkedIn.
            </span>
          </span>
        </button>
          </>
        )}
      </div>
    );
  }

  function openEditStep(action: SeqAction) {
    setEditStepId(action.id);
    setEditStepMode("manual");
    setEditStepMessage(action.manualMessage);
    setEditStepWait(action.waitValue);
    setEditStepWaitUnit(action.waitUnit === "minutes" ? "hours" : action.waitUnit);
    setEditStepIncludeNote(action.includeNote !== false);
  }

  function saveEditStep() {
    setActions(
      actions.map((a) =>
        a.id === editStepId
          ? {
              ...a,
              mode: editStepMode,
              manualMessage: editStepMessage,
              waitValue: editStepWait,
              waitUnit: editStepWaitUnit,
              includeNote: editStepIncludeNote,
            }
          : a,
      ),
    );
    setEditStepId(null);
  }

  function renderOutreachSequence() {
    const enabledActions = actions.filter((a) => a.enabled);
    const editingAction = actions.find((a) => a.id === editStepId) ?? null;

    const TOKENS = ["{{firstName}}", "{{lastName}}", "{{company}}"];

    return (
      <div className="flex flex-col gap-5">
        {/* Stats row */}
        <div className="grid grid-cols-[32px_1fr] gap-3">
          <div />
          <div className="flex flex-wrap items-center gap-2">
            <span
              style={{ fontFamily: "var(--font-varta)" }}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-zinc-900 bg-white px-3 text-[12px] font-semibold leading-none text-zinc-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#e85e6b]" />
              <span className="translate-y-px">{enabledActions.length} steps</span>
            </span>
            <span
              style={{ fontFamily: "var(--font-varta)" }}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-zinc-900 bg-white px-3 text-[12px] font-semibold leading-none text-zinc-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
              <span className="translate-y-px">0 leads</span>
            </span>
          </div>
        </div>

        {/* Sequence list */}
        <div className="relative grid gap-5">
          <span
            aria-hidden
            className="absolute left-[15px] top-8 bottom-12 w-px bg-gradient-to-b from-zinc-200 via-zinc-200 to-transparent"
          />

          {enabledActions.map((action, index) => {
            const isConnect = action.kind === "connect";
            const showWait = index > 0;
            const messagePreview = action.manualMessage
              ? action.manualMessage.length > 80
                ? action.manualMessage.slice(0, 80) + "..."
                : action.manualMessage
              : null;

            return (
              <div key={action.id} className="grid grid-cols-[32px_1fr] items-start gap-3">
                <span
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="z-10 mt-1 grid h-8 w-8 place-items-center rounded-full bg-[#ffe8ea] text-[13px] font-bold text-[#e85e6b] shadow-[0_4px_12px_rgba(232,94,107,0.18)]"
                >
                  <span className="translate-y-px">{index + 1}</span>
                </span>

                <div className="flex flex-col gap-2">
                  {showWait ? (
                    <div className="flex items-center gap-1">
                      <div
                        style={{ fontFamily: "var(--font-varta)" }}
                        className="inline-flex h-6 w-fit items-center gap-1 rounded-full border border-dashed border-[#f6c6d3] bg-[#fff5f6] px-2 text-[11px] font-semibold leading-none text-[#ba3871]"
                      >
                        <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span className="translate-y-[1px] leading-none">
                          {action.waitValue} {action.waitValue === 1 ? action.waitUnit.slice(0, -1) : action.waitUnit} after
                        </span>
                      </div>
                      {editWaitId === action.id ? (
                        <>
                          <input
                            type="number"
                            min={1}
                            autoFocus
                            value={action.waitValue}
                            onChange={(e) => setActions(actions.map((a) => a.id === action.id ? { ...a, waitValue: Math.max(1, Number(e.target.value)) } : a))}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setEditWaitId(null); } }}
                            className="h-6 w-12 rounded-md border border-zinc-300 bg-white text-center text-[12px] font-medium text-zinc-700 outline-none focus:border-zinc-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <select
                            value={action.waitUnit === "days" ? "days" : "hours"}
                            onChange={(e) => setActions(actions.map((a) => a.id === action.id ? { ...a, waitUnit: e.target.value as "hours" | "days" } : a))}
                            className="h-6 cursor-pointer rounded-md border border-zinc-300 bg-white px-1 text-[12px] font-medium text-zinc-700 outline-none focus:border-zinc-900"
                          >
                            <option value="hours">hours</option>
                            <option value="days">days</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setEditWaitId(null)}
                            aria-label="Done editing wait time"
                            className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded text-[#16a34a] hover:bg-zinc-100"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditWaitId(action.id)}
                          aria-label="Edit wait time"
                          className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ) : null}

                  <div className="rounded-lg border border-zinc-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${isConnect ? "bg-[#ede7ff]" : "bg-[#dbeafe]"}`}>
                        <SeqIconRich kind={action.kind} colorClass={isConnect ? "text-[#7c5dff]" : "text-[#3b82f6]"} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div style={{ fontFamily: "var(--font-varta)" }} className="text-[15px] font-semibold leading-tight text-zinc-950">
                          {isConnect ? "Connection request" : "Send Message"}
                        </div>
                        <div className="mt-0.5 text-[12px] font-medium text-zinc-700">Step {index + 1}</div>
                      </div>
                      {!isConnect && (
                        <button
                          type="button"
                          onClick={() => setActions(actions.filter((a) => a.id !== action.id))}
                          aria-label="Remove step"
                          className="grid h-7 w-7 cursor-pointer place-items-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {isConnect ? (
                      <>
                        <div className="mt-3 flex items-center justify-between rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2">
                          <span style={{ fontFamily: "var(--font-varta)" }} className="text-[12px] font-semibold text-zinc-700">Include invitation note</span>
                          <button
                            type="button"
                            onClick={() => setActions(actions.map((a) => a.id === action.id ? { ...a, includeNote: !a.includeNote } : a))}
                            className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${action.includeNote ? "bg-[#7c5dff]" : "bg-zinc-300"}`}
                          >
                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${action.includeNote ? "left-4" : "left-0.5"}`} />
                          </button>
                        </div>
                        <p className="mt-2 text-[13px] italic font-medium text-zinc-700">
                          {action.mode !== "ai" && action.includeNote && action.manualMessage
                            ? `"${messagePreview}"`
                            : "No note attached"}
                        </p>
                      </>
                    ) : (
                      <div className="mt-3 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2.5">
                        <p className="text-[13px] italic leading-5 font-medium text-zinc-700">
                          {messagePreview ? `"${messagePreview}"` : <span className="not-italic font-medium text-zinc-600">No message written yet.</span>}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-[12px]">
                      {isConnect ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          0 accepted
                        </span>
                      ) : <span />}
                      <div className="flex items-center gap-3 font-medium text-zinc-700">
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                          </svg>
                          0 contact(s)
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditStep(action)}
                          style={{ fontFamily: "var(--font-varta)" }}
                          className="inline-flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 font-semibold leading-none text-zinc-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-zinc-100 hover:text-zinc-950"
                        >
                          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                          <span className="translate-y-[1px] leading-none">Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add step */}
          <div className="grid grid-cols-[32px_1fr] items-center gap-3">
            <span className="z-10 grid h-8 w-8 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <button
              type="button"
              onClick={() => {
                const next = makeSeqAction("message");
                setActions([...actions, next]);
                openEditStep(next);
              }}
              className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-300 bg-white p-4 text-left transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
              <div>
                <div style={{ fontFamily: "var(--font-varta)" }} className="text-[14px] font-semibold text-zinc-950">Add a step</div>
                <div className="text-[12px] font-medium text-zinc-700">Message, invitation, profile visit...</div>
              </div>
            </button>
          </div>
        </div>

        {/* -- Edit Campaign Step modal -- */}
        {editStepId && editingAction ? (
          <div
            className="m3-dialog-scrim z-50"
            role="presentation"
            onClick={() => setEditStepId(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="agent-edit-step-title"
              className="m3-dialog-surface flex max-h-[90vh] flex-col overflow-hidden !p-0"
              onClick={(event) => event.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] px-6 py-4">
                <h3 id="agent-edit-step-title" className="m3-dialog-title text-[17px]">
                  Edit campaign step
                </h3>
                <button
                  type="button"
                  onClick={() => setEditStepId(null)}
                  aria-label="Close"
                  className="ms-icon-button text-[var(--md-sys-color-on-surface-variant)]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
                {/* Manual outreach: every step sends the message you write. */}
                <div className="rounded-lg border border-[#e85e6b] bg-[#fff5f6] p-4 text-center">
                  <div style={{ fontFamily: "var(--font-varta)" }} className="text-[14px] font-semibold text-zinc-950">
                    Same message for everyone
                  </div>
                  <div className="mt-0.5 text-[12px] font-medium text-zinc-700">Use variables to craft your message</div>
                </div>

                {/* Include note toggle - only for connect step in manual mode */}
                {editingAction.kind === "connect" && editStepMode === "manual" ? (
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <div>
                      <div style={{ fontFamily: "var(--font-varta)" }} className="text-[14px] font-semibold text-zinc-950">Include note with invitation</div>
                      <div className="text-[12px] font-medium text-zinc-700">Add a personalised note to your connection request</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditStepIncludeNote((v) => !v)}
                      className={"relative h-5 w-9 cursor-pointer rounded-full " + (editStepIncludeNote ? "bg-[#e85e6b]" : "bg-zinc-300")}
                    >
                      <span className={"absolute top-0.5 h-4 w-4 rounded-full bg-white transition " + (editStepIncludeNote ? "left-4" : "left-0.5")} />
                    </button>
                  </div>
                ) : null}

                {/* Message content - shown when manual (and note enabled for connect) */}
                {(editStepMode === "manual" && (editingAction.kind !== "connect" || editStepIncludeNote)) ? (
                  <div className="flex flex-col gap-3">
                    <TextAreaField
                      label="Message Content"
                      value={editStepMessage}
                      onChange={(e) => setEditStepMessage(e.target.value)}
                      rows={6}
                      placeholder="Write your message here..."
                    />
                    {/* Token chips */}
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                      <span style={{ fontFamily: "var(--font-varta)" }} className="text-[12px] font-bold text-zinc-700">Insert:</span>
                      {TOKENS.map((token) => (
                        <button
                          key={token}
                          type="button"
                          onClick={() => setEditStepMessage((m) => m + token)}
                          style={{ fontFamily: "var(--font-varta)" }}
                          className="inline-flex h-7 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white px-2.5 text-[12px] font-medium text-zinc-700 shadow-sm hover:bg-zinc-100"
                        >
                          <span className="translate-y-[1px] leading-none">
                            {token.replace(/[{}]/g, "").replace("firstName", "FirstName").replace("lastName", "LastName").replace("company", "Company")}
                          </span>
                        </button>
                      ))}
                      <span className="ml-auto text-[12px] font-medium text-zinc-600">{editStepMessage.length}/1900</span>
                    </div>

                    {/* Preview link */}
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
                      style={{ fontFamily: "var(--font-varta)" }}
                      className="self-start text-[13px] font-semibold text-[#e85e6b] hover:underline"
                    >
                      Preview message for a lead -&gt;
                    </button>
                  </div>
                ) : null}

                {/* Wait time - only for non-first steps */}
                {editingAction.kind !== "connect" ? (
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "var(--font-varta)" }} className="text-[13px] font-semibold text-zinc-900">Wait</span>
                    <TextField
                      type="number"
                      min={1}
                      value={editStepWait}
                      onChange={(e) => setEditStepWait(Math.max(1, Number(e.target.value)))}
                      label="Wait"
                      className="w-28"
                    />
                    <SelectField
                      options={[{ value: "hours", label: "hours" }, { value: "days", label: "days" }]}
                      value={editStepWaitUnit}
                      onChange={(v) => setEditStepWaitUnit(v as "hours" | "days")}
                      placeholder="hours"
                      className="w-32"
                    />
                    <span style={{ fontFamily: "var(--font-varta)" }} className="text-[13px] font-medium text-zinc-700">after previous step</span>
                  </div>
                ) : null}
              </div>

              {/* Modal footer */}
              <div className="m3-dialog-actions border-t border-[var(--md-sys-color-outline-variant)] px-6 py-3.5 !mt-0">
                <button
                  type="button"
                  onClick={() => setEditStepId(null)}
                  className="m3-dialog-btn m3-dialog-btn--text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEditStep}
                  className="m3-dialog-btn m3-dialog-btn--filled"
                >
                  Save step
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* -- Preview modal -- */}
        {previewOpen ? (
          <div
            className="m3-dialog-scrim z-[60]"
            role="presentation"
            onClick={() => setPreviewOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="agent-preview-title"
              className="m3-dialog-surface"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="agent-preview-title" className="m3-dialog-title">
                Preview message
              </h2>
              <p className="m3-dialog-body">
                Select a lead to see how the message will look
              </p>
              <div className="mt-4 grid gap-1.5">
                <span className="text-[13px] font-medium text-[var(--md-sys-color-on-surface)]">
                  Select contact
                </span>
                <SelectField
                  options={[{ value: "lead1", label: "Sample Lead 1" }, { value: "lead2", label: "Sample Lead 2" }]}
                  value={previewLead}
                  onChange={setPreviewLead}
                  placeholder="Choose a lead..."
                />
              </div>
              {previewLead ? (
                <div className="mt-4 rounded-lg bg-[var(--md-sys-color-surface-container-low)] p-3 text-[13px] leading-5 text-[var(--md-sys-color-on-surface-variant)]">
                  {editStepMessage
                    .replace("{{firstName}}", "Alex")
                    .replace("{{lastName}}", "Johnson")
                    .replace("{{company}}", "Acme Corp") || <span className="italic">No message to preview.</span>}
                </div>
              ) : null}
              <div className="m3-dialog-actions">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="m3-dialog-btn m3-dialog-btn--text"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const enabledActions = actions.filter((action) => action.enabled);
  const connectAction = enabledActions.find((action) => action.kind === "connect");
  const messageActions = enabledActions.filter((action) => action.kind !== "connect");
  const firstMessageAction = messageActions[0];
  const secondMessageAction = messageActions[1];
  const thirdMessageAction = messageActions[2];
  const waitAsMinutes = (action: SeqAction | undefined, fallback: number) => {
    if (!action) return fallback;
    if (action.waitUnit === "days") return action.waitValue * 24 * 60;
    if (action.waitUnit === "hours") return action.waitValue * 60;
    return action.waitValue;
  };
  const waitAsHours = (action: SeqAction | undefined, fallback: number) => {
    if (!action) return fallback;
    if (action.waitUnit === "days") return action.waitValue * 24;
    if (action.waitUnit === "minutes") return Math.max(1, Math.round(action.waitValue / 60));
    return action.waitValue;
  };

  return (
    <form onSubmit={handleSubmit} className="app-x flex h-full min-h-0 min-w-0 flex-col gap-2 md:ml-4 md:mr-0.5 md:pb-3">
      <AiLoadingOverlay
        open={drafting}
        title="Finding your ideal customer profile with AI"
        note="Usually takes 20 seconds"
      />
      <AiLoadingOverlay
        open={discovering}
        title="Preparing lead discovery"
        note="Usually takes a few seconds"
      />
      <AiLoadingOverlay
        open={analyzingCompany}
        title="Analysing your website with AI"
        note="Usually takes 20 seconds"
      />
      <input type="hidden" name="agentId" value={initialAgent?.id || ""} />
      <input type="hidden" name="linkedInAccountId" value={linkedInAccountId} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="groupName" value={groupName} />
      <input type="hidden" name="groupId" value="__new__" />
      <input type="hidden" name="newGroupName" value={groupName} />
      <input type="hidden" name="preparedAgentId" value={preparedAgentId} />
      {outreachOnly ? <textarea hidden name="csvContents" value={csvContents} readOnly /> : null}
      <input type="hidden" name="prompt" value={prompt} />
      {titles.map((value) => <input key={`title-${value}`} type="hidden" name="titles" value={value} />)}
      {industries.map((value) => <input key={`industry-${value}`} type="hidden" name="industries" value={value} />)}
      {locations.map((value) => <input key={`location-${value}`} type="hidden" name="locations" value={value} />)}
      {keywords.map((value) => <input key={`keyword-${value}`} type="hidden" name="keywords" value={value} />)}
      {signalKeywords.map((value) => <input key={`signal-${value}`} type="hidden" name="signalKeywords" value={value} />)}
      {competitorUrls.map((value) => <input key={`competitor-${value}`} type="hidden" name="competitorUrls" value={value} />)}
      {founderUrls.map((value) => <input key={`founder-${value}`} type="hidden" name="founderUrls" value={value} />)}
      <input
        type="hidden"
        name="connectionNote"
        value={
          connectAction?.mode === "ai" || connectAction?.includeNote === false
            ? ""
            : connectAction?.manualMessage || ""
        }
      />
      <input type="hidden" name="afterApprovalMinutes" value={waitAsMinutes(firstMessageAction, 15)} />
      <input type="hidden" name="firstMessage" value={firstMessageAction?.manualMessage || ""} />
      <input type="hidden" name="secondWaitHours" value={waitAsHours(secondMessageAction, 18)} />
      <input type="hidden" name="secondMessage" value={secondMessageAction?.manualMessage || ""} />
      <input type="hidden" name="thirdWaitHours" value={waitAsHours(thirdMessageAction, 30)} />
      <input type="hidden" name="thirdMessage" value={thirdMessageAction?.manualMessage || ""} />
      {outreachMode === "automatic" ? (
        <input type="hidden" name="aiDefaultOutreach" value="on" />
      ) : (
        <input type="hidden" name="manualDefaultOutreach" value="on" />
      )}
      <input type="hidden" name="mode" value={outreachOnly ? "outreach" : "signals"} />

      {!setupMode ? (
        <>
          {/* Mobile-only fixed header buttons (overlays mobile top bar) */}
          <Link
            href="/agents"
            style={{ fontFamily: "var(--font-varta)" }}
            className="m3-mobile-header-action fixed right-[92px] z-[91] inline-flex h-7 cursor-pointer items-center px-2 text-[12px] font-semibold leading-none text-zinc-700 hover:text-zinc-900 md:hidden"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending || discovering}
            style={{ fontFamily: "var(--font-varta)" }}
            className="m3-mobile-header-action fixed right-3 z-[91] inline-flex h-7 cursor-pointer items-center justify-center rounded-md bg-[#ba3871] px-3 text-[12px] font-semibold text-white transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
          >
            <span className="translate-y-px leading-none">
              {discovering
                ? leadsOnly
                  ? "Launching..."
                  : "Finding..."
                : pending
                  ? step === finalStep
                    ? "Launching..."
                    : "Creating..."
                  : step === finalStep
                    ? "Launch"
                    : "Continue"}
            </span>
          </button>

          {/* Header - same theme as other pages */}
          <div className="hidden shrink-0 flex-col items-start justify-between gap-3 pt-6 md:flex md:flex-row md:items-center">
            <div className="min-w-0">
              <h1
                style={{ fontFamily: "var(--font-varta)" }}
                className="flex min-w-0 items-center gap-2 text-2xl font-semibold leading-none tracking-tight text-zinc-950 sm:text-3xl"
              >
                <span
                  className="material-symbols-outlined shrink-0 text-[20px]! font-light leading-none text-zinc-500"
                  aria-hidden="true"
                >
                  edit
                </span>
                <span className="inline-grid min-w-0 max-w-full">
                  <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-pre">
                    {`${name} `}
                  </span>
                  <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-pre">
                    {"New Agent "}
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="col-start-1 row-start-1 w-full min-w-0 border-0 bg-transparent shadow-none outline-none"
                    aria-label="Agent name"
                  />
                </span>
              </h1>
            </div>

            <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
              <Link
                href="/agents"
                style={{ fontFamily: "var(--font-varta)" }}
                className="flex h-8 cursor-pointer items-center px-3 text-[13px] font-semibold text-zinc-700 hover:text-zinc-900"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={pending || discovering}
                style={{ fontFamily: "var(--font-varta)" }}
                className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#ba3871] px-4 text-[13px] font-semibold text-white shadow-[0_12px_35px_rgba(186,56,113,0.35)] transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="translate-y-px leading-none">{discovering
                  ? leadsOnly
                    ? "Launching..."
                    : "Finding leads..."
                  : pending
                    ? step === finalStep
                      ? "Launching..."
                      : "Creating..."
                    : step === finalStep
                      ? "Launch agent"
                      : "Continue"}</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="shrink-0 pt-3">
          <div className="flex h-10 items-center gap-3">
            <LogoMark className="h-10 w-10" />
            <div
              style={{ fontFamily: "var(--font-varta)" }}
              className="flex h-10 translate-y-px items-center gap-2 text-[28px] font-semibold leading-[40px] tracking-tight text-zinc-950"
            >
              <span>Omentir</span>
              <span className="text-zinc-600">Setup</span>
            </div>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className={"flex shrink-0 flex-nowrap items-center gap-3 overflow-x-auto py-1 sm:flex-wrap sm:justify-center sm:gap-5 " + (setupMode ? "mt-5" : "mt-4 mb-1.5 sm:mt-0 sm:mb-0")}>
        {steps.map(([key, number, title], index) => {
          const active = index === displayStepIndex;
          const isPast = index < displayStepIndex;
          const filled = isPast || active;
          const actualActive = step === key;
          // Steps ahead of the current one are locked: moving forward must go
          // through Continue so each step's validation runs.
          const locked = setupMode ? !actualActive : index > stepIndex;
          return (
            <div key={key} className="flex items-center gap-3 sm:gap-5">
              <button
                type="button"
                onClick={() => {
                  if (!discovering && !locked) setStep(key);
                }}
                disabled={discovering || locked}
                className="flex shrink-0 cursor-pointer items-center gap-2.5 disabled:cursor-not-allowed"
              >
                <span
                  style={{ fontFamily: "var(--font-varta)" }}
                  className={
                    "grid h-9 w-9 place-items-center rounded-full text-[14px] font-semibold transition-colors duration-300 delay-500 " +
                    (filled
                      ? "bg-[#ba3871] text-white"
                      : "border border-zinc-300 bg-white text-zinc-400")
                  }
                >
                  {isPast ? <ProgressCheckIcon /> : number}
                </span>
                <span
                  style={{ fontFamily: "var(--font-varta)" }}
                  className={
                    "text-[15px] transition-colors duration-300 delay-500 " +
                    (active
                      ? "font-semibold text-zinc-900"
                      : filled
                        ? "font-medium text-zinc-600"
                        : "text-zinc-400")
                  }
                >
                  {title}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <span className="relative h-0.5 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-200 sm:h-[3px] sm:w-16">
                  <span
                    className={
                      "absolute inset-y-0 left-0 rounded-full bg-[#ba3871] transition-[width] duration-700 ease-out " +
                      (isPast ? "w-full" : "w-0")
                    }
                  />
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Centered single card */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-4 sm:p-10">
          {renderStepContent()}

          {/* Card footer */}
          <div className={"mt-8 flex items-center gap-3 border-t border-zinc-100 pt-5 " + (!setupMode && step !== "icp" ? "justify-between" : "justify-end")}>
            {!setupMode && step !== "icp" ? (
              <button
                type="button"
                onClick={() => setStep(previousStep(step))}
                disabled={discovering}
                style={{ fontFamily: "var(--font-varta)" }}
                className="flex h-10 cursor-pointer items-center justify-center gap-1 rounded-md border border-zinc-200 bg-white px-4 text-[13px] font-medium leading-none text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Back
              </button>
            ) : null}
            <button
              type="submit"
              disabled={pending || discovering}
              style={{ fontFamily: "var(--font-varta)" }}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-1 rounded-md bg-[#ba3871] px-5 text-[13px] font-semibold leading-none text-white shadow-[0_12px_35px_rgba(186,56,113,0.35)] transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="translate-y-px leading-none">{discovering
                ? leadsOnly
                  ? "Launching..."
                  : "Finding leads..."
                : pending
                  ? "Creating..."
                  : step === finalStep
                    ? "Launch agent"
                    : "Continue"}</span>
            </button>
          </div>
        </section>

        <CompanyEditModal
          open={companyModalOpen}
          saving={companySaving}
          analyzing={analyzingCompany}
          analyzeError={companyAnalyzeError}
          values={{
            companyName,
            description: companyDescription,
            industry: companyIndustry,
            companySize,
            painPointsText: companyPainPoints,
            websiteUrl: companyWebsiteUrl,
          }}
          setValues={{
            setCompanyName,
            setCompanyDescription,
            setCompanyIndustry,
            setCompanySize,
            setCompanyPainPoints,
            setWebsiteUrl: setCompanyWebsiteUrl,
          }}
          onSubmit={handleCompanySave}
          onAnalyze={handleCompanyAnalyze}
          onClose={() => setCompanyModalOpen(false)}
        />
      </div>
    </form>
  );
}
