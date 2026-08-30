import { notFound } from "next/navigation";
import { createPageMetadata } from "../../seo";
import IntegrationPageView from "../../seo-content/integration-page";
import { isSeoPageLive } from "../../seo-content/types";
import { getSeoPage, getSeoSlugs } from "@/lib/cms";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getSeoSlugs("integrations");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = await getSeoPage("integrations", slug);

  if (!page) {
    return createPageMetadata({
      title: "Integration - Omentir",
      description: "Omentir integration.",
      path: `/integrations/${slug}`,
      noIndex: true,
    });
  }

  const image = page.ogImage;
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
  const page = await getSeoPage("integrations", slug);
  if (!page) notFound();
  return <IntegrationPageView page={page} />;
}
