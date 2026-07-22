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
          className="mx-auto mt-8 flex w-full max-w-72 flex-col items-center justify-center gap-3 md:mt-10 md:max-w-none md:flex-row md:items-end"
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
            className="w-full max-w-72"
          />
          <button
            type="submit"
            className="m3-btn m3-btn-filled-secondary h-12 w-full shrink-0 whitespace-nowrap px-6 text-base md:h-14 md:w-auto"
          >
            Get started
          </button>
        </Form>
      </div>
      <p
        style={{ fontFamily: "var(--font-roboto)" }}
        className="mx-auto mt-4 max-w-xs px-4 text-[0.8125rem] leading-5 font-normal text-zinc-600 md:max-w-none md:px-0 md:text-sm"
      >
        Agent Ready. Costs less than $1/day. Used by 50+ startups.
      </p>
    </>
  );
}
