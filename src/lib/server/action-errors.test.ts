import { describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

const { withActionErrors } = await import("./action-errors");
const { unwrapAction } = await import("@/lib/action-result");

class ProviderError extends Error {
  status = 422;
}

describe("withActionErrors", () => {
  test("returns the result of a successful action unchanged", async () => {
    expect(await withActionErrors(async () => ({ agentId: "a1" }))).toEqual({ agentId: "a1" });
  });

  test("a limit the user hit reaches them as readable text, since production hides thrown action messages", async () => {
    const result = await withActionErrors(async () => {
      throw new Error("Daily message limit reached. Try again tomorrow.");
    });
    expect(result).toEqual({ actionError: "Daily message limit reached. Try again tomorrow." });
    expect(() => unwrapAction(result)).toThrow("Daily message limit reached. Try again tomorrow.");
  });

  test("agent API errors are user-facing too, matched by name so actions.ts can keep loading them lazily", async () => {
    const error = new Error("Lead not found.");
    error.name = "AgentApiOperationError";
    expect(await withActionErrors(async () => { throw error; })).toEqual({
      actionError: "Lead not found.",
    });
  });

  test("provider errors with raw response bodies are not shown to users", async () => {
    await expect(
      withActionErrors(async () => {
        throw new ProviderError('Unipile request failed: 422 {"account_id":"secret"}');
      }),
    ).rejects.toThrow("Unipile request failed");
  });

  test("database errors carrying a code are not shown to users", async () => {
    const firestoreError = Object.assign(new Error("9 FAILED_PRECONDITION: index projects/x"), {
      code: 9,
    });
    await expect(withActionErrors(async () => { throw firestoreError; })).rejects.toBe(
      firestoreError,
    );
  });

  test("redirect() still navigates instead of being turned into an error message", async () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/agents;307;",
    });
    await expect(withActionErrors(async () => { throw redirect; })).rejects.toBe(redirect);
  });

  test("very long messages are cut so a stray stack dump cannot flood the UI", async () => {
    const result = await withActionErrors(async () => {
      throw new Error("x".repeat(1000));
    });
    expect((result as { actionError: string }).actionError.length).toBe(240);
  });
});
