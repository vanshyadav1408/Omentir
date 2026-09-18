import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import { getLeadsByIds } from "@/lib/server/data";
import { fetchLeadAvatarBytes } from "@/lib/server/lead-avatar-fetch";
import {
  getLeadAvatarCache,
  leadAvatarCacheBytes,
  persistLeadAvatarFromUrl,
} from "@/lib/server/lead-avatar-cache";
import { httpsAvatarUrl, isLinkedInMediaUrl } from "@/lib/lead-avatar";
import { rateLimitRequest } from "@/lib/request-rate-limit";

export const dynamic = "force-dynamic";

function emptyImage(status: number) {
  return new NextResponse(null, { status });
}

function imageResponse(body: Buffer, contentType: string) {
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
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

  const leadId = request.nextUrl.searchParams.get("leadId")?.trim();
  if (leadId) {
    const workspace = await resolveActiveWorkspace(userId);
    const [lead] = await getLeadsByIds(workspace.id, [leadId]);
    if (!lead) return emptyImage(404);

    const cached = leadAvatarCacheBytes(await getLeadAvatarCache(leadId));
    if (cached) return imageResponse(cached.body, cached.contentType);

    const liveUrl = httpsAvatarUrl(lead.avatarUrl);
    if (liveUrl) {
      await persistLeadAvatarFromUrl(lead.id, workspace.id, liveUrl);
      const next = leadAvatarCacheBytes(await getLeadAvatarCache(leadId));
      if (next) return imageResponse(next.body, next.contentType);
    }

    return emptyImage(404);
  }

  const url = httpsAvatarUrl(request.nextUrl.searchParams.get("u"));
  if (!url || !isLinkedInMediaUrl(url)) return emptyImage(400);

  const avatar = await fetchLeadAvatarBytes(url);
  if (!avatar) return emptyImage(404);

  return imageResponse(avatar.body, avatar.contentType);
}
