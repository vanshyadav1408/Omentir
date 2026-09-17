import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { fetchLeadAvatarBytes } from "@/lib/server/lead-avatar-fetch";
import { httpsAvatarUrl, isExpiredLinkedInMediaUrl, isLinkedInMediaUrl } from "@/lib/lead-avatar";
import { rateLimitRequest } from "@/lib/request-rate-limit";

export const dynamic = "force-dynamic";

function emptyImage(status: number) {
  return new NextResponse(null, { status });
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return emptyImage(401);

  if (
    !rateLimitRequest(request, "lead-avatars", {
      sourceKey: userId,
      perSource: 1000,
      global: 8000,
      windowMs: 60 * 1000,
    })
  ) {
    return emptyImage(429);
  }

  const url = httpsAvatarUrl(request.nextUrl.searchParams.get("u"));
  if (!url || !isLinkedInMediaUrl(url)) return emptyImage(400);
  if (isExpiredLinkedInMediaUrl(url)) return emptyImage(404);

  const avatar = await fetchLeadAvatarBytes(url);
  if (!avatar) return emptyImage(404);

  return new NextResponse(new Uint8Array(avatar.body), {
    headers: {
      "Content-Type": avatar.contentType,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
