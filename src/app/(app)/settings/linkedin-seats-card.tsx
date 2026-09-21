"use client";

import { useState } from "react";
import {
  extraLinkedInSeatMonthlyTotalUsd,
  extraLinkedInSeatRateDescription,
} from "@/lib/linkedin-seat-pricing";
import { TextField } from "@/app/ui/text-field";

export default function LinkedInSeatsCard({
  totalAccounts,
  subscribed,
}: {
  totalAccounts: number;
  subscribed: boolean;
}) {
  const [count, setCount] = useState(1);
  const selected = Number.isFinite(count) && count >= 1 ? Math.min(100, Math.floor(count)) : 1;
  const total = extraLinkedInSeatMonthlyTotalUsd(selected);
  const noun = selected === 1 ? "account" : "accounts";

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-5">
      <div className="text-[14px] font-semibold text-zinc-950">Extra LinkedIn accounts</div>
      <p className="mt-2 text-[13px] font-medium leading-5 text-zinc-700">
        Your plan includes {totalAccounts} LinkedIn account
        {totalAccounts === 1 ? "" : "s"}. {extraLinkedInSeatRateDescription()}
      </p>
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
            {selected} extra {noun}: ${total}/month.
          </p>
          <a
            href={`/checkout/seats?count=${selected}`}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-[#ba3871] px-4 text-[13px] font-semibold text-white transition hover:brightness-[0.98]"
          >
            Subscribe for ${total}/mo
          </a>
        </>
      ) : (
        <p className="mt-3 text-[13px] font-medium text-zinc-700">
          Subscribe first, then you can add extra LinkedIn accounts here.
        </p>
      )}
    </div>
  );
}
