import "server-only";

// The few Byteful API calls (documentation.byteful.com) that buying and
// keeping static ISP IPs needs. Each purchase is one IP on its own monthly
// subscription, paid from the account's credit balance, so a single IP can
// be cancelled without touching the others. Money is in US cents.
const BASE_URL = "https://api.byteful.com/1.0/public/user";
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

export class BytefulError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export type BytefulProxy = {
  proxy_id: string;
  proxy_ip_address: string;
  proxy_http_port: number;
  proxy_status: string;
  service_id: string;
  country_id: string;
};

export type BytefulQuote = {
  is_valid: boolean;
  invalid_reason?: string;
  // Monthly price of the IP after discounts, before credit is applied.
  total: number;
  // What would still be owed after credit; above zero means too little credit.
  total_after_applied_credit: number;
};

type CatalogItem = {
  country_id: string | null;
  product_type: string;
  product_is_available: boolean;
  product_stock: number | null;
};

export function bytefulConfigured(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.BYTEFUL_API_PUBLIC_KEY?.trim() && env.BYTEFUL_API_PRIVATE_KEY?.trim());
}

export function bytefulClient(env: NodeJS.ProcessEnv = process.env, fetchImpl: typeof fetch = fetch) {
  async function call<T>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown): Promise<T> {
    const response = await fetchImpl(`${BASE_URL}${path}`, {
      method,
      headers: {
        "X-API-Public-Key": env.BYTEFUL_API_PUBLIC_KEY?.trim() || "",
        "X-API-Private-Key": env.BYTEFUL_API_PRIVATE_KEY?.trim() || "",
        ...(body ? { "content-type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30_000),
    });
    const json = (await response.json().catch(() => ({}))) as { data?: T; message?: string; error?: string };
    if (!response.ok) throw new BytefulError(response.status, json.message || json.error || `Byteful API returned ${response.status}`);
    return json.data as T;
  }

  // One IP in one country for one month, renewed monthly from credit.
  const order = (country: string) => ({
    product_code: `isp_${country.toLowerCase()}`,
    quantity: 1,
    cycle_interval: "month",
    cycle_interval_count: 1,
  });

  return {
    // Countries with static ISP IPs for sale right now, as upper-case codes.
    async ispCountries() {
      const catalog = await call<Record<string, CatalogItem>>("GET", "/checkout/catalog");
      return Object.values(catalog || {})
        .filter((item) => item.product_type === "isp" && item.product_is_available && item.country_id && item.product_stock !== 0)
        .map((item) => item.country_id!.toUpperCase());
    },
    quote(country: string) {
      return call<BytefulQuote>("POST", "/checkout/quote", order(country));
    },
    // Returns the new subscription's id. The IP itself arrives a little later.
    async buy(country: string) {
      const result = await call<{ service_id: string }>("POST", "/checkout/create", order(country));
      return result.service_id;
    },
    async creditCents() {
      const customer = await call<{ credit_balance?: number }>("GET", "/customer/retrieve");
      return Number(customer?.credit_balance || 0);
    },
    // Throws rather than return a partial list: the pool treats a missing
    // IP as gone and moves its account.
    async ispProxies() {
      const proxies = new Map<string, BytefulProxy>();
      for (let page = 1; page <= MAX_PAGES; page++) {
        const batch = (await call<BytefulProxy[]>("GET", `/proxy/search?proxy_type=isp&per_page=${PAGE_SIZE}&page=${page}`)) || [];
        if (batch.some((proxy) => proxies.has(proxy.proxy_id))) throw new BytefulError(500, "Byteful returned the same proxies on two pages.");
        for (const proxy of batch) proxies.set(proxy.proxy_id, proxy);
        if (batch.length < PAGE_SIZE) return [...proxies.values()];
      }
      throw new BytefulError(500, `Byteful's proxy list did not end after ${MAX_PAGES} pages.`);
    },
    // Keeps the IP working until the month it was paid for ends.
    async cancelAtPeriodEnd(serviceId: string) {
      await call("PATCH", `/service/edit/${encodeURIComponent(serviceId)}`, { service_is_pending_cancellation: true });
    },
  };
}

export type BytefulClient = ReturnType<typeof bytefulClient>;
