import { notFound } from "next/navigation";
import { createPageMetadata } from "../seo";
import { getGuide, getGuideSlugs } from "@/lib/cms";
import GuidePageView from "../guides/guide-page";
import { guideHeroImage } from "../guides/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = await getGuide(slug);
  if (!page) {
    return createPageMetadata({
      title: "Not found - Omentir",
      description: "This page does not exist.",
      path: `/${slug}`,
      noIndex: true,
    });
  }
  const image = guideHeroImage(page.slug);
  return createPageMetadata({
    title: page.title,
    description: page.description,
    path: `/${page.slug}`,
    keywords: page.keywords,
    image: image
      ? {
          url: image.src,
          width: image.width,
          height: image.height,
          alt: page.title,
        }
      : undefined,
  });
}

export default async function RootGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getGuide(slug);
  if (!page) notFound();
  return <GuidePageView page={page} />;
}
