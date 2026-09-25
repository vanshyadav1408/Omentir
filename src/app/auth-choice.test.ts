import { afterEach, describe, expect, test } from "bun:test";
import { getLoadedClerk } from "./auth-choice";

const globals = globalThis as unknown as { window?: { Clerk?: unknown } };
globals.window ??= globalThis as unknown as { Clerk?: unknown };

function setClerk(clerk: unknown) {
  globals.window!.Clerk = clerk;
}

afterEach(() => {
  setClerk(undefined);
});

describe("getLoadedClerk", () => {
  test("waits for ClerkProvider's own load instead of starting a second one, because an option-less clerk.load() mid-flight re-initializes Clerk and Google sign in never redirects", async () => {
    let secondLoadStarted = false;
    const clerk: Record<string, unknown> = {
      loaded: false,
      status: "loading",
      setActive: async () => {},
      load: async () => {
        secondLoadStarted = true;
      },
    };
    setClerk(clerk);

    // The provider finishes loading shortly after the user clicks.
    setTimeout(() => {
      clerk.client = { signIn: {}, signUp: {} };
      clerk.status = "ready";
      clerk.loaded = true;
    }, 120);

    const loaded = await getLoadedClerk(2_000);

    expect(loaded as unknown).toBe(clerk);
    expect(secondLoadStarted).toBe(false);
  });

  test("fails fast with its own message when Clerk reports a failed start, so the user is not left waiting out the timeout", async () => {
    setClerk({ loaded: false, status: "error", setActive: async () => {} });
    const started = Date.now();

    await expect(getLoadedClerk(5_000)).rejects.toThrow("failed to start");
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  test("tells a blocked Clerk script apart from a slow start, so a support report says which one happened", async () => {
    await expect(getLoadedClerk(150)).rejects.toThrow("may be blocking it");

    setClerk({ loaded: false, status: "loading", setActive: async () => {} });
    await expect(getLoadedClerk(150)).rejects.toThrow("taking too long");
  });
});
