import { NextRequest, NextResponse } from "next/server";
import { consumeLinkedInConnectToken, saveLinkedInAccount } from "@/lib/server/data";
import { listUnipileLinkedInAccounts } from "@/lib/server/unipile";
import { rateLimit } from "@/lib/request-rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/request-body";

export const dynamic = "force-dynamic";

type UnipileCallback = {
  status?: string;
  account_id?: string;
  name?: string;
  account_name?: string;
  display_name?: string;
  user_full_name?: string;
  profile_picture_url?: string;
  picture_url?: string;
  avatar_url?: string;
};

export async function POST(request: NextRequest) {
  if (!rateLimit("connect-callback:global", 300, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let payload: UnipileCallback | null;
  try {
    payload = await readJsonBody<UnipileCallback>(request, 32 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    throw error;
  }
  if (!payload || payload.status !== "CREATION_SUCCESS" || !payload.account_id || !payload.name) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!/^[A-Za-z0-9_-]{40,64}$/.test(payload.name)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const workspaceId = await consumeLinkedInConnectToken(payload.name);
  if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const providerAccount = (await listUnipileLinkedInAccounts()).find(
    (account) => account.id === payload.account_id,
  );
  if (!providerAccount) {
    return NextResponse.json({ error: "Provider account was not found." }, { status: 400 });
  }

  await saveLinkedInAccount(workspaceId, {
    accountId: payload.account_id,
    displayName:
      providerAccount.name ||
      payload.account_name ||
      payload.display_name ||
      payload.user_full_name ||
      "LinkedIn",
    ...(payload.profile_picture_url || payload.picture_url || payload.avatar_url
      ? {
          avatarUrl:
            payload.profile_picture_url ||
            payload.picture_url ||
            payload.avatar_url,
        }
      : {}),
    status: "connected",
  });

  return NextResponse.json({ ok: true });
}
