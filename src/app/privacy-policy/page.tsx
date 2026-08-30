import { notFound } from "next/navigation";
import { createPageMetadata } from "../seo";
import { getLegalPage } from "@/lib/cms";
import { LegalPageView } from "@/lib/cms/legal-page-view";

export async function generateMetadata() {
  const page = await getLegalPage("privacy-policy");
  return createPageMetadata({
    title: page ? `${page.title} - Omentir` : "Privacy Policy - Omentir",
    description:
      page?.description ??
      "Read how Omentir collects, uses, stores, and protects account, billing, LinkedIn, lead, campaign, and message data.",
    path: "/privacy-policy",
    keywords: page?.keywords ?? ["Omentir privacy policy", "Omentir data privacy"],
  });
}

export default async function PrivacyPolicyPage() {
  const page = await getLegalPage("privacy-policy");
  if (!page) notFound();
  return <LegalPageView page={page} />;
}
