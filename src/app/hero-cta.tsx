import Link from "next/link";
import Form from "next/form";
import { authOrSignedOut } from "@/lib/server/clerk-session";
import { TextField } from "./ui/text-field";

export default async function HeroCta() {
  const { userId } = await authOrSignedOut();

  if (userId) {
    return (
      <div className="mt-10 flex justify-center">
        <Link
          href="/dashboard"
          className="m3-btn m3-btn-filled h-9 px-5 text-sm"
        >
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <Form
          action="/signup"
          className="mx-auto mt-8 flex w-full max-w-64 flex-col items-center justify-center gap-2.5 md:mt-10 md:max-w-none md:flex-row md:items-end md:gap-3"
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
            /* --hero: 46px on phones, 56px from md up (see globals.css). */
            className="m3-text-field--hero w-full max-w-64 md:max-w-72"
          />
          <button
            type="submit"
            className="m3-btn m3-btn-filled-secondary m3-btn--hero w-full shrink-0 whitespace-nowrap md:w-auto"
          >
            Get started
          </button>
        </Form>
      </div>
      {/* One proof point per row on phones, where the sentence otherwise wrapped
          mid-claim; a single centred line from md up. */}
      <p
        style={{ fontFamily: "var(--font-roboto)" }}
        className="mx-auto mt-4 flex max-w-xs flex-col items-center gap-0.5 px-4 text-[0.75rem] leading-5 font-normal text-zinc-600 md:max-w-none md:flex-row md:justify-center md:gap-1.5 md:px-0 md:text-sm"
      >
        <span>Agent Ready.</span>
        <span>Costs less than $1/day.</span>
        <span>Used by 50+ startups.</span>
      </p>
    </>
  );
}
