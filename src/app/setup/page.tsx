import { redirect } from "next/navigation";
import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "Setup - Omentir",
  description: "Learn Omentir and create your first AI agent.",
  path: "/setup",
  noIndex: true,
});

export default function SetupPage() {
  redirect("/overview");
}
