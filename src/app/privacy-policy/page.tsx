import { MarketingPage } from "../marketing-shell";
import { createPageMetadata } from "../seo";

export const metadata = createPageMetadata({
  title: "Privacy Policy - Omentir",
  description:
    "Read how Omentir collects, uses, stores, and protects account, billing, LinkedIn, lead, campaign, and message data.",
  path: "/privacy-policy",
  keywords: ["Omentir privacy policy", "Omentir data privacy"],
});

const sections = [
  {
    title: "1. Information we collect",
    body: "We collect the information needed to create, secure, bill, support, and operate your Omentir account. This may include your name, email address, company information, workspace settings, subscription status, billing records, support messages, product descriptions, website URLs, ideal customer profile inputs, campaign settings, lead lists, saved prospects, outreach drafts, sent-message records, reply metadata, usage events, device and browser information, log data, and connected account identifiers. If you connect LinkedIn or another third-party account, we may collect account metadata and activity information that is necessary to provide the features you enable. We also collect information you intentionally provide when you upload, paste, generate, edit, approve, or send content inside the product.",
  },
  {
    title: "2. How we use information",
    body: "We use information to provide and improve Omentir, including analyzing your website and product, building buyer profiles, finding potential prospects, organizing lead groups, generating campaign drafts, operating outreach workflows, tracking replies, showing account activity, sending service notices, processing payments, preventing abuse, debugging errors, protecting the service, complying with legal obligations, and responding to support requests. We may use aggregated or de-identified information to understand product performance and improve reliability, but we do not sell your personal information and we do not sell customer campaign, lead, or message data.",
  },
  {
    title: "3. LinkedIn data",
    body: "When you connect a LinkedIn account, Omentir uses that connection only to deliver the product features you choose to use, such as lead review, profile enrichment, campaign execution, reply detection, and workflow status updates. You are responsible for having the right to connect and use that account with Omentir. We do not claim ownership over LinkedIn data, and we do not use a connected account to act outside the workflows configured by you or your workspace. You can disconnect a LinkedIn account to stop future access, although historical records may remain where needed for security, audit, billing, support, compliance, or ordinary product operation.",
  },
  {
    title: "4. AI processing",
    body: "Omentir uses AI systems and related vendors to analyze websites, summarize businesses, classify prospects, score lead fit, draft personalized outreach, improve message quality, and help users decide which prospects to contact. Inputs and outputs may include your website content, product notes, targeting instructions, lead data, campaign drafts, and reply context. AI-generated content can be inaccurate or incomplete, so users should review important outputs before relying on them. We do not use your private messages, proprietary customer inputs, or workspace-specific campaign data to train models for other customers, and we require service providers to process data only as needed to deliver the service.",
  },
  {
    title: "5. Vendors",
    body: "We work with trusted service providers for authentication, cloud hosting, database storage, analytics, billing, customer support, LinkedIn provider access, AI processing, email delivery, monitoring, and security. These providers may process information on our behalf under contractual or technical restrictions intended to limit use to the services they provide to Omentir. Some providers may process information in countries other than your own. By using Omentir, you understand that information may be transferred to and processed by vendors and infrastructure providers where our service operations are located.",
  },
  {
    title: "6. Retention and deletion",
    body: "We keep account, billing, workspace, lead, campaign, outreach, and operational records for as long as needed to provide Omentir, maintain accurate business records, support customers, investigate abuse, enforce our terms, satisfy legal obligations, and protect the service. Retention periods vary depending on the type of information and the reason it is stored. You may request deletion of your account or certain information by contacting us, and we will process valid requests within a reasonable time unless we need to retain information for legitimate business, legal, security, fraud-prevention, billing, dispute-resolution, or backup purposes.",
  },
  {
    title: "7. Security",
    body: "We use reasonable technical and organizational safeguards designed to protect information in transit and at rest, including access controls, provider security features, monitoring, and internal handling practices. No internet service, database, API provider, or automation platform is perfectly secure, and we cannot guarantee absolute security. You are responsible for keeping your login credentials secure, limiting workspace access to appropriate users, reviewing connected accounts, and notifying us promptly if you believe your account or workspace has been compromised.",
  },
  {
    title: "8. Your choices and rights",
    body: "You can update certain account and workspace information inside Omentir, disconnect connected accounts, cancel paid access, unsubscribe from non-essential communications where available, and contact us about privacy requests. Depending on where you live, you may have rights to access, correct, delete, export, restrict, or object to certain processing of personal information. We may need to verify your identity before completing a request, and some requests may be limited by law, security needs, product functionality, or records we must keep.",
  },
  {
    title: "9. Cookies and product analytics",
    body: "Omentir and its providers may use cookies, local storage, session identifiers, logs, and similar technologies to keep you signed in, remember preferences, secure the service, measure usage, diagnose errors, and understand which parts of the product are working well. Some browser settings may let you block or delete cookies, but doing so may affect login, billing, security, and product functionality.",
  },
  {
    title: "10. Contact",
    body: "For privacy questions, deletion requests, access requests, correction requests, or other privacy concerns, contact hi@omentir.com. Please include enough detail for us to understand your request and identify the relevant account or workspace. We may respond from another official Omentir email address, ask for additional verification, or preserve certain records where required by law or legitimate business needs.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="How Omentir collects, uses, and protects information while operating the product."
    >
      <div className="rounded-xl border border-[#ba3871] bg-white p-6">
        <p className="text-sm text-zinc-500">Last updated: May 4, 2026</p>
        <div className="mt-8 space-y-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                {section.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-zinc-700">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </MarketingPage>
  );
}
