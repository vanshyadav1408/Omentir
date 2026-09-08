"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NewAgentButton from "@/app/(app)/agents/new-agent-button";
import { useToast, userFacingError } from "@/app/toast";
import { TextField } from "@/app/ui/text-field";
import {
  INVALID_SCHEDULING_LINK_MESSAGE,
  hasUsableBookingLink,
} from "@/lib/scheduling-link";

type SaveBookingLinkResult = { ok: true } | { ok: false; error: string };

export type OverviewSetupProps = {
  hasSubscription: boolean;
  linkedInConnected: boolean;
  linkedInError?: boolean;
  hasBookingLink: boolean;
  schedulingLink: string;
  saveBookingLink: (formData: FormData) => Promise<SaveBookingLinkResult | void>;
  needsLinkedInReconnect?: boolean;
  hasAgent: boolean;
};

function StatusMark({ done, step }: { done: boolean; step: number }) {
  return (
    <span
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-medium ${
        done
          ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
          : "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]"
      }`}
      aria-hidden
    >
      {done ? (
        <span className="material-symbols-outlined text-[18px] leading-none">check</span>
      ) : (
        step
      )}
    </span>
  );
}

function TaskRow({
  step,
  done,
  title,
  body,
  action,
}: {
  step: number;
  done: boolean;
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        <StatusMark done={done} step={step} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">{title}</p>
          <p className="mt-0.5 text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)]">
            {body}
          </p>
        </div>
      </div>
      <div className="w-full shrink-0 sm:w-40 sm:self-center">{action}</div>
    </li>
  );
}

const TASK_CTA =
  "m3-btn m3-btn-filled box-border h-8 min-h-8 !min-h-8 w-full cursor-pointer justify-center px-2.5 text-xs";

function TaskDone() {
  return (
    <span className="box-border flex h-8 min-h-8 w-full items-center justify-center rounded-[var(--md-sys-shape-corner-small)] border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-700">
      Done
    </span>
  );
}

function BookingLinkForm({
  initialValue,
  saveBookingLink,
}: {
  initialValue: string;
  saveBookingLink: OverviewSetupProps["saveBookingLink"];
}) {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasUsableBookingLink(value)) {
      setError(INVALID_SCHEDULING_LINK_MESSAGE);
      return;
    }
    const formData = new FormData();
    formData.set("schedulingLink", value);
    startTransition(async () => {
      try {
        const result = await saveBookingLink(formData);
        if (result && typeof result === "object" && result.ok === false) {
          setError(result.error);
          return;
        }
        showSuccess("Saved.");
        router.refresh();
      } catch (saveError) {
        setError(userFacingError(saveError, "Could not save. Try again."));
      }
    });
  }

  return (
    <form
      onSubmit={handleSave}
      className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start"
    >
      <div className="min-w-0 flex-1">
        <TextField
          name="schedulingLink"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
          placeholder="https://your-scheduler.com/meet"
          aria-label="Booking link"
          error={error || undefined}
          autoComplete="url"
          inputMode="url"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className={`${TASK_CTA} sm:mt-1 sm:w-28`}
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

export default function OverviewSetup({
  hasSubscription,
  linkedInConnected,
  linkedInError = false,
  hasBookingLink,
  schedulingLink,
  saveBookingLink,
  needsLinkedInReconnect = false,
  hasAgent,
}: OverviewSetupProps) {
  const doneCount =
    Number(hasSubscription) +
    Number(linkedInConnected) +
    Number(hasBookingLink) +
    Number(hasAgent);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="app-x min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-6">
        <div className="mx-auto w-full max-w-xl pt-10 sm:pt-16">
          <h1 className="text-2xl font-medium tracking-tight text-[var(--md-sys-color-on-surface)]">
            Get set up
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
            Four things Omentir needs before it can find buyers and send
            outreach. The dashboard shows up after these are done.
          </p>
          <p className="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {doneCount} of 4 done
          </p>

          <ol className="m3-card m3-card-outlined mt-8 divide-y divide-[var(--md-sys-color-outline-variant)]">
            <TaskRow
              step={1}
              done={hasSubscription}
              title="Active Omentir subscription"
              body="Omentir needs an active plan to find buyers and send messages."
              action={
                hasSubscription ? (
                  <TaskDone />
                ) : (
                  <Link href="/upgrade" className={TASK_CTA}>
                    View plans
                  </Link>
                )
              }
            />
            <TaskRow
              step={2}
              done={linkedInConnected}
              title="Connect LinkedIn"
              body={
                linkedInError && !linkedInConnected
                  ? "LinkedIn didn't connect. Try again."
                  : needsLinkedInReconnect
                    ? "LinkedIn got disconnected. Connect it again so Omentir can find people and send messages."
                    : "Link the account Omentir should use to find people and send messages."
              }
              action={
                linkedInConnected ? (
                  <TaskDone />
                ) : (
                  <Link href="/api/connect/linkedin" className={TASK_CTA}>
                    {needsLinkedInReconnect ? "Reconnect LinkedIn" : "Connect LinkedIn"}
                  </Link>
                )
              }
            />
            {hasBookingLink ? (
              <TaskRow
                step={3}
                done
                title="Add a booking link"
                body="Paste any meeting scheduler URL. Agents that book demos use this link."
                action={<TaskDone />}
              />
            ) : (
              <li className="flex flex-col gap-1 px-4 py-5 sm:px-5">
                <div className="flex min-w-0 items-start gap-3">
                  <StatusMark done={false} step={3} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                      Add a booking link
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)]">
                      Paste any meeting scheduler URL. Agents that book demos
                      use this link.
                    </p>
                    <BookingLinkForm
                      initialValue={schedulingLink}
                      saveBookingLink={saveBookingLink}
                    />
                  </div>
                </div>
              </li>
            )}
            <TaskRow
              step={4}
              done={hasAgent}
              title="Start an AI agent"
              body="Create an agent that finds matching buyers and can run outreach from your LinkedIn."
              action={
                hasAgent ? (
                  <TaskDone />
                ) : (
                  <NewAgentButton className={TASK_CTA}>
                    Create an agent
                  </NewAgentButton>
                )
              }
            />
          </ol>
        </div>
      </div>
    </div>
  );
}
