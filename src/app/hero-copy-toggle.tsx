import type { ReactNode } from "react";
import AgentTypewriter from "./agent-typewriter";

export default function HeroCopyToggle({ children }: { children: ReactNode }) {
  return (
    <>
      <style>
        {`
          .hero-outreach-agentic-copy {
            display: none;
          }

          .hero-outreach-toggle:checked ~ .hero-outreach-normal-copy {
            display: none;
          }

          .hero-outreach-toggle:checked ~ .hero-outreach-agentic-copy {
            display: contents;
          }

          .hero-outreach-switch-row,
          .hero-outreach-mode-label {
            font-family: var(--font-google-sans), var(--font-roboto), "Helvetica Neue", Arial, sans-serif;
            font-weight: 500;
          }

          .hero-outreach-mode-label {
            align-items: center;
            color: var(--md-sys-color-text-disabled);
            display: inline-flex;
            height: 1.35rem;
            line-height: 1;
            transform: translateY(0.1rem);
            transition: color 200ms cubic-bezier(0.2, 0, 0, 1);
          }

          .hero-outreach-toggle:not(:checked) ~ .hero-outreach-switch-row .hero-outreach-normal-label,
          .hero-outreach-toggle:checked ~ .hero-outreach-switch-row .hero-outreach-agentic-label {
            color: var(--md-sys-color-on-surface);
          }

          .hero-outreach-track {
            background: var(--md-sys-color-outline-variant);
            height: 1.35rem;
            transition: background-color 200ms cubic-bezier(0.2, 0, 0, 1);
          }

          .hero-outreach-knob {
            height: 1.125rem;
            box-shadow:
              0 1px 3px 0 rgba(0, 0, 0, 0.1),
              0 1px 2px -1px rgba(0, 0, 0, 0.1);
            transform: translateX(0.125rem);
            transition: transform 200ms cubic-bezier(0.2, 0, 0, 1);
            width: 1.125rem;
          }

          .hero-outreach-toggle:focus-visible ~ .hero-outreach-switch-row .hero-outreach-track {
            outline: 2px solid var(--md-sys-color-on-surface);
            outline-offset: 3px;
          }

          .hero-outreach-toggle:checked ~ .hero-outreach-switch-row .hero-outreach-track {
            background: var(--md-sys-color-primary);
          }

          .hero-outreach-toggle:checked ~ .hero-outreach-switch-row .hero-outreach-knob {
            transform: translateX(1.5rem);
          }
        `}
      </style>
      <input
        id="hero-outreach-mode"
        type="checkbox"
        className="hero-outreach-toggle sr-only"
      />
      <div className="hero-outreach-normal-copy contents">
        <h1
          style={{ fontFamily: "var(--font-google-sans)" }}
          className="hero-enter w-full max-w-5xl text-[clamp(1.5rem,7vw,1.75rem)] leading-[1.15] font-bold tracking-tight text-[var(--md-sys-color-on-surface)] md:text-5xl md:leading-tight lg:text-6xl lg:leading-tight"
        >
          <span className="block whitespace-nowrap">
            Find your next{" "}
            <span className="text-gradient-brand">10 customers</span>
          </span>
          <span className="block whitespace-nowrap">while you sleep.</span>
        </h1>
        <p
          style={{ fontFamily: "var(--font-roboto)" }}
          className="hero-enter hero-enter-delay-1 mt-4 max-w-2xl text-[0.9375rem] leading-6 text-[var(--md-sys-color-on-surface-variant)] md:mt-6 md:text-base md:leading-8 lg:text-lg"
        >
          Omentir finds you high-intent leads on LinkedIn, contacts them on{" "}
          <span className="text-gradient-brand">automation</span>, and books
          you revenue.
        </p>
      </div>
      <div className="hero-outreach-agentic-copy">
        <h1
          style={{ fontFamily: "var(--font-google-sans)" }}
          className="hero-enter w-full max-w-5xl text-[clamp(1.5rem,7vw,1.75rem)] leading-[1.15] font-bold tracking-tight text-[var(--md-sys-color-on-surface)] md:text-5xl md:leading-tight lg:text-6xl lg:leading-tight"
        >
          <span className="block whitespace-nowrap">Find your next customers</span>
          <span className="block whitespace-nowrap">
            with{" "}
            <AgentTypewriter
              agents={["OpenClaw", "Cursor", "ChatGPT", "Hermes Agent", "Gemini"]}
            />
          </span>
        </h1>
        <p
          style={{ fontFamily: "var(--font-roboto)" }}
          className="hero-enter hero-enter-delay-1 mt-4 max-w-2xl text-[0.9375rem] leading-6 text-[var(--md-sys-color-on-surface-variant)] md:mt-6 md:text-base md:leading-8 lg:text-lg"
        >
          Ask your Claude, ChatGPT, OpenClaw, Hermes, Cursor, or any agent to
          contact high-intent leads for your product.
        </p>
      </div>
      {children}
      <label
        htmlFor="hero-outreach-mode"
        className="hero-outreach-switch-row hero-enter hero-enter-delay-2 mt-10 inline-flex w-full max-w-sm cursor-pointer items-center justify-center gap-1.5 px-1 md:mt-12 md:w-fit md:gap-2 md:px-0"
      >
        <span className="hero-outreach-mode-label hero-outreach-normal-label text-xs font-semibold">
          Normal outreach
        </span>
        <span
          aria-hidden="true"
          className="hero-outreach-track relative inline-flex w-11 shrink-0 items-center rounded-full"
        >
          <span className="hero-outreach-knob inline-block rounded-full bg-white transition-transform duration-200" />
        </span>
        <span className="hero-outreach-mode-label hero-outreach-agentic-label text-xs font-semibold">
          Agentic outreach
        </span>
      </label>
    </>
  );
}
