/**
 * Connects a LinkedIn account to a workspace through Omentir's own LinkedIn
 * client, from the cookies of a browser that is logged in to LinkedIn.
 * CLI alternative to the /connect/linkedin screen.
 *
 * Usage (cookies on stdin so they never land in shell history):
 *   pbpaste | bun --conditions=react-server \
 *     scripts/linkedin-own-connect.ts --workspace <workspaceId> --user-agent "<browser UA>"
 *
 * The cookie input is the Cookie request header of any linkedin.com request
 * (DevTools > Network > a /voyager/api/ request > Request Headers > cookie).
 * It must contain li_at and JSESSIONID. Needs LINKEDIN_SESSION_KEY (32 bytes,
 * base64) and, in production, LINKEDIN_PROXY_URL.
 */
import { connectOwnLinkedInAccount } from "../src/lib/server/linkedin-own/connect";

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const workspaceId = arg("workspace");
const userAgent = arg("user-agent") || process.env.LINKEDIN_USER_AGENT || "";
const timezone = arg("timezone") || Intl.DateTimeFormat().resolvedOptions().timeZone;
if (!workspaceId) {
  console.error("Missing --workspace <workspaceId>.");
  process.exit(1);
}

const cookieHeader = (await Bun.stdin.text()).trim();
if (!cookieHeader) {
  console.error("Pipe the LinkedIn Cookie header into stdin.");
  process.exit(1);
}

try {
  const account = await connectOwnLinkedInAccount({ workspaceId, cookieHeader, userAgent, timezone, replaceAccountId: arg("replace-account") });
  console.log(`Connected ${account.displayName} as ${account.accountId} (doc ${account.id}).`);
  if (account.retiredUnipileAccountIds?.length) console.error("Markers for the replaced account could not be cleared yet. Account verification retries that on its own.");
  process.exit(0);
} catch (error) {
  console.error(`Connect failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
