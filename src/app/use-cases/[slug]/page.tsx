import { notFound } from "next/navigation";
import { createPageMetadata } from "../../seo";
import UseCasePageView from "../../seo-content/use-case-page";
import { isSeoPageLive, seoOgImage } from "../../seo-content/types";
import { ALL_USE_CASES, getUseCase } from "../use-case-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return ALL_USE_CASES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = getUseCase(slug);

  if (!page) {
    return createPageMetadata({
      title: "Use case - Omentir",
      description: "How teams use Omentir for LinkedIn outbound.",
      path: `/use-cases/${slug}`,
      noIndex: true,
    });
  }

  const image = seoOgImage("use-cases", page.slug, page.title);
  return createPageMetadata({
    title: `${page.title} - Omentir`,
    description: page.description,
    path: `/use-cases/${page.slug}`,
    keywords: page.keywords,
    noIndex: !isSeoPageLive(page),
    image,
  });
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params;
  const page = getUseCase(slug);
  if (!page) notFound();
  return <UseCasePageView page={page} />;
}
