import { notFound } from "next/navigation";
import { createPageMetadata } from "../seo";
import { getLegalPage } from "@/lib/cms";
import { LegalPageView } from "@/lib/cms/legal-page-view";

export async function generateMetadata() {
  const page = await getLegalPage("terms-of-service");
  if (!page) {
    return createPageMetadata({
      title: "Not found - Omentir",
      description: "This page does not exist.",
      path: "/terms-of-service",
      noIndex: true,
    });
  }
  return createPageMetadata({
    title: `${page.title} - Omentir`,
    description: page.description,
    path: "/terms-of-service",
    keywords: page.keywords,
  });
}

export default async function TermsOfServicePage() {
  const page = await getLegalPage("terms-of-service");
  if (!page) notFound();
  return <LegalPageView page={page} />;
}
