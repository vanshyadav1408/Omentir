import { expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
const { isAllowedRedirectUri } = await import("./oauth");

test("a redirect URI that would run script in the browser is refused, because the OAuth code is handed to whatever it names", () => {
  expect(isAllowedRedirectUri("javascript:alert(1)")).toBe(false);
  expect(isAllowedRedirectUri("data:text/html,hi")).toBe(false);
  expect(isAllowedRedirectUri("vbscript:msgbox(1)")).toBe(false);
  expect(isAllowedRedirectUri("VBScript:msgbox(1)")).toBe(false);
});

test("native app schemes and https callbacks still work, so Cursor and VS Code can finish sign-in", () => {
  expect(isAllowedRedirectUri("cursor://anysphere.cursor-retrieval/oauth/callback")).toBe(true);
  expect(isAllowedRedirectUri("vscode://callback")).toBe(true);
  expect(isAllowedRedirectUri("https://claude.ai/api/mcp/auth_callback")).toBe(true);
  expect(isAllowedRedirectUri("http://localhost:6274/callback")).toBe(true);
  expect(isAllowedRedirectUri("http://example.com/callback")).toBe(false);
});
