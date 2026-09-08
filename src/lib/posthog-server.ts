type CaptureInput = {
  event: string;
  distinctId: string;
  properties?: Record<string, unknown>;
  insertId?: string;
  timeoutMs?: number;
};

export function posthogIngestHost(): string {
  // Server capture must hit PostHog ingest, not the browser reverse proxy.
  // e.omentir.com is for posthog-js only. Sending server events through it
  // is how onboarding survey responses never showed up in Surveys.
  return (
    process.env.POSTHOG_INGEST_HOST?.replace(/\/$/, "") || "https://us.i.posthog.com"
  );
}

export async function capturePostHogEvent(input: CaptureInput): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;
  if (process.env.NODE_ENV === "development") return;

  try {
    const response = await fetch(`${posthogIngestHost()}/i/v0/e/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event: input.event,
        distinct_id: input.distinctId,
        timestamp: new Date().toISOString(),
        properties: {
          $lib: "omentir-server",
          ...(input.insertId ? { $insert_id: input.insertId } : {}),
          ...input.properties,
        },
      }),
      signal: AbortSignal.timeout(input.timeoutMs ?? 4000),
    });
    if (!response.ok) {
      console.error("PostHog capture failed", input.event, response.status);
    }
  } catch (error) {
    // Analytics must never delay signup, checkout, or webhooks.
    console.error("PostHog capture error", input.event, error);
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
