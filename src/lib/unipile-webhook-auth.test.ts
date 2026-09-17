import { describe, expect, test } from "bun:test";
import {
  unipileWebhookProvidedSecret,
  unipileWebhookSecretHeaders,
} from "./unipile-webhook-auth";

describe("unipile webhook secret headers", () => {
  test("accepts Unipile-Auth because that is the header Unipile's docs attach", () => {
    const headers = new Headers({ "Unipile-Auth": "whsec_test" });
    expect(unipileWebhookProvidedSecret(headers)).toBe("whsec_test");
  });

  test("still accepts the header we register so existing deliveries keep working", () => {
    const headers = new Headers({ "x-omentir-webhook-secret": "whsec_legacy" });
    expect(unipileWebhookProvidedSecret(headers)).toBe("whsec_legacy");
  });

  test("registers both header names so a delivery using either one authorizes", () => {
    expect(unipileWebhookSecretHeaders("whsec_test")).toEqual([
      { key: "Content-Type", value: "application/json" },
      { key: "x-omentir-webhook-secret", value: "whsec_test" },
      { key: "Unipile-Auth", value: "whsec_test" },
    ]);
  });
});
