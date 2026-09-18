import { after, NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import { getLeadsByIds } from "@/lib/server/data";
import { fetchLeadAvatarBytes } from "@/lib/server/lead-avatar-fetch";
import {
  getLeadAvatarCache,
  leadAvatarCacheBytes,
  persistLeadAvatarFromUrl,
} from "@/lib/server/lead-avatar-cache";
import {
  leadAvatarUrlIsLive,
  refreshLeadAvatarIfNeeded,
} from "@/lib/server/lead-avatar-refresh";
import { httpsAvatarUrl, isLinkedInMediaUrl } from "@/lib/lead-avatar";
import { rateLimitRequest } from "@/lib/request-rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REFRESH_WAIT_MS = 8_000;

function emptyImage(status: number) {
  return new NextResponse(null, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
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

async function cachedImage(leadId: string) {
  const cached = leadAvatarCacheBytes(await getLeadAvatarCache(leadId));
  return cached ? imageResponse(cached.body, cached.contentType) : null;
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

    const cached = await cachedImage(leadId);
    if (cached) return cached;

    const liveUrl = httpsAvatarUrl(lead.avatarUrl);
    if (liveUrl && leadAvatarUrlIsLive(liveUrl)) {
      await persistLeadAvatarFromUrl(lead.id, workspace.id, liveUrl);
      const next = await cachedImage(leadId);
      if (next) return next;
    }

    // Expired CDN tokens 404. Pull a fresh headshot from Unipile in the
    // background; wait a beat so the first rows can paint without a 404 that
    // the <img> would never retry.
    const refresh = refreshLeadAvatarIfNeeded(lead);
    let settled = false;
    const tracked = refresh.finally(() => {
      settled = true;
    });
    await Promise.race([
      tracked,
      new Promise<void>((resolve) => setTimeout(resolve, REFRESH_WAIT_MS)),
    ]);
    const refreshed = await cachedImage(leadId);
    if (refreshed) return refreshed;

    if (!settled) after(() => tracked.catch(() => undefined));
    return emptyImage(404);
  }

  const url = httpsAvatarUrl(request.nextUrl.searchParams.get("u"));
  if (!url || !isLinkedInMediaUrl(url)) return emptyImage(400);

  const avatar = await fetchLeadAvatarBytes(url);
  if (!avatar) return emptyImage(404);

  return imageResponse(avatar.body, avatar.contentType);
}
