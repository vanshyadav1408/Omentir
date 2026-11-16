import { randomBytes } from "node:crypto";
import { expect, test } from "bun:test";
import { decryptSessionSecret, encryptSessionSecret } from "./session-crypto";

const key = randomBytes(32).toString("base64");

test("cookies round-trip but are never stored in readable form", () => {
  const secret = JSON.stringify({ li_at: "AQEDAR-secret-cookie", JSESSIONID: "ajax:123" });
  const sealed = encryptSessionSecret(secret, key);
  expect(sealed).not.toContain("AQEDAR");
  expect(decryptSessionSecret(sealed, key)).toBe(secret);
  // Fresh IV per write: the same cookie never produces the same ciphertext.
  expect(encryptSessionSecret(secret, key)).not.toBe(sealed);
});

test("a tampered or foreign-key blob fails instead of yielding garbage cookies", () => {
  const sealed = encryptSessionSecret("li_at=abc", key);
  const parts = sealed.split(".");
  const flipped = Buffer.from(parts[3], "base64url");
  flipped[0] ^= 1;
  parts[3] = flipped.toString("base64url");
  expect(() => decryptSessionSecret(parts.join("."), key)).toThrow();
  expect(() => decryptSessionSecret(sealed, randomBytes(32).toString("base64"))).toThrow();
});

test("a missing or short key fails loudly instead of storing cookies weakly", () => {
  expect(() => encryptSessionSecret("x", "")).toThrow();
  expect(() => encryptSessionSecret("x", randomBytes(16).toString("base64"))).toThrow();
});
