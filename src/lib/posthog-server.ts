type CaptureInput = {
  event: string;
  distinctId: string;
  properties?: Record<string, unknown>;
  insertId?: string;
  timeoutMs?: number;
};

export async function capturePostHogEvent(input: CaptureInput): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;

  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "") || "https://us.i.posthog.com";

  try {
    await fetch(`${host}/i/v0/e/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event: input.event,
        distinct_id: input.distinctId,
        properties: {
          $lib: "omentir-server",
          ...(input.insertId ? { $insert_id: input.insertId } : {}),
          ...input.properties,
        },
      }),
      signal: AbortSignal.timeout(input.timeoutMs ?? 2500),
    });
  } catch {
    // Analytics must never delay signup, checkout, or webhooks.
  }
}

export function revenueFromWhopPayment(payment: unknown, plan: string | null): number | undefined {
  if (payment && typeof payment === "object") {
    const record = payment as Record<string, unknown>;
    for (const key of ["usd_total", "final_amount", "amount", "subtotal", "total"]) {
      const raw = record[key];
      const amount = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
      if (!Number.isFinite(amount) || amount <= 0) continue;
      return Number.isInteger(amount) && amount >= 100 ? amount / 100 : amount;
    }
  }
  if (plan === "solo") return 49;
  return undefined;
}
