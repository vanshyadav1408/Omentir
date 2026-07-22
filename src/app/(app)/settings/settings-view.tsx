"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { LinkedInAccount, Workspace } from "@/lib/server/types";
import { ContentReveal, LinkedInAccountsSkeleton } from "@/app/app-skeletons";
import { ThemePreferenceControl } from "@/app/theme-toggle";
import { useSidebarResource } from "@/app/use-sidebar-resource";
import SignOutButton from "./sign-out-button";
import { SelectField } from "@/app/ui/select";
import { M3NotchedOutline, TextField } from "@/app/ui/text-field";

type SettingsViewProps = {
  workspace: Workspace;
  linkedInAccounts: LinkedInAccount[];
  user: { name: string; email: string; imageUrl?: string };
  saveAction: (formData: FormData) => void | Promise<void>;
  disconnectAction: (formData: FormData) => void | Promise<void>;
  localMode?: boolean;
  notificationsEnabled?: boolean;
};

const TABS = ["Profile", "Connected Accounts", "Subscription"] as const;
type Tab = (typeof TABS)[number];

const selectLinkedInAccounts = (data: Record<string, unknown>) =>
  (data.accounts as LinkedInAccount[]) || [];

const LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese"];
const COMMON_TIMEZONES = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu", "Europe/London", "Europe/Berlin", "Europe/Paris", "Europe/Moscow", "Asia/Dubai", "Asia/Kolkata", "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland"];
const TIMEZONE_IDS = Array.from(new Set([
  ...(typeof Intl !== "undefined" && Intl.supportedValuesOf
    ? Intl.supportedValuesOf("timeZone")
    : []),
  ...COMMON_TIMEZONES,
]));
const TIMEZONES = TIMEZONE_IDS.map((tz) => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(now);
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value || "GMT";
  const offset = offsetPart === "GMT" ? "GMT+00:00" : offsetPart.replace("GMT", "GMT");
  return `(${offset}) ${tz}`;
});

// Sort by offset numerically then alphabetically
TIMEZONES.sort((a, b) => {
  const parseOffset = (s: string) => {
    const match = s.match(/GMT([+-]?)(\d{1,2}):?(\d{2})?/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3] || "0", 10);
    return sign * (hours * 60 + minutes);
  };
  const diff = parseOffset(a) - parseOffset(b);
  if (diff !== 0) return diff;
  return a.localeCompare(b);
});

function timezoneOption(timezone?: string) {
  const name = timezone || "UTC";
  return (
    TIMEZONES.find((option) => option.endsWith(`) ${name}`)) ||
    TIMEZONES.find((option) => option.endsWith(") UTC")) ||
    TIMEZONES[0]
  );
}
const DATE_FORMATS = [
  "May 12, 2025 (MMM D, YYYY)",
  "12 May 2025 (D MMM YYYY)",
  "2025-05-12 (YYYY-MM-DD)",
];

function billingPill(status?: string) {
  if (status === "active" || status === "bypassed")
    return { label: "Active", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  if (status === "approval_pending" || status === "pending")
    return { label: "Pending", cls: "border-amber-200 bg-amber-50 text-amber-800" };
  if (status === "suspended" || status === "cancelled" || status === "expired")
    return { label: "Inactive", cls: "border-zinc-200 bg-zinc-100 text-zinc-700" };
  return { label: "Active", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" };
}

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

function SearchableSelectField({
  value,
  onChange,
  options,
  placeholder,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const floated = open || Boolean(value);
  const fieldLabel = label || placeholder || "Select";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const filtered = search.trim()
    ? options.filter((option) => option.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Show current time for each timezone in the filtered list
  function getCurrentTime(tzOption: string) {
    const tzName = tzOption.replace(/^\([^)]*\)\s*/, "");
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: tzName,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date());
    } catch {
      return "";
    }
  }

  return (
    <div
      className="m3-text-field m3-text-field--outlined relative"
      data-focused={open ? "true" : "false"}
      data-floated={floated ? "true" : "false"}
      data-error="false"
      data-disabled="false"
      ref={ref}
    >
      <div className="m3-text-field__body">
        <span className="m3-text-field__label pointer-events-none" aria-hidden="true">
          {fieldLabel}
        </span>
        <div className="m3-text-field__shell">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className={`m3-text-field__input flex w-full items-center justify-between gap-2 !h-[var(--md-sys-text-field-height)] !border-0 !bg-transparent !shadow-none text-left focus:outline-none ${
              value ? "text-[var(--md-sys-color-field-text)]" : "text-transparent"
            }`}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className="min-w-0 truncate text-[16px] leading-6">
              {value || "\u00a0"}
            </span>
            <span
              className={`material-symbols-outlined text-[20px] font-light leading-none text-[var(--md-sys-color-on-surface-variant)] transition-transform ${
                open ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            >
              expand_more
            </span>
          </button>
        </div>
        <M3NotchedOutline label={fieldLabel} />
      </div>
      {open ? (
        <div className="m3-menu m3-menu-enter m3-menu--origin-top absolute z-50 mt-1 w-full !max-h-none overflow-hidden">
          <div className="border-b border-[var(--md-sys-color-outline-variant)] px-2 py-2">
            <TextField
              ref={inputRef}
              variant="filled"
              label={placeholder || "Search timezone, city, or region..."}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              trailingIcon={
                search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="grid h-10 w-10 place-items-center text-[var(--md-sys-color-on-surface-variant)]"
                    aria-label="Clear search"
                  >
                    <span className="material-symbols-outlined text-[16px] font-light" aria-hidden="true">
                      close
                    </span>
                  </button>
                ) : null
              }
            />
          </div>
          <div ref={listRef} className="max-h-56 overflow-y-auto" role="listbox">
            {filtered.length === 0 ? (
              <div className="m3-menu-item !cursor-default text-center text-[var(--md-sys-color-on-surface-variant)]">
                No timezones match &ldquo;{search}&rdquo;
              </div>
            ) : (
              filtered.map((option) => {
                const time = getCurrentTime(option);
                const isSelected = value === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`m3-menu-item ${isSelected ? "m3-menu-item--selected" : ""}`}
                  >
                    <span className="m3-menu-item__label min-w-0 truncate">{option}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                        {time}
                      </span>
                      {isSelected ? (
                        <span className="m3-menu-item__check material-symbols-outlined" aria-hidden="true">
                          check
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NumberField({
  value,
  onChange,
  min,
  max,
  suffix,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  suffix?: string;
  label?: string;
}) {
  return (
    <TextField
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(event) => onChange(Number(event.target.value) || 0)}
      label={label}
      trailingIcon={
        suffix ? (
          <span className="text-[13px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
            {suffix}
          </span>
        ) : null
      }
      className="[&_input]:[appearance:textfield] [&_input::-webkit-inner-spin-button]:appearance-none [&_input::-webkit-outer-spin-button]:appearance-none"
    />
  );
}

function ToggleRow({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-[14px] font-semibold text-zinc-950"
        >
          {title}
        </div>
        <div className="mt-0.5 text-[13px] font-medium text-zinc-700">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        aria-label={title}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
          enabled ? "bg-emerald-500" : "bg-zinc-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-1 ring-black/5 transition-transform duration-200 ${
            enabled ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsView({
  workspace,
  linkedInAccounts,
  user,
  saveAction,
  disconnectAction,
  localMode = false,
  notificationsEnabled = true,
}: SettingsViewProps) {
  const [tab, setTab] = useState<Tab>("Profile");
  const [pending, startTransition] = useTransition();
  const linkedInAccountsResource = useSidebarResource(
    "linkedinAccounts",
    linkedInAccounts,
    selectLinkedInAccounts,
  );
  const loadedLinkedInAccounts = linkedInAccountsResource.value;
  const linkedInAccountsLoading = linkedInAccountsResource.loading;

  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState(() => timezoneOption(workspace.timezone));
  const [dateFormat, setDateFormat] = useState("May 12, 2025 (MMM D, YYYY)");
  const [dailyInvites, setDailyInvites] = useState(workspace.settings.dailyInviteLimit);
  const [dailyMessages, setDailyMessages] = useState(workspace.settings.dailyMessageLimit);
  const [firstDelay, setFirstDelay] = useState(
    Math.max(1, Math.round(workspace.settings.firstMessageDelayMinutes / 60)),
  );
  const [aiFollowUp, setAiFollowUp] = useState(workspace.settings.aiFollowUpEnabled);
  const [notifEmail, setNotifEmail] = useState(workspace.notificationEmail || user.email);
  const plan = workspace.billing?.plan || "solo";
  const planName =
    plan === "startup" ? "Startup" : plan === "enterprise" ? "Enterprise" : "Basic";
  const planPrice = plan === "startup" ? "$59/month" : plan === "enterprise" ? "Custom" : "$29/month";
  const linkedInLimit = localMode || plan === "enterprise" ? "Unlimited" : plan === "startup" ? "3" : "1";
  const [notifFlags, setNotifFlags] = useState({ campaign: true, weekly: true, product: false });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("dailyInviteLimit", String(dailyInvites));
    formData.set("dailyMessageLimit", String(dailyMessages));
    formData.set("firstMessageDelayMinutes", String(firstDelay * 60));
    formData.set("aiFollowUpDelayMinutes", String(workspace.settings.aiFollowUpDelayMinutes));
    if (aiFollowUp) formData.set("aiFollowUpEnabled", "on");
    startTransition(() => saveAction(formData));
  }

  const billing = billingPill(workspace.billing?.status);
  const userInitials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 min-w-0 flex-col gap-3 md:ml-4 md:mr-0.5">
      {/* Mobile header save button - fixed in the top bar */}
      <button
        type="submit"
        disabled={pending}
        style={{ fontFamily: "var(--font-varta)" }}
        className="m3-mobile-header-action fixed right-2 z-[91] inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-[var(--md-sys-color-primary)] px-4 text-xs font-semibold text-[var(--md-sys-color-on-primary)] transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
      >
        <span className="translate-y-px">{pending ? "Saving..." : "Save settings"}</span>
      </button>

      {/* Header — primary action matches Leads "Add leads" */}
      <div className="app-x hidden shrink-0 items-center justify-between gap-3 pt-6 md:flex">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-3xl">
            Settings
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
          {pending ? "Saving..." : "Save settings"}
        </button>
      </div>

      {/* Tabs */}
      <div className="app-x shrink-0">
        <div className="flex items-center gap-6 overflow-x-auto border-b border-zinc-200 pt-4 md:pt-0">
          {TABS.filter((label) => workspace.id !== "local" || label !== "Subscription").map((label) => {
            const active = tab === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setTab(label)}
                className={`relative -mb-px cursor-pointer pb-2.5 text-[14px] font-semibold transition-colors ${
                  active ? "text-zinc-950" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {label}
                {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-950" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="app-x h-full overflow-y-auto">
          <div className="max-w-5xl pb-8 pt-1 sm:pb-10 sm:pt-2 md:pb-3">
            {tab === "Profile" && (
              <>
                {/* Profile section */}
                <SectionHeader
                  title="Profile"
                  description="Your personal information and workspace preferences."
                />

                <div className="m3-card m3-card-outlined flex min-w-0 items-center gap-4 p-4">
                  {user.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.imageUrl}
                      alt=""
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-[#ba3871] text-[16px] font-bold text-white">
                      {userInitials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-zinc-950">
                      {user.name}
                    </div>
                    <div className="truncate text-[13px] font-medium text-zinc-700">{user.email}</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-x-6 gap-y-6 md:grid-cols-2">
                  <SelectField
                    label="Language"
                    value={language}
                    onChange={setLanguage}
                    options={LANGUAGES}
                  />
                  <div>
                    <SearchableSelectField
                      label="Time zone"
                      value={timezone}
                      onChange={setTimezone}
                      options={TIMEZONES}
                      placeholder="Search timezone, city, or region..."
                    />
                  </div>
                  <SelectField
                    label="Date format"
                    value={dateFormat}
                    onChange={setDateFormat}
                    options={DATE_FORMATS}
                  />
                </div>

                <div className="my-8 h-px bg-zinc-200" />

                <SectionHeader
                  title="Appearance"
                  description="Material 3 light and dark surfaces. System follows your device preference."
                />
                <ThemePreferenceControl />

                <div className="my-8 h-px bg-zinc-200" />

                {/* Automation limits */}
                <SectionHeader
                  title="Automation limits"
                  description="Control how aggressively your agents and campaigns reach out."
                />

                <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
                  <NumberField
                    label="Daily connection invites"
                    value={dailyInvites}
                    onChange={setDailyInvites}
                    min={1}
                    max={100}
                    suffix="invites / day"
                  />
                  <NumberField
                    label="Daily messages"
                    value={dailyMessages}
                    onChange={setDailyMessages}
                    min={1}
                    max={200}
                    suffix="messages / day"
                  />
                  <NumberField
                    label="First message delay"
                    value={firstDelay}
                    onChange={setFirstDelay}
                    min={1}
                    max={168}
                    suffix="hours after connect"
                  />
                </div>

                <div className="mt-2">
                  <ToggleRow
                    title="AI follow-up"
                    description="Let AI write personalized follow-up messages when no reply has come in."
                    enabled={aiFollowUp}
                    onChange={setAiFollowUp}
                  />
                </div>

                {!localMode ? (
                  <>
                    <div className="my-8 h-px bg-zinc-200" />

                    {/* Notifications */}
                    <SectionHeader
                      title="Notifications"
                      description="Choose what to get emailed about and where."
                    />

                    {!notificationsEnabled ? (
                      <p className="mb-4 rounded-lg bg-[var(--md-sys-color-surface-container)] p-4 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                        Email notifications are disabled. Configure RESEND_API_KEY and RESEND_FROM_EMAIL, then restart Omentir to enable operational alerts.
                      </p>
                    ) : null}

                    <TextField
                      name="notificationEmail"
                      type="email"
                      label="Notification email"
                      value={notifEmail}
                      onChange={(event) => setNotifEmail(event.target.value)}
                      supportingText="We'll send important updates to this email."
                    />

                    <div className="mt-4 divide-y divide-zinc-100 rounded-md border border-zinc-200 bg-white px-4">
                      {(
                        [
                          ["campaign", "Campaign activity", "New replies, accepts, and important events"],
                          ["weekly", "Weekly performance summary", "Campaign and agent performance overview"],
                          ["product", "Product updates", "New features and product announcements"],
                        ] as const
                      ).map(([id, title, sub]) => (
                        <ToggleRow
                          key={id}
                          title={title}
                          description={sub}
                          enabled={notifFlags[id]}
                          onChange={(next) => setNotifFlags({ ...notifFlags, [id]: next })}
                        />
                      ))}
                    </div>

                    <div className="my-8 h-px bg-zinc-200" />

                    <SectionHeader
                      title="Account session"
                      description="Manage your signed-in session on this device."
                    />
                    <SignOutButton localMode={workspace.id === "local"} />
                  </>
                ) : null}
              </>
            )}

            {tab === "Connected Accounts" && (
              <>
                <SectionHeader
                  title="Connected accounts"
                  description={`You can connect ${linkedInLimit === "Unlimited" ? "unlimited" : linkedInLimit} LinkedIn account${linkedInLimit === "1" ? "" : "s"}.`}
                />

                {linkedInAccountsLoading ? (
                  <LinkedInAccountsSkeleton />
                ) : (
                <ContentReveal className="space-y-3">
                  {loadedLinkedInAccounts.length ? (
                    loadedLinkedInAccounts.map((account, index) => (
                      <div key={account.id} className="flex flex-col items-start gap-4 rounded-md border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#0a66c2]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={account.avatarUrl || "/linkedin-logo.png"}
                            alt={account.avatarUrl ? `${account.displayName} profile` : "LinkedIn"}
                            className={account.avatarUrl ? "h-full w-full object-cover" : "h-5 w-auto object-contain brightness-0 invert"}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[14px] font-semibold text-zinc-950">
                              {account.displayName || "LinkedIn account"}
                            </span>
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Connected
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-[13px] font-medium text-zinc-700">
                            LinkedIn account
                          </div>
                          <div className="text-[11px] font-medium text-zinc-600">
                            Connected on{" "}
                            {new Date(account.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                          {index === 0 ? (
                            <a
                              href="/reconnect"
                              className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                              </svg>
                              Reconnect
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              const formData = new FormData();
                              formData.set("linkedInAccountId", account.id);
                              startTransition(async () => {
                                await disconnectAction(formData);
                                linkedInAccountsResource.reload();
                              });
                            }}
                            disabled={pending}
                            className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-start gap-4 rounded-md border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#0a66c2]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/linkedin-logo.png" alt="LinkedIn" className="h-5 w-auto object-contain brightness-0 invert" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-semibold text-zinc-950">Not connected</div>
                        <div className="mt-0.5 truncate text-[13px] font-medium text-zinc-700">
                          Connect to send messages from your account
                        </div>
                      </div>
                    </div>
                  )}
                </ContentReveal>
                )}

                {linkedInAccountsLoading ? null : linkedInLimit === "Unlimited" ||
                  loadedLinkedInAccounts.length < Number(linkedInLimit) ? (
                  <a
                    href="/reconnect"
                    style={{ fontFamily: "var(--font-varta)" }}
                    className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-[#0a66c2] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#0855a3]"
                  >
                    Connect account
                  </a>
                ) : (
                  <p className="mt-3 text-[13px] font-medium text-zinc-700">
                    Your plan supports up to {linkedInLimit} connected account{linkedInLimit === "1" ? "" : "s"}.{" "}
                    <Link
                      href="/upgrade"
                      className="font-semibold text-zinc-950 underline underline-offset-2"
                    >
                      Upgrade
                    </Link>{" "}
                    to connect more.
                  </p>
                )}
              </>
            )}

            {tab === "Subscription" && (
              <>
                <SectionHeader
                  title="Current plan"
                  description="Manage your subscription, usage, and billing details."
                />

                <div className="rounded-md border border-zinc-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div
                        style={{ fontFamily: "var(--font-varta)" }}
                        className="text-[14px] font-semibold text-zinc-950"
                      >
                        {planName}
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-[32px] font-bold tracking-tight text-zinc-950">
                          {planPrice}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] font-medium text-zinc-700">
                        Renews on{" "}
                        {workspace.billing?.currentPeriodEnd
                          ? new Date(workspace.billing.currentPeriodEnd).toLocaleDateString(
                              "en-US",
                              { month: "long", day: "numeric", year: "numeric" },
                            )
                          : "Jun 2, 2025"}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${billing.cls}`}>
                      {billing.label}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                    <a
                      href="/billing/manage"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontFamily: "var(--font-varta)" }}
                      className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#ba3871] px-4 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(186,56,113,0.3)] transition hover:brightness-[0.98]"
                    >
                      <span className="leading-none">Manage plan</span>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </a>
                    <span className="text-[11px] font-medium text-zinc-700">Cancel or upgrade anytime</span>
                  </div>
                </div>

                <div className="my-8 h-px bg-zinc-200" />

                <SectionHeader title="Billing details" />

                <div className="divide-y divide-zinc-100 rounded-md border border-zinc-200 bg-white">
                  {(
                    [
                      [
                        "Billing email",
                        workspace.billing?.payerEmail || user.email,
                      ],
                      ["Status", billing.label],
                    ] as const
                  ).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex flex-col items-start justify-between gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <span
                        style={{ fontFamily: "var(--font-varta)" }}
                        className="text-[14px] font-semibold text-zinc-700"
                      >
                        {k}
                      </span>
                      {k === "Status" ? (
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${billing.cls}`}
                        >
                          {v}
                        </span>
                      ) : (
                        <span className="text-[14px] text-zinc-950">{v}</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
