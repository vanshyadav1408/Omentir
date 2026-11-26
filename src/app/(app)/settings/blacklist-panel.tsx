"use client";

import { useEffect, useState, useTransition } from "react";
import { unwrapAction } from "@/lib/action-result";
import { userFacingError, useToast } from "@/app/toast";
import {
  addToBlacklistAction,
  blockCountryAction,
  listBlacklistAction,
  removeFromBlacklistAction,
} from "@/app/actions";

type Entry = { id: string; kind: "profile" | "company" | "country"; value: string; createdAt: string };

// Lives inside the Settings <form>: every control is type="button" and the
// textarea and select have no name, so saving settings never submits them.
export default function BlacklistPanel() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const { showError } = useToast();

  useEffect(() => {
    let cancelled = false;
    listBlacklistAction()
      .then((result) => {
        if (cancelled) return;
        const loaded = unwrapAction(result);
        setEntries(loaded.entries);
        setCountryOptions(loaded.countryOptions);
      })
      .catch((error) => {
        if (!cancelled) {
          setEntries([]);
          showError(userFacingError(error, "Could not load your restrictions."));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showError]);

  const reload = async () => setEntries(unwrapAction(await listBlacklistAction()).entries);

  const remove = (entry: Entry) =>
    startTransition(async () => {
      try {
        unwrapAction(await removeFromBlacklistAction(entry.id));
        setEntries((current) => (current || []).filter((item) => item.id !== entry.id));
      } catch (error) {
        showError(userFacingError(error, "Could not remove that entry."));
      }
    });

  const countries = (entries || [])
    .filter((entry) => entry.kind === "country")
    .sort((a, b) => a.value.localeCompare(b.value));
  const blockedCountryNames = new Set(countries.map((entry) => entry.value));
  const people = (entries || []).filter((entry) => entry.kind !== "country");
  const shown = people.filter((entry) =>
    entry.value.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-2 rounded-md border border-zinc-200 bg-white p-4">
        <label className="text-[14px] font-semibold text-zinc-900" htmlFor="blocked-country-select">
          Blocked countries
        </label>
        <p className="text-[13px] leading-5 text-zinc-600">
          Agents skip people whose LinkedIn location is in a country you block, and any outreach already running to them stops before the next invite or message. People with no location on their profile are not blocked.
        </p>
        <div className="relative w-full max-w-xs">
          <select
            id="blocked-country-select"
            value=""
            disabled={pending || entries === null}
            onChange={(event) => {
              const country = event.target.value;
              if (!country) return;
              startTransition(async () => {
                try {
                  unwrapAction(await blockCountryAction(country));
                  await reload();
                } catch (error) {
                  showError(userFacingError(error, "Could not block that country."));
                }
              });
            }}
            className="h-9 w-full cursor-pointer appearance-none rounded-md border border-zinc-300 bg-white pl-4 pr-10 text-[14px] text-zinc-900 outline-none focus:border-[#ba3871] disabled:opacity-50"
          >
            <option value="">Choose a country to block</option>
            {countryOptions
              .filter((country) => !blockedCountryNames.has(country))
              .map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
          </select>
          <span
            className="material-symbols-outlined pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[18px] leading-none text-zinc-600"
            aria-hidden="true"
          >
            expand_more
          </span>
        </div>
        {countries.length ? (
          <ul className="flex flex-wrap gap-2 pt-1">
            {countries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-2 rounded-full bg-zinc-100 py-1 pl-3 pr-2 text-[13px] font-medium text-zinc-900"
              >
                {entry.value}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(entry)}
                  aria-label={`Unblock ${entry.value}`}
                  className="text-[12px] font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : entries ? (
          <p className="text-[13px] text-zinc-600">No countries are blocked.</p>
        ) : null}
      </div>

      <div className="grid gap-2 rounded-md border border-zinc-200 bg-white p-4">
        <label className="text-[14px] font-semibold text-zinc-900" htmlFor="blacklist-input">
          Block people or companies
        </label>
        <p className="text-[13px] leading-5 text-zinc-600">
          One per line. A LinkedIn profile link blocks that person. A company name or LinkedIn company link blocks everyone whose current company matches. Blocked people are skipped by every agent, and any outreach already running to them stops before the next invite or message.
        </p>
        <textarea
          id="blacklist-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          placeholder={"https://www.linkedin.com/in/jane-doe\nAcme Inc\nhttps://www.linkedin.com/company/globex"}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-[14px] text-zinc-900 outline-none focus:border-[#ba3871]"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending || !text.trim()}
            onClick={() =>
              startTransition(async () => {
                try {
                  const result = unwrapAction(await addToBlacklistAction(text));
                  setText("");
                  setNotice(
                    result.added === result.parsed
                      ? `Blocked ${result.added}.`
                      : `Blocked ${result.added}. ${result.parsed - result.added} were already blocked.`,
                  );
                  await reload();
                } catch (error) {
                  showError(userFacingError(error, "Could not update your restrictions."));
                }
              })
            }
            className="h-9 rounded-md bg-[#ba3871] px-4 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            Block
          </button>
          {notice ? <span className="text-[13px] font-medium text-emerald-700">{notice}</span> : null}
        </div>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-3">
          <span className="text-[14px] font-semibold text-zinc-900">
            {entries === null ? "Loading..." : `${people.length} people and companies blocked`}
          </span>
          {people.length > 8 ? (
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Search"
              className="h-8 w-48 rounded-md border border-zinc-300 px-2 text-[13px] outline-none focus:border-[#ba3871]"
            />
          ) : null}
        </div>
        {entries && people.length === 0 ? (
          <p className="p-4 text-[13px] text-zinc-600">Nobody is blocked yet.</p>
        ) : (
          <ul className="max-h-[420px] divide-y divide-zinc-100 overflow-y-auto">
            {shown.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <span className="mr-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                    {entry.kind === "profile" ? "Person" : "Company"}
                  </span>
                  {entry.kind === "profile" ? (
                    <a
                      href={entry.value}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-[13px] text-zinc-900 underline-offset-2 hover:underline"
                    >
                      {entry.value.replace("https://www.linkedin.com/in/", "")}
                    </a>
                  ) : (
                    <span className="text-[13px] text-zinc-900">{entry.value}</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(entry)}
                  className="shrink-0 text-[12px] font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
