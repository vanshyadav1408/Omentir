import { NextResponse } from "next/server";
import { siteUrl } from "@/app/seo";
import {
  listPublicMarkdownPages,
  renderPublicMarkdown,
} from "@/lib/public-page-markdown";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const pages = await listPublicMarkdownPages();
  return pages.map((page) => ({
    slug: page.htmlPath === "/" ? [] : page.htmlPath.slice(1).split("/"),
  }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await context.params;
  const htmlPath = slug?.length ? `/${slug.join("/")}` : "/";
  const body = await renderPublicMarkdown(htmlPath);

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
      "X-Robots-Tag": "noindex, follow",
      Link: `<${canonical}>; rel="canonical"`,
    },
  });
}
