import { describe, expect, test } from "bun:test";
import { isUnipileAccountUsable } from "./unipile-account-status";

describe("isUnipileAccountUsable", () => {
  test("treats OK and running as usable so a healthy Unipile session keeps the app open", () => {
    expect(isUnipileAccountUsable("OK")).toBe(true);
    expect(isUnipileAccountUsable("running")).toBe(true);
  });

  test("treats CREDENTIALS and disconnected as unusable because Unipile needs a new login", () => {
    expect(isUnipileAccountUsable("CREDENTIALS")).toBe(false);
    expect(isUnipileAccountUsable("disconnected")).toBe(false);
    expect(isUnipileAccountUsable("errored")).toBe(false);
    expect(isUnipileAccountUsable("ERROR")).toBe(false);
  });

  test("fails open on a missing status so a listed account is not dropped if Unipile omitted the field", () => {
    expect(isUnipileAccountUsable("")).toBe(true);
    expect(isUnipileAccountUsable(undefined)).toBe(true);
  });
});
