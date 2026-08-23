import { NextResponse } from "next/server";
import { siteUrl } from "@/app/seo";
import {
  listPublicMarkdownPages,
  renderPublicMarkdown,
} from "@/lib/public-page-markdown";

// Baked at build time. The renderer reads TSX sources, which exist during
// `next build` but are not copied into the standalone production image.
export const dynamic = "force-static";

export function generateStaticParams() {
  return listPublicMarkdownPages().map((page) => ({
    slug: page.htmlPath === "/" ? [] : page.htmlPath.slice(1).split("/"),
  }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await context.params;
  const htmlPath = slug?.length ? `/${slug.join("/")}` : "/";
  const body = renderPublicMarkdown(htmlPath);

  if (!body) {
    return new NextResponse("Not found\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const canonical = htmlPath === "/" ? siteUrl : `${siteUrl}${htmlPath}`;
  return new NextResponse(`${body}\n`, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      // Agent alternate only. HTML at `canonical` stays indexable for Google.
      // This header is scoped to the markdown route, not to HTML pages.
      "X-Robots-Tag": "noindex, follow",
      Link: `<${canonical}>; rel="canonical"`,
    },
  });
}
