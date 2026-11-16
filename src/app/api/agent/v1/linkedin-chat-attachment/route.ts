import { auth } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { listLinkedInAccounts } from "@/lib/server/data";
import { resolveActiveWorkspace } from "@/lib/server/active-workspace";
import { hasActiveSubscription } from "@/lib/server/subscription";
import { fetchLinkedInMessageAttachment, linkedInMessageAccountId } from "@/lib/server/linkedin";

const INLINE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/webm",
]);

// Photos and files sent in a LinkedIn chat, for the Messages thread.
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await resolveActiveWorkspace(userId);
  if (!hasActiveSubscription(workspace)) {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const messageId = url.searchParams.get("messageId")?.trim() || "";
  const attachmentId = url.searchParams.get("attachmentId")?.trim() || "";
  const accountId = url.searchParams.get("accountId")?.trim() || "";
  const account = accountId
    ? (await listLinkedInAccounts(workspace.id)).find((item) => item.accountId === accountId)
    : null;

  if (!messageId || !attachmentId || !account) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  try {
    if ((await linkedInMessageAccountId(messageId)) !== account.accountId) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }
    const upstream = await fetchLinkedInMessageAttachment({ messageId, attachmentId });
    const upstreamType = upstream.headers.get("content-type")?.split(";")[0].trim().toLowerCase() || "";
    // Anyone can send a file into a chat. Only open media and PDFs in the
    // browser; anything else (HTML, SVG) downloads so it never runs on our origin.
    const inline = INLINE_TYPES.has(upstreamType);
    const name = url.searchParams.get("name")?.trim() || "attachment";
    return new Response(upstream.body, {
      headers: {
        "content-type": inline ? upstreamType : "application/octet-stream",
        "content-disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(name)}`,
        "cache-control": "private, max-age=86400",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "[linkedin-chat-attachment] load failed:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Attachment could not be loaded." }, { status: 502 });
  }
}
