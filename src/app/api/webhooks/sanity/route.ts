import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

type SanityWebhookBody = {
  _type?: string;
  _id?: string;
  slug?: string | { current?: string };
  family?: string;
};

function slugOf(body: SanityWebhookBody) {
  if (typeof body.slug === "string") return body.slug;
  return body.slug?.current;
}

function tagsFor(body: SanityWebhookBody): string[] {
  const tags = new Set<string>(["cms"]);
  const slug = slugOf(body);
  switch (body._type) {
    case "seoPage":
      tags.add("cms:seo");
      if (typeof body.family === "string") tags.add(`cms:seo:${body.family}`);
      if (typeof body.family === "string" && slug) tags.add(`cms:seo:${body.family}:${slug}`);
      break;
    case "blogPost":
      tags.add("cms:blog");
      if (slug) tags.add(`cms:blog:${slug}`);
      break;
    case "helpArticle":
      tags.add("cms:help");
      if (slug) tags.add(`cms:help:${slug}`);
      break;
    case "guide":
      tags.add("cms:guide");
      if (slug) tags.add(`cms:guide:${slug}`);
      break;
    case "legalPage":
      tags.add("cms:legal");
      if (slug) tags.add(`cms:legal:${slug}`);
      break;
    default:
      tags.add("cms:seo");
      tags.add("cms:blog");
      tags.add("cms:help");
      tags.add("cms:guide");
      tags.add("cms:legal");
  }
  return [...tags];
}

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing SANITY_REVALIDATE_SECRET" }, { status: 500 });
  }

  const { isValidSignature, body } = await parseBody<SanityWebhookBody>(request, secret);
  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const tags = tagsFor(body ?? {});
  for (const tag of tags) revalidateTag(tag, "max");
  return NextResponse.json({ revalidated: true, tags });
}
