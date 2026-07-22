"use client";

// Progress indicator shown at the top of the consolidated onboarding flow. The
// current step is computed
// server-side from workspace state, so steps cannot be skipped by clicking
// ahead. Client component only so advancing a step can animate: the connector
// line fills gray → pink left-to-right, then the next bubble colors in.
import { useEffect, useState } from "react";

const PRODUCT_STEPS = [
  "Your Product",
  "Example Leads",
  "Personalisation",
  "Select Plan",
  "Setup LinkedIn",
] as const;

const SELF_HOSTED_STEPS = ["Your Product", "Example Leads", "Setup LinkedIn"] as const;

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function OnboardingProgress({
  current,
  selfHosted = false,
}: {
  current: number;
  selfHosted?: boolean;
}) {
  // Visuals render from `displayStep`, which lags `current` by a frame when
  // the user advances so the connector width and bubble colors transition
  // from the previous state instead of snapping. Advancing a step is a soft
  // navigation (server action redirect back to /onboarding), so this instance
  // survives with its old state; hard loads render `current` statically.
  const visibleCurrent = selfHosted ? (current >= 5 ? 3 : current >= 2 ? 2 : 1) : current;
  const [displayStep, setDisplayStep] = useState(visibleCurrent);
  const steps: readonly string[] = selfHosted ? SELF_HOSTED_STEPS : PRODUCT_STEPS;

  useEffect(() => {
    if (displayStep === visibleCurrent) return;
    // Double rAF: let the browser paint the previous state first so the
    // change is transitioned rather than applied instantly.
    let nextRaf = 0;
    const firstRaf = requestAnimationFrame(() => {
      nextRaf = requestAnimationFrame(() => setDisplayStep(visibleCurrent));
    });
    return () => {
      cancelAnimationFrame(firstRaf);
      cancelAnimationFrame(nextRaf);
    };
  }, [visibleCurrent, displayStep]);

  return (
    <ol className="flex w-full items-start">
      {steps.map((label, index) => {
        const step = index + 1;
        const done = step < displayStep;
        const active = step === displayStep;
        const filled = done || active;
        const isLast = index === steps.length - 1;

        return (
          <li
            key={label}
            className={`flex items-start ${isLast ? "" : "flex-1"}`}
          >
            <div className="flex w-9 shrink-0 flex-col items-center gap-1.5 sm:w-12 sm:gap-2 lg:w-14">
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-[13px] font-semibold transition-colors duration-300 delay-500 sm:h-10 sm:w-10 sm:text-base lg:h-12 lg:w-12 lg:text-lg ${
                  filled
                    ? "bg-[#ba3871] text-white"
                    : "border border-zinc-300 bg-white text-zinc-400"
                }`}
              >
                {done ? <CheckIcon /> : step}
              </span>
              <span
                style={{ fontFamily: "var(--font-varta)" }}
                className={`w-16 text-center text-[10px] leading-tight transition-colors duration-300 delay-500 sm:w-24 sm:text-sm lg:w-28 lg:text-base ${
                  active
                    ? "font-semibold text-zinc-900"
                    : filled
                      ? "font-medium text-zinc-600"
                      : "text-zinc-400"
                }`}
              >
                {label}
              </span>
            </div>
            {isLast ? null : (
              <span
                className="relative mt-4 h-0.5 flex-1 overflow-hidden rounded-full bg-zinc-200 sm:mt-5 sm:h-[3px] lg:mt-6"
              >
                <span
                  className={`absolute inset-y-0 left-0 rounded-full bg-[#ba3871] transition-[width] duration-700 ease-out ${
                    done ? "w-full" : "w-0"
                  }`}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
