import { notFound } from "next/navigation";
import { createPageMetadata } from "../../seo";
import FeaturePageView from "../../seo-content/feature-page";
import { isSeoPageLive, seoOgImage } from "../../seo-content/types";
import { ALL_FEATURES, getFeature } from "../feature-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return ALL_FEATURES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = getFeature(slug);

  if (!page) {
    return createPageMetadata({
      title: "Feature - Omentir",
      description: "Omentir product feature.",
      path: `/features/${slug}`,
      noIndex: true,
    });
  }

  const image = seoOgImage("features", page.slug, page.title);
  return createPageMetadata({
    title: `${page.title} - Omentir`,
    description: page.description,
    path: `/features/${page.slug}`,
    keywords: page.keywords,
    noIndex: !isSeoPageLive(page),
    image,
  });
}

export default async function FeaturePage({ params }: PageProps) {
  const { slug } = await params;
  const page = getFeature(slug);
  if (!page) notFound();
  return <FeaturePageView page={page} />;
}
