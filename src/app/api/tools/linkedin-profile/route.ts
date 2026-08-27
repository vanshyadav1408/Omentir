import { NextRequest, NextResponse } from "next/server";
import { analyzePublicLinkedInProfile } from "@/lib/server/gemini";
import { fetchPublicLinkedInProfileDraft } from "@/lib/server/exa-linkedin-profile";
import { ExaSearchError } from "@/lib/server/exa-people-search";
import { rateLimitRequestShared, requestSource } from "@/lib/request-rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/request-body";
import {
  normalizeLinkedInProfileDraft,
  parsePublicLinkedInProfileUrl,
  profileDraftHasContent,
} from "@/lib/linkedin-profile-tool";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

function isBrowserSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isBrowserSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  if (
    !(await rateLimitRequestShared(request, "linkedin-profile-tool", {
      sourceKey: requestSource(request),
      perSource: 8,
      global: 80,
      windowMs: 60 * 60 * 1000,
    }))
  ) {
    return NextResponse.json(
      { error: "Too many profile reviews from this network. Try again in an hour." },
      { status: 429 },
    );
  }

  let body: { mode?: unknown; profileUrl?: unknown } | null;
  try {
    body = await readJsonBody(request, 4 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    throw error;
  }

  const mode = body?.mode;
  if (mode !== "rating" && mode !== "improve") {
    return NextResponse.json({ error: "Choose rating or improve." }, { status: 400 });
  }

  const profileUrl = parsePublicLinkedInProfileUrl(
    typeof body?.profileUrl === "string" ? body.profileUrl : "",
  );
  if (!profileUrl) {
    return NextResponse.json({ error: "Paste a public linkedin.com/in URL." }, { status: 400 });
  }

  try {
    const fetched = await fetchPublicLinkedInProfileDraft(profileUrl);
    const draft = normalizeLinkedInProfileDraft({ ...fetched, profileUrl });
    if (!profileDraftHasContent(draft)) {
      return NextResponse.json(
        { error: "Could not read that public profile. Use a public linkedin.com/in URL." },
        { status: 422 },
      );
    }

    const result = await analyzePublicLinkedInProfile(mode, draft);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ExaSearchError) {
      console.error(`[linkedin-profile-tool] ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Could not review this profile.";
    console.error(`[linkedin-profile-tool] ${message}`);
    const unavailable = /unavailable|configure|GEMINI|Vertex/i.test(message);
    return NextResponse.json(
      {
        error: unavailable
          ? "This tool is temporarily unavailable."
          : message,
      },
      { status: unavailable ? 503 : 422 },
    );
  }
}
