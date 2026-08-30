import { notFound } from "next/navigation";
import { createPageMetadata } from "../../seo";
import ComparisonPageView from "../../seo-content/comparison-page";
import { isSeoPageLive } from "../../seo-content/types";
import { getSeoPage, getSeoSlugs } from "@/lib/cms";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getSeoSlugs("comparisons");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = await getSeoPage("comparisons", slug);

  if (!page) {
    return createPageMetadata({
      title: "AI Sales Tool Alternative - Omentir",
      description: "Omentir as an alternative for AI sales and LinkedIn outreach.",
      path: `/comparisons/${slug}`,
      noIndex: true,
    });
  }

  const image = page.ogImage;
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
  const page = await getSeoPage("comparisons", slug);
  if (!page) notFound();
  return <ComparisonPageView page={page} />;
}
