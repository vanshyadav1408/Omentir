"use client";

import { useEffect, useState } from "react";
import AgentSetup from "@/app/(app)/agents/new/agent-setup";

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

type SetupClientProps = {
  createAgent: (formData: FormData) => void | Promise<void>;
  prepareAgent: (formData: FormData) => Promise<PreparedAgent>;
  draftSetup: () => Promise<AgentSetupDraft>;
  getProfile: () => Promise<CompanyProfile | null>;
  saveProductProfile: (formData: FormData) => void | Promise<void>;
  linkedInAccounts: { id: string; displayName: string; accountId: string }[];
};

export default function SetupClient({
  createAgent,
  prepareAgent,
  draftSetup,
  getProfile,
  saveProductProfile,
  linkedInAccounts,
}: SetupClientProps) {
  const [started, setStarted] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    if (!started) return;

    let ignore = false;
    getProfile()
      .then((nextProfile) => {
        if (!ignore) setProfile(nextProfile);
      })
      .catch(() => {
        if (!ignore) setProfile(null);
      });

    return () => {
      ignore = true;
    };
  }, [getProfile, started]);

  if (started) {
    return (
      <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
        <AgentSetup
          key="setup"
          createAgent={createAgent}
          prepareAgent={prepareAgent}
          draftSetup={draftSetup}
          saveProductProfile={saveProductProfile}
          profile={profile}
          linkedInAccounts={linkedInAccounts}
          setupMode
        />
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--md-sys-color-surface)] px-5 py-10 text-[var(--md-sys-color-on-surface)]">
      <section className="w-full max-w-xl text-center">
        <h1
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          Welcome to Omentir
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base font-medium leading-7 text-zinc-600">
          Let&apos;s help you setup your first AI Agent.
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          style={{ fontFamily: "var(--font-varta)" }}
          className="mt-8 inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-[#ba3871] px-7 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(186,56,113,0.28)] transition hover:brightness-[0.98]"
        >
          Get started
        </button>
      </section>
    </main>
  );
}
