export type HelpCluster =
  | "limits"
  | "profile"
  | "requests"
  | "messages"
  | "inmail"
  | "targeting"
  | "email"
  | "rules";

export type HelpFaq = {
  question: string;
  answer: string;
};

export type HelpRelated = {
  label: string;
  href: string;
};

export type HelpPageDraft = {
  slug: string;
  question: string;
  description: string;
  keywords: string[];
  cluster: HelpCluster;
  publishedDate: string;
  updatedDate: string;
  paragraphs: string[];
  faqItems: HelpFaq[];
  relatedSlugs: string[];
};

export type HelpPage = Omit<HelpPageDraft, "relatedSlugs"> & {
  related: HelpRelated[];
};

export const HELP_CLUSTER_LABELS: Record<HelpCluster, string> = {
  limits: "Limits and account health",
  profile: "Profile and presence",
  requests: "Connection requests",
  messages: "Messages and follow-ups",
  inmail: "InMail, Premium, and Sales Navigator",
  targeting: "Targeting and B2B sales",
  email: "Cold email",
  rules: "Rules and tools",
};

export const HELP_CLUSTER_ORDER: HelpCluster[] = [
  "limits",
  "profile",
  "requests",
  "messages",
  "inmail",
  "targeting",
  "email",
  "rules",
];
