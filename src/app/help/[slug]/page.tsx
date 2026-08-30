import { notFound } from "next/navigation";
import { createPageMetadata } from "../../seo";
import HelpArticle from "../help-page";
import { isSeoPageLive } from "../../seo-content/types";
import { getHelpPage, getHelpSlugs } from "@/lib/cms";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getHelpSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = await getHelpPage(slug);
  if (!page) {
    return createPageMetadata({
      title: "Not found - Omentir",
      description: "This page does not exist.",
      path: `/help/${slug}`,
      noIndex: true,
    });
  }
  return createPageMetadata({
    title: page.question,
    description: page.description,
    path: `/help/${page.slug}`,
    keywords: page.keywords,
    noIndex: !isSeoPageLive(page),
  });
}

export default async function HelpSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getHelpPage(slug);
  if (!page) notFound();
  return <HelpArticle page={page} />;
}
