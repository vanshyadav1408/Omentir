import { NextRequest, NextResponse } from "next/server";
import { saveLinkedInAccount } from "@/lib/server/data";
import { passwordsMatch } from "@/lib/local-session";
import { rateLimit } from "@/lib/request-rate-limit";

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

function isAuthorized(request: NextRequest) {
  const secret = process.env.UNIPILE_CONNECT_CALLBACK_SECRET || process.env.UNIPILE_WEBHOOK_SECRET;
  if (!secret) return false;

  const supplied =
    request.headers.get("x-omentir-connect-secret") ||
    request.nextUrl.searchParams.get("secret") ||
    "";
  return passwordsMatch(supplied, secret);
}

export async function POST(request: NextRequest) {
  const source = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`connect-callback:${source}`, 120, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as UnipileCallback;

  if (payload.status !== "CREATION_SUCCESS" || !payload.account_id || !payload.name) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await saveLinkedInAccount(payload.name, {
    accountId: payload.account_id,
    displayName:
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
