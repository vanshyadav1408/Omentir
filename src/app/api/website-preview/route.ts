import { NextRequest, NextResponse } from "next/server";
import { fetchWebsitePages } from "@/lib/server/website";
import { rateLimitRequest } from "@/lib/request-rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/request-body";

export const dynamic = "force-dynamic";

function hostFromUrl(websiteUrl: string) {
  return new URL(/^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`).hostname.replace(
    /^www\./,
    "",
  );
}

export async function POST(request: NextRequest) {
  if (!rateLimitRequest(request, "website-preview", {
    perSource: 30,
    global: 500,
    windowMs: 60 * 60 * 1000,
  })) {
    return NextResponse.json({ error: "Too many website preview requests." }, { status: 429 });
  }
  let body: { websiteUrl?: string } | null;
  try {
    body = await readJsonBody<{ websiteUrl?: string }>(request, 8 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    throw error;
  }
  const websiteUrl = body?.websiteUrl?.trim();

  if (!websiteUrl) {
    return NextResponse.json({ error: "Website URL is required." }, { status: 400 });
  }

  try {
    const pages = await fetchWebsitePages(websiteUrl);

    return NextResponse.json({
      host: hostFromUrl(websiteUrl),
      pageCount: pages.length,
      pages: pages.map((page) => ({
        url: page.url,
        preview: page.text.slice(0, 220),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not read this website.",
      },
      { status: 422 },
    );
  }
}
