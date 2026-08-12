"use client";

import Link from "next/link";
import Form from "next/form";
import { TextField } from "./ui/text-field";

export default function HeroCtaControls({ isSignedIn }: { isSignedIn: boolean }) {
  const heroButtonSizeClass = "box-border h-11 min-h-11 md:h-14 md:min-h-14";

  if (isSignedIn) {
    return (
      <div className="mt-12 flex justify-center">
        <Link href="/dashboard" className="m3-btn m3-btn-filled h-9 px-5 text-sm">
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="hero-enter hero-enter-delay-2 w-full">
        <Form
          id="hero-website-form"
          action="/signup"
          aria-label="Get started with your website"
          className="mx-auto mt-[1.2rem] flex w-full max-w-64 flex-col items-center justify-center gap-3 md:mt-6 md:max-w-none md:flex-row md:items-end md:gap-[0.9rem]"
        >
          <TextField
            id="website-url"
            name="website"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            label="Website link"
            placeholder="https://yourcompany.com"
            required
            variant="outlined"
            className="m3-text-field--hero w-full max-w-64 md:max-w-72"
          />
          <button
            type="submit"
            className={`m3-btn m3-btn-filled-secondary m3-btn--hero ${heroButtonSizeClass} w-full shrink-0 whitespace-nowrap appearance-none md:w-auto`}
          >
            Get started
          </button>
        </Form>
      </div>
      <p
        style={{ fontFamily: "var(--font-roboto)" }}
        className="mx-auto mt-[1.2rem] flex max-w-xs flex-col items-center gap-[0.15rem] px-4 text-[0.75rem] leading-5 font-normal text-zinc-600 md:max-w-none md:flex-row md:justify-center md:gap-[0.45rem] md:px-0 md:text-sm"
      >
        <span>Agent Ready.</span>
        <span>Costs less than $2/day.</span>
        <span>Used by 50+ startups.</span>
      </p>
    </>
  );
}
