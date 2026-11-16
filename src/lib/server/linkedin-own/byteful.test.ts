import { expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
const { BytefulError, bytefulClient } = await import("./byteful");

const ENV = { NODE_ENV: "test", BYTEFUL_API_PUBLIC_KEY: " pub ", BYTEFUL_API_PRIVATE_KEY: "priv" } as NodeJS.ProcessEnv;

function fakeFetch(respond: (url: string, init: RequestInit) => { status?: number; body: unknown }) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const impl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init: init || {} });
    const { status = 200, body } = respond(url, init || {});
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
  return { impl, calls };
}

test("every call carries both API keys, and a purchase is one IP for one month in the chosen country", async () => {
  const { impl, calls } = fakeFetch(() => ({ body: { data: { service_id: "API-1" } } }));
  expect(await bytefulClient(ENV, impl).buy("GB")).toBe("API-1");
  const [call] = calls;
  expect(call.url).toBe("https://api.byteful.com/1.0/public/user/checkout/create");
  expect(call.init.method).toBe("POST");
  expect(call.init.headers).toMatchObject({ "X-API-Public-Key": "pub", "X-API-Private-Key": "priv" });
  expect(JSON.parse(String(call.init.body))).toEqual({ product_code: "isp_gb", quantity: 1, cycle_interval: "month", cycle_interval_count: 1 });
});

test("only static ISP products in stock count as countries Byteful sells", async () => {
  const { impl } = fakeFetch(() => ({
    body: {
      data: {
        isp_us: { country_id: "us", product_type: "isp", product_is_available: true, product_stock: 40 },
        isp_fr: { country_id: "fr", product_type: "isp", product_is_available: false, product_stock: 0 },
        isp_de: { country_id: "de", product_type: "isp", product_is_available: true, product_stock: 0 },
        datacenter_gb: { country_id: "gb", product_type: "datacenter", product_is_available: true, product_stock: 900 },
      },
    },
  }));
  expect(await bytefulClient(ENV, impl).ispCountries()).toEqual(["US"]);
});

test("the proxy list is read page by page so no IP is missed", async () => {
  const page = (count: number, offset: number) => Array.from({ length: count }, (_, index) => ({ proxy_id: `p${offset + index}` }));
  const { impl, calls } = fakeFetch((url) => ({ body: { data: new URL(url).searchParams.get("page") === "1" ? page(100, 0) : page(3, 100) } }));
  expect(await bytefulClient(ENV, impl).ispProxies()).toHaveLength(103);
  expect(calls.map((call) => new URL(call.url).searchParams.get("page"))).toEqual(["1", "2"]);
});

test("a refusal surfaces Byteful's own reason, never a silent success", async () => {
  const { impl } = fakeFetch(() => ({ status: 422, body: { error: "Unprocessable", message: "Insufficient credit balance." } }));
  const error = await bytefulClient(ENV, impl).buy("US").catch((caught) => caught);
  expect(error).toBeInstanceOf(BytefulError);
  expect(error).toMatchObject({ status: 422, message: "Insufficient credit balance." });
});

test("cancelling keeps the IP until the paid month ends", async () => {
  const { impl, calls } = fakeFetch(() => ({ body: { data: {} } }));
  await bytefulClient(ENV, impl).cancelAtPeriodEnd("API-1");
  expect(calls[0].url).toBe("https://api.byteful.com/1.0/public/user/service/edit/API-1");
  expect(calls[0].init.method).toBe("PATCH");
  expect(JSON.parse(String(calls[0].init.body))).toEqual({ service_is_pending_cancellation: true });
});

test("a list that never ends is an error, never a partial list the pool would act on", async () => {
  const { impl } = fakeFetch(() => ({ body: { data: Array.from({ length: 100 }, (_, index) => ({ proxy_id: `p${index}` })) } }));
  await expect(bytefulClient(ENV, impl).ispProxies()).rejects.toBeInstanceOf(BytefulError);
});
