import { NextRequest, NextResponse } from "next/server";
import { fetchWebsitePages } from "@/lib/server/website";

export const dynamic = "force-dynamic";

function hostFromUrl(websiteUrl: string) {
  return new URL(/^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`).hostname.replace(
    /^www\./,
    "",
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { websiteUrl?: string };
  const websiteUrl = body.websiteUrl?.trim();

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
