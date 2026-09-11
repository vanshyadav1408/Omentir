import { describe, expect, test } from "bun:test";
import {
  isNextNavigationError,
  isRscDigestMessage,
  userFacingError,
} from "./toast";

describe("isRscDigestMessage", () => {
  test("matches production React #441 so a successful redirect is not shown as a form error", () => {
    expect(
      isRscDigestMessage(
        "Minified React error #441; visit https://react.dev/errors/441 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.",
      ),
    ).toBe(true);
  });

  test("matches the unminified Server Components render text that #441 decodes to", () => {
    expect(
      isRscDigestMessage(
        "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details.",
      ),
    ).toBe(true);
  });

  test("does not swallow a real launch or save failure", () => {
    expect(isRscDigestMessage("Choose a connected LinkedIn account.")).toBe(false);
    expect(isRscDigestMessage("Could not save. Try again.")).toBe(false);
  });
});

describe("isNextNavigationError", () => {
  test("treats a NEXT_REDIRECT digest as navigation, not a failed save", () => {
    const error = new Error("NEXT_REDIRECT");
    (error as Error & { digest: string }).digest = "NEXT_REDIRECT;replace;/agents;false;";
    expect(isNextNavigationError(error)).toBe(true);
  });

  test("treats minified #441 as navigation because production hides the redirect throw", () => {
    expect(
      isNextNavigationError(
        new Error(
          "Minified React error #441; visit https://react.dev/errors/441 for the full message",
        ),
      ),
    ).toBe(true);
  });
});

describe("userFacingError", () => {
  test("does not surface minified React #441 to the person launching or saving an agent", () => {
    expect(
      userFacingError(
        new Error(
          "Minified React error #441; visit https://react.dev/errors/441 for the full message",
        ),
        "Agent launch failed.",
      ),
    ).toBe("Agent launch failed.");
  });

  test("keeps a concrete server-action message so a missing LinkedIn account still shows", () => {
    expect(userFacingError(new Error("Choose a connected LinkedIn account."))).toBe(
      "Choose a connected LinkedIn account.",
    );
  });
});
