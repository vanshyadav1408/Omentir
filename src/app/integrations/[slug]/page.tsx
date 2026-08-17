import { notFound } from "next/navigation";
import { createPageMetadata } from "../../seo";
import IntegrationPageView from "../../seo-content/integration-page";
import { isSeoPageLive, seoOgImage } from "../../seo-content/types";
import { ALL_INTEGRATIONS, getIntegration } from "../integration-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return ALL_INTEGRATIONS.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = getIntegration(slug);

  if (!page) {
    return createPageMetadata({
      title: "Integration - Omentir",
      description: "Omentir integration.",
      path: `/integrations/${slug}`,
      noIndex: true,
    });
  }

  const image = seoOgImage("integrations", page.slug, page.title);
  return createPageMetadata({
    title: `${page.title} - Omentir`,
    description: page.description,
    path: `/integrations/${page.slug}`,
    keywords: page.keywords,
    noIndex: !isSeoPageLive(page),
    image,
  });
}

export default async function IntegrationPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getIntegration(slug);

  if (!page) {
    notFound();
  }

  return <IntegrationPageView page={page} />;
}
