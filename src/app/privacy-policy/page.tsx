import { notFound } from "next/navigation";
import { createPageMetadata } from "../seo";
import { getLegalPage } from "@/lib/cms";
import { LegalPageView } from "@/lib/cms/legal-page-view";

export async function generateMetadata() {
  const page = await getLegalPage("privacy-policy");
  if (!page) {
    return createPageMetadata({
      title: "Not found - Omentir",
      description: "This page does not exist.",
      path: "/privacy-policy",
      noIndex: true,
    });
  }
  return createPageMetadata({
    title: `${page.title} - Omentir`,
    description: page.description,
    path: "/privacy-policy",
    keywords: page.keywords,
  });
}

export default async function PrivacyPolicyPage() {
  const page = await getLegalPage("privacy-policy");
  if (!page) notFound();
  return <LegalPageView page={page} />;
}
