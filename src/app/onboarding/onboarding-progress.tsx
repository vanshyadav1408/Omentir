"use client";

// Progress indicator shown at the top of the consolidated onboarding flow. The
// current step is computed
// server-side from workspace state, so steps cannot be skipped by clicking
// ahead. Client component only so advancing a step can animate: the connector
// line fills left-to-right, then the next bubble colors in.
import { useEffect, useState } from "react";

const PRODUCT_STEPS = [
  "Your Product",
  "Example Leads",
  "Personalisation",
  "Select Plan",
] as const;

const SELF_HOSTED_STEPS = ["Your Product", "Example Leads"] as const;

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
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
  const visibleCurrent = selfHosted ? (current >= 2 ? 2 : 1) : current;
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
        const incomingFilled = index > 0 && step <= displayStep;

        return (
          <li
            key={label}
            className={`relative flex min-w-0 flex-1 flex-col items-center gap-1.5 transition-opacity duration-300 sm:gap-2 ${
              active ? "opacity-100" : "opacity-45"
            }`}
          >
            {index > 0 ? (
              <span className="pointer-events-none absolute right-1/2 top-3.5 h-px w-full overflow-hidden bg-[#222] sm:top-4">
                <span
                  className={`absolute inset-y-0 left-0 bg-white transition-[width] duration-700 ease-out ${
                    incomingFilled ? "w-full" : "w-0"
                  }`}
                />
              </span>
            ) : null}
            <span
              className={`auth-progress-dot relative z-10 h-7 w-7 sm:h-8 sm:w-8 ${
                filled ? "is-filled" : "is-idle"
              }`}
            >
              {done ? <CheckIcon /> : step}
            </span>
            <span
              className={`w-full px-0.5 text-center text-[10px] leading-tight sm:text-xs ${
                active ? "font-medium text-white" : "text-[#737373]"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
