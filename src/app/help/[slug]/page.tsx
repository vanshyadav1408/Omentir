import { notFound } from "next/navigation";
import { createPageMetadata } from "../../seo";
import HelpArticle from "../help-page";
import { ALL_HELP_PAGES, getHelpPage } from "../help-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_HELP_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = getHelpPage(slug);
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
  });
}

export default async function HelpSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getHelpPage(slug);
  if (!page) notFound();
  return <HelpArticle page={page} />;
}
