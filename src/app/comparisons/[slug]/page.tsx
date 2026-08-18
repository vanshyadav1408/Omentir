import { notFound } from "next/navigation";
import { createPageMetadata } from "../../seo";
import ComparisonPageView from "../../seo-content/comparison-page";
import { isSeoPageLive, seoOgImage } from "../../seo-content/types";
import { ALL_COMPARISONS, getComparison } from "../comparison-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return ALL_COMPARISONS.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = getComparison(slug);

  if (!page) {
    return createPageMetadata({
      title: "AI Sales Tool Alternative - Omentir",
      description: "Omentir as an alternative for AI sales and LinkedIn outreach.",
      path: `/comparisons/${slug}`,
      noIndex: true,
    });
  }

  const image = seoOgImage("comparisons", page.slug, page.title);
  return createPageMetadata({
    title: `${page.title} - Omentir`,
    description: page.description,
    path: `/comparisons/${page.slug}`,
    keywords: page.keywords,
    noIndex: !isSeoPageLive(page),
    image,
  });
}

export default async function ComparisonPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getComparison(slug);
  if (!page) notFound();
  return <ComparisonPageView page={page} />;
}
