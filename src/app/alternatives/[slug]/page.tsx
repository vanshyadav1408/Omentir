import { notFound } from "next/navigation";
import { createPageMetadata } from "../../seo";
import AlternativePageView from "../../seo-content/alternative-page";
import { isSeoPageLive, seoOgImage } from "../../seo-content/types";
import { ALL_ALTERNATIVES, getAlternative } from "../alternative-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return ALL_ALTERNATIVES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = getAlternative(slug);

  if (!page) {
    return createPageMetadata({
      title: "Tool roundup - Omentir",
      description: "Category shortlists for LinkedIn outbound and AI SDR tools.",
      path: `/alternatives/${slug}`,
      noIndex: true,
    });
  }

  const image = seoOgImage("alternatives", page.slug, page.title);
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
  const page = getAlternative(slug);
  if (!page) notFound();
  return <AlternativePageView page={page} />;
}
