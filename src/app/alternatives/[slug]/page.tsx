import { notFound } from "next/navigation";
import { createPageMetadata } from "../../seo";
import AlternativePageView from "../../seo-content/alternative-page";
import { isSeoPageLive } from "../../seo-content/types";
import { getSeoPage, getSeoSlugs } from "@/lib/cms";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getSeoSlugs("alternatives");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = await getSeoPage("alternatives", slug);

  if (!page) {
    return createPageMetadata({
      title: "Tool roundup - Omentir",
      description: "Category shortlists for LinkedIn outbound and AI SDR tools.",
      path: `/alternatives/${slug}`,
      noIndex: true,
    });
  }

  const image = page.ogImage;
  return createPageMetadata({
    title: `${page.title} - Omentir`,
    description: page.description,
    path: `/alternatives/${page.slug}`,
    keywords: page.keywords,
    noIndex: !isSeoPageLive(page),
    image,
  });
}

export default async function AlternativePage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getSeoPage("alternatives", slug);
  if (!page) notFound();
  return <AlternativePageView page={page} />;
}
