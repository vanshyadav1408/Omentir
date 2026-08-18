import { describe, expect, test } from "bun:test";
import {
  shouldRetryConnectionWithoutNote,
  isInviteResendBlockedErrorType,
} from "../src/lib/server/outreach-rules";

describe("shouldRetryConnectionWithoutNote", () => {
  test("retries a noted invite when LinkedIn rejects the note quota or a generic resend block", () => {
    expect(shouldRetryConnectionWithoutNote("Hi Jane, worth connecting.", "errors/too_many_characters")).toBe(true);
    expect(shouldRetryConnectionWithoutNote("Hi Jane, worth connecting.", "errors/cannot_resend_yet")).toBe(true);
    expect(shouldRetryConnectionWithoutNote("Hi Jane, worth connecting.", "errors/already_invited_recently")).toBe(true);
  });

  test("does not retry a bare invite, because that is already what the LinkedIn app sends", () => {
    expect(shouldRetryConnectionWithoutNote(undefined, "errors/cannot_resend_yet")).toBe(false);
    expect(shouldRetryConnectionWithoutNote("", "errors/cannot_resend_yet")).toBe(false);
  });

  test("does not retry errors that are not note-quota or resend blocks", () => {
    expect(shouldRetryConnectionWithoutNote("Hi Jane", "errors/invalid_recipient")).toBe(false);
    expect(shouldRetryConnectionWithoutNote("Hi Jane", undefined)).toBe(false);
  });
});

describe("isInviteResendBlockedErrorType", () => {
  test("only matches Unipile's ambiguous resend-block types", () => {
    expect(isInviteResendBlockedErrorType("errors/cannot_resend_yet")).toBe(true);
    expect(isInviteResendBlockedErrorType("errors/too_many_characters")).toBe(false);
  });
});
