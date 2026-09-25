"use client";

import {
  ACCEPTANCE_GRACE_DAYS,
  ACCEPTANCE_WINDOW_DAYS,
  INVITE_WITHDRAW_AFTER_DAYS_OPTIONS,
  MAX_DAILY_INVITE_WITHDRAWALS,
  PENDING_INVITES_WARN,
  acceptanceRate,
  acceptanceRateLevel,
  pendingInvitesLevel,
  type HealthLevel,
  type LinkedInAccountHealth,
} from "@/lib/linkedin-health";

const LEVEL_TEXT: Record<HealthLevel, string> = {
  ok: "text-zinc-950",
  warn: "text-amber-700",
  danger: "text-red-700",
};

function Metric({
  label,
  value,
  caption,
  level = "ok",
}: {
  label: string;
  value: string;
  caption: string;
  level?: HealthLevel;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-600">{label}</p>
      <p className={`mt-1 text-2xl font-semibold leading-none ${LEVEL_TEXT[level]}`}>{value}</p>
      <p className="mt-1.5 text-[11px] font-medium leading-snug text-zinc-700">{caption}</p>
    </div>
  );
}

export default function LinkedInHealthCard({
  health,
  accountName,
}: {
  health: LinkedInAccountHealth;
  accountName?: string;
}) {
  const pendingUnknown = !health.pendingComplete && health.pendingInvites === 0;
  const pendingLevel = pendingUnknown ? "ok" : pendingInvitesLevel(health.pendingInvites);
  const rate = acceptanceRate(health.invitesSentInWindow, health.acceptedInWindow);
  const rateLevel = acceptanceRateLevel(rate);
  const worst: HealthLevel =
    pendingLevel === "danger" || rateLevel === "danger"
      ? "danger"
      : pendingLevel === "warn" || rateLevel === "warn"
        ? "warn"
        : "ok";

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      {accountName ? (
        <p className="mb-3 text-[13px] font-semibold text-zinc-950">{accountName}</p>
      ) : null}

      {worst !== "ok" ? (
        <p
          className={`mb-4 rounded-md px-3 py-2 text-[13px] font-medium leading-snug ${
            worst === "danger" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"
          }`}
        >
          {worst === "danger"
            ? "LinkedIn may restrict invites on this account soon."
            : "This account is getting close to where LinkedIn restricts invites."}{" "}
          {pendingLevel !== "ok"
            ? health.withdrawAfterDays
              ? `Old invites are being withdrawn automatically, up to ${MAX_DAILY_INVITE_WITHDRAWALS} a day.`
              : "Withdraw old invites below, or on LinkedIn under My Network, Manage, Sent."
            : "Fewer, better-targeted invites will raise the acceptance rate."}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-3">
        <Metric
          label="Pending invites"
          value={
            pendingUnknown
              ? "N/A"
              : `${health.pendingInvites}${health.pendingComplete ? "" : "+"}`
          }
          level={pendingLevel}
          caption={
            pendingUnknown
              ? "LinkedIn did not return the list. Try again later."
              : `Keep this under ${PENDING_INVITES_WARN}.`
          }
        />
        <Metric
          label="Acceptance rate"
          value={rate === null ? "N/A" : `${Math.round(rate * 100)}%`}
          level={rateLevel}
          caption={
            rate === null
              ? "Not enough invites yet to measure."
              : `${health.acceptedInWindow} of ${health.invitesSentInWindow} invites sent in the ${ACCEPTANCE_WINDOW_DAYS} days before this week. Aim for 30% or more.`
          }
        />
        <Metric
          label="Profile views today"
          value={`${health.profileViewsToday} / ${health.profileViewLimit}`}
          caption={`Omentir stops at ${health.profileViewLimit} a day. Heavy profile viewing is one of the things LinkedIn flags.`}
        />
      </div>
      {rate !== null ? (
        <p className="mt-3 text-[11px] font-medium text-zinc-600">
          Invites from the last {ACCEPTANCE_GRACE_DAYS} days are left out because people have not had time to answer.
        </p>
      ) : null}
    </div>
  );
}

export const INVITE_WITHDRAW_SELECT_OPTIONS = [
  { value: "0", label: "Off" },
  ...INVITE_WITHDRAW_AFTER_DAYS_OPTIONS.map((days) => ({
    value: String(days),
    label: `After ${days / 7} weeks`,
  })),
];

export const INVITE_WITHDRAW_HELP = `On by default at 4 weeks. Omentir withdraws up to ${MAX_DAILY_INVITE_WITHDRAWALS} a day, oldest first. LinkedIn will not let you invite a withdrawn person again for about 3 weeks.`;
