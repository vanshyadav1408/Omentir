"use client";

import { useState } from "react";
import { extraLinkedInSeatMonthlyTotalUsd, extraLinkedInSeatUnitPriceUsd } from "@/lib/linkedin-seat-pricing";
import { WHOP_MEMBERSHIPS_URL } from "@/lib/whop-billing-url";
import { TextField } from "@/app/ui/text-field";

export default function LinkedInSeatsCard({
  extraSeats,
  includedAccounts,
  subscribed,
}: {
  extraSeats: number;
  includedAccounts: number;
  subscribed: boolean;
}) {
  const [count, setCount] = useState(extraSeats > 0 ? extraSeats : 1);
  const selected = Number.isFinite(count) && count >= 1 ? Math.min(100, Math.floor(count)) : 1;
  const unit = extraLinkedInSeatUnitPriceUsd(selected);
  const total = extraLinkedInSeatMonthlyTotalUsd(selected);
  const unchanged = selected === extraSeats;
  const noun = selected === 1 ? "account" : "accounts";

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-5">
      <div className="text-[14px] font-semibold text-zinc-950">Extra LinkedIn accounts</div>
      <p className="mt-2 text-[13px] font-medium leading-5 text-zinc-700">
        Your plan includes {includedAccounts} LinkedIn account
        {includedAccounts === 1 ? "" : "s"}. Extra accounts are $20/month each for 1
        to 10, and $10/month each if you add more than 10.
      </p>
      {extraSeats > 0 ? (
        <p className="mt-2 text-[13px] font-medium text-zinc-700">
          You currently pay for {extraSeats} extra {extraSeats === 1 ? "account" : "accounts"}.
        </p>
      ) : null}
      {subscribed ? (
        <>
          <div className="mt-4 max-w-xs">
            <TextField
              type="number"
              min={1}
              max={100}
              label="Extra accounts"
              value={selected}
              onChange={(event) => setCount(Number(event.target.value) || 1)}
            />
          </div>
          <p className="mt-2 text-[13px] font-medium text-zinc-700">
            {selected} extra {noun} at ${unit}/month each. ${total}/month total.
          </p>
          {unchanged ? (
            <p className="mt-3 text-[13px] font-medium text-zinc-600">
              That is your current extra-account count.
            </p>
          ) : (
            <a
              href={`/checkout/seats?count=${selected}`}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-[#ba3871] px-4 text-[13px] font-semibold text-white transition hover:brightness-[0.98]"
            >
              Subscribe for ${total}/mo
            </a>
          )}
          {extraSeats > 0 ? (
            <p className="mt-3 text-[12px] font-medium text-zinc-600">
              To drop back to the included account, cancel the extra-seats membership in{" "}
              <a
                href={WHOP_MEMBERSHIPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-zinc-950 underline underline-offset-2"
              >
                Manage plan
              </a>
              .
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-[13px] font-medium text-zinc-700">
          Subscribe first, then you can add extra LinkedIn accounts here.
        </p>
      )}
    </div>
  );
}
