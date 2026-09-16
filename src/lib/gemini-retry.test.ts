import { describe, expect, test } from "bun:test";
import { isRetryableGeminiSearchError } from "./gemini-retry";

describe("isRetryableGeminiSearchError", () => {
  test("does not retry a Vertex googleSearch deadline so the people engine can fall back instead of burning a second minute", () => {
    expect(
      isRetryableGeminiSearchError(
        '{"error":{"code":504,"message":"Deadline expired before operation could complete.","status":"DEADLINE_EXCEEDED"}}',
      ),
    ).toBe(false);
  });

  test("retries quota so a brief 429 can still produce grounded candidates", () => {
    expect(isRetryableGeminiSearchError("429 RESOURCE_EXHAUSTED")).toBe(true);
  });
});
