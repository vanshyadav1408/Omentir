import { NextResponse } from "next/server";
import { INDEXNOW_KEY } from "@/lib/indexnow";

export const dynamic = "force-static";

export function GET() {
  return new NextResponse(INDEXNOW_KEY, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
