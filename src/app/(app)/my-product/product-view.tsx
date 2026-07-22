"use client";

import { useEffect, useState, useTransition } from "react";
import type { ProductProfile } from "@/lib/server/types";
import AiLoadingOverlay from "@/app/ai-loading-overlay";
import { SelectField } from "@/app/ui/select";
import { TextAreaField, TextField } from "@/app/ui/text-field";

type ProductViewProps = {
  profile?: ProductProfile;
  saveAction: (formData: FormData) => void | Promise<void>;
  analyzeAction: (formData: FormData) => void | Promise<void>;
};

const INDUSTRY_OPTIONS = [
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

function TextInput({
  name,
  value,
  onChange,
  label,
  placeholder,
  type = "text",
  required,
}: {
  name: string;
  value: string;
  onChange: (next: string) => void;
  label?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <TextField
      name={name}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      label={label}
      placeholder={placeholder}
      required={required}
    />
  );
}

function Textarea({
  name,
  value,
  onChange,
  label,
  placeholder,
  rows = 3,
}: {
  name: string;
  value: string;
  onChange: (next: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <TextAreaField
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      label={label}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

function ListField({
  name,
  values,
  onChange,
  addPlaceholder,
}: {
  name: string;
  values: string[];
  onChange: (next: string[]) => void;
  addPlaceholder: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const next = draft.trim();
    if (!next) return;
    if (values.some((value) => value.toLowerCase() === next.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, next]);
    setDraft("");
  }

  return (
    <div className="grid gap-2">
      {values.map((value) => (
        <input key={`hidden-${value}`} type="hidden" name={name} value={value} />
      ))}
      {values.map((value, idx) => (
        <div key={`${value}-${idx}`} className="flex items-center gap-2">
          <TextField
            className="min-w-0 flex-1"
            value={value}
            onChange={(event) => {
              const next = [...values];
              next[idx] = event.target.value;
              onChange(next);
            }}
            label={`Item ${idx + 1}`}
          />
          <button
            type="button"
            onClick={() => onChange(values.filter((_, i) => i !== idx))}
            aria-label="Remove"
            className="grid h-14 w-14 shrink-0 cursor-pointer place-items-center rounded-md text-[#e85e6b] hover:bg-[#fff5f6]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <TextField
          className="min-w-0 flex-1"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          label={addPlaceholder}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="h-14 shrink-0 cursor-pointer rounded-md bg-zinc-100 px-4 text-[14px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function ProductView({ profile, saveAction, analyzeAction }: ProductViewProps) {
  const [pending, startTransition] = useTransition();
  const [analyzing, startAnalyzing] = useTransition();

  const [companyName, setCompanyName] = useState(profile?.companyName ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile?.websiteUrl ?? "");
  const [industry, setIndustry] = useState(profile?.industry ?? "");
  const [companySize, setCompanySize] = useState(profile?.companySize ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [painPointsText, setPainPointsText] = useState(profile?.painPointsText ?? "");
  const [keyFeatures, setKeyFeatures] = useState<string[]>(profile?.keyFeatures ?? []);
  const [socialProof, setSocialProof] = useState<string[]>(profile?.socialProof ?? []);
  const [linkedInCompanyPage, setLinkedInCompanyPage] = useState(profile?.linkedInCompanyPage ?? "");
  const [averageTicketSize, setAverageTicketSize] = useState(
    profile?.averageTicketSize ? String(profile.averageTicketSize) : "",
  );

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.companyName ?? "");
      setWebsiteUrl(profile.websiteUrl ?? "");
      setIndustry(profile.industry ?? "");
      setCompanySize(profile.companySize ?? "");
      setDescription(profile.description ?? "");
      setPainPointsText(profile.painPointsText ?? "");
      setKeyFeatures(profile.keyFeatures ?? []);
      setSocialProof(profile.socialProof ?? []);
      setLinkedInCompanyPage(profile.linkedInCompanyPage ?? "");
      setAverageTicketSize(profile.averageTicketSize ? String(profile.averageTicketSize) : "");
    }
  }, [profile]);

  function handleAnalyze() {
    if (!websiteUrl.trim()) return;
    const formData = new FormData();
    formData.set("websiteUrl", websiteUrl);
    startAnalyzing(() => analyzeAction(formData));
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    [
      ["keyFeatures", keyFeatures],
      ["socialProof", socialProof],
    ].forEach(([key, list]) => {
      formData.delete(key as string);
      (list as string[]).forEach((value) => formData.append(key as string, value));
    });
    startTransition(() => saveAction(formData));
  }

  return (
    <form onSubmit={handleSave} className="flex h-full min-h-0 min-w-0 flex-col gap-3 md:ml-4 md:mr-0.5">
      <AiLoadingOverlay
        open={analyzing}
        title="Analysing your website with AI"
        note="Usually takes 30 seconds"
      />

      {/* Mobile header save button - fixed in the top bar */}
      <button
        type="submit"
        disabled={pending}
        style={{ fontFamily: "var(--font-varta)" }}
        className="m3-mobile-header-action fixed right-2 z-[91] inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-[var(--md-sys-color-primary)] px-4 text-xs font-semibold text-[var(--md-sys-color-on-primary)] transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
      >
        <span className="translate-y-px">{pending ? "Saving..." : "Save changes"}</span>
      </button>

      {/* Header — primary action matches Leads "Add leads" */}
      <div className="app-x hidden shrink-0 items-center justify-between gap-3 pt-6 md:flex">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-3xl">
            My Product
          </h1>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="m3-btn m3-btn-filled h-10 shrink-0 gap-1.5 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {pending ? "Saving..." : "Save changes"}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="mt-2 min-h-0 flex-1 overflow-hidden md:mt-0">
        <div className="app-x h-full overflow-y-auto">
          <div className="max-w-5xl pb-8 pt-1 sm:pb-10 sm:pt-2 md:pb-3">
            {/* Section heading */}
            <div className="mb-8">
              <h2
                style={{ fontFamily: "var(--font-varta)" }}
                className="text-xl font-semibold tracking-tight text-zinc-950"
              >
                Company Information
              </h2>
              <span className="mt-1.5 block h-0.5 w-8 rounded-full bg-[#ba3871]/60" aria-hidden />
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                These details power your AI-generated messages. Update them whenever your value proposition changes.
              </p>
            </div>

            {/* Company Name + Website */}
            <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
              <div>
                <TextInput
                  name="companyName"
                  value={companyName}
                  onChange={setCompanyName}
                  label="Company Name"
                  placeholder="Acme Inc."
                  required
                />
              </div>
              <div>
                <div className="flex flex-row items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <TextInput
                      name="websiteUrl"
                      value={websiteUrl}
                      onChange={setWebsiteUrl}
                      label="Website"
                      placeholder="acme.com"
                    />
                  </div>
                  {/* mt-2 = outlined field top pad so button lines up with the 56px shell */}
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analyzing || !websiteUrl.trim()}
                    className="m3-btn m3-btn-filled mt-2 h-14 shrink-0 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {analyzing ? "Analysing..." : "AI Analyse"}
                  </button>
                </div>
              </div>
            </div>

            {/* Industry + Company Size */}
            <div className="mt-8 grid gap-x-6 gap-y-6 md:grid-cols-2">
              <div>
                <SelectField
                  label="Industry"
                  name="industry"
                  value={industry}
                  onChange={setIndustry}
                  placeholder="Select industry"
                  options={INDUSTRY_OPTIONS}
                />
              </div>
              <div>
                <SelectField
                  label="Company Size"
                  name="companySize"
                  value={companySize}
                  onChange={setCompanySize}
                  placeholder="Select company size"
                  options={COMPANY_SIZE_OPTIONS}
                />
              </div>
            </div>

            {/* Average Ticket Size */}
            <div className="mt-8 md:max-w-xs">
              <TextField
                name="averageTicketSize"
                inputMode="numeric"
                value={averageTicketSize}
                onChange={(event) => setAverageTicketSize(event.target.value)}
                label="Average Ticket Size"
                placeholder="5,000"
                className="average-ticket-size-field"
                leadingIcon={<span className="text-[16px] font-medium">$</span>}
                supportingText="Your typical deal value per customer, used to estimate pipeline generated."
              />
            </div>

            {/* Company Description */}
            <div className="mt-8">
              <Textarea
                name="description"
                value={description}
                onChange={setDescription}
                label="Company Description"
                placeholder="Describe what your company does, who it's for, and the value it provides."
                rows={3}
              />
            </div>

            {/* Pain Points */}
            <div className="mt-8">
              <Textarea
                name="painPointsText"
                value={painPointsText}
                onChange={setPainPointsText}
                label="Pain Points"
                placeholder="What problems does your product solve for customers?"
                rows={3}
              />
            </div>

            {/* Key Features */}
            <div className="mt-8">
              <p className="mb-2 text-[12px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                Key Features
              </p>
              <ListField
                name="keyFeatures"
                values={keyFeatures}
                onChange={setKeyFeatures}
                addPlaceholder="Add a key feature..."
              />
            </div>

            {/* Social Proof */}
            <div className="mt-8">
              <p className="mb-2 text-[12px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                Social Proof
              </p>
              <ListField
                name="socialProof"
                values={socialProof}
                onChange={setSocialProof}
                addPlaceholder="Add social proof..."
              />
            </div>

            {/* LinkedIn Company Page */}
            <div className="mt-8 pb-2">
              <TextInput
                name="linkedInCompanyPage"
                value={linkedInCompanyPage}
                onChange={setLinkedInCompanyPage}
                label="LinkedIn Company Page"
                placeholder="https://linkedin.com/company/your-company"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
