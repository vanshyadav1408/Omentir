import { notFound } from "next/navigation";
import { createPageMetadata } from "../seo";
import { getLegalPage } from "@/lib/cms";
import { LegalPageView } from "@/lib/cms/legal-page-view";

export async function generateMetadata() {
  const page = await getLegalPage("terms-of-service");
  return createPageMetadata({
    title: page ? `${page.title} - Omentir` : "Terms of Service - Omentir",
    description:
      page?.description ??
      "Read the terms for using Omentir to analyze products, discover leads, run LinkedIn campaigns, and manage outbound workflows.",
    path: "/terms-of-service",
    keywords: page?.keywords ?? ["Omentir terms", "Omentir terms of service"],
  });
}

export default async function TermsOfServicePage() {
  const page = await getLegalPage("terms-of-service");
  if (!page) notFound();
  return <LegalPageView page={page} />;
}
