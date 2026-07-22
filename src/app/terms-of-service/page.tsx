import { MarketingPage } from "../marketing-shell";
import { createPageMetadata } from "../seo";

export const metadata = createPageMetadata({
  title: "Terms of Service - Omentir",
  description:
    "Read the terms for using Omentir to analyze products, discover leads, run LinkedIn campaigns, and manage outbound workflows.",
  path: "/terms-of-service",
  keywords: ["Omentir terms", "Omentir terms of service"],
});

const sections = [
  {
    title: "1. Use of Omentir",
    body: "Omentir provides software for product analysis, lead discovery, prospect organization, LinkedIn campaign workflows, outreach drafting, reply tracking, and related business development operations. By creating an account, purchasing a plan, connecting an account, inviting a workspace member, or using any part of Omentir, you agree to these terms. You may use Omentir only for lawful business purposes and only in a way that respects applicable laws, third-party rights, platform rules, and the limits shown inside the product. You are responsible for making sure your users, employees, contractors, and workspace members follow these terms when acting through your account.",
  },
  {
    title: "2. Your connected accounts",
    body: "You are responsible for any LinkedIn account, email account, billing account, or other third-party account that you connect to Omentir. You must have permission to connect and use those accounts with the service, and you must keep credentials, sessions, and workspace access secure. Omentir may rely on third-party providers to access connected account features, and those providers may change, suspend, rate-limit, or reject requests. If a connected account becomes unavailable, restricted, disconnected, or blocked by a third party, some Omentir features may stop working until access is restored.",
  },
  {
    title: "3. Acceptable use",
    body: "You may not use Omentir to send spam, harass people, scrape or process data unlawfully, misrepresent yourself, impersonate another person or company, violate privacy or intellectual property rights, bypass platform limits, interfere with service security, overload infrastructure, resell unauthorized access, reverse engineer the product, or use data in a way that violates applicable laws or third-party terms. You may not use Omentir for deceptive, discriminatory, harmful, illegal, or high-risk activity. We may limit, suspend, or terminate access if we believe your use creates legal, security, operational, platform, deliverability, or reputational risk.",
  },
  {
    title: "4. Campaign responsibility",
    body: "You control the campaigns, target groups, approvals, sending limits, connected accounts, and messages sent from your account. Omentir provides automation and drafting tools, but you remain responsible for deciding who to contact, what to say, when to send, and whether your outreach is appropriate. You agree to review important AI-generated content before using it, honor opt-out and do-not-contact requests, comply with applicable marketing, privacy, consumer protection, and platform rules, and avoid contacting people where you lack a lawful or appropriate basis to do so. Omentir does not guarantee meetings, replies, revenue, deliverability, account safety, or acceptance by any third-party platform.",
  },
  {
    title: "5. Billing and refunds",
    body: "Paid plans are billed through our payment provider and begin when checkout is completed. Prices, plan limits, renewal periods, included usage, and available features may vary by plan and may be shown at checkout or inside the product. Unless required by law or expressly approved by Omentir, fees are non-refundable after the refund window described here. If you are not satisfied with the product, you may apply for a refund only within seven days of the original purchase date. To request a refund, email hi@omentir.com or contact us through an available support channel with the email address used for purchase, your workspace or account name, the purchase date, and a short explanation of why the product did not meet your expectations. The request must be sent within the seven-day window; requests submitted after the seventh day are not eligible unless applicable law requires otherwise. We may ask follow-up questions, request proof of purchase, verify that you control the relevant account or workspace, and review usage history to confirm the request is tied to the purchase being refunded. Submitting a request does not guarantee approval, and we may deny requests that appear abusive, fraudulent, duplicative, connected to a chargeback, tied to a previously refunded account, or inconsistent with this policy. If approved, refunds are generally returned to the original payment method and may take additional time to appear depending on the payment provider, card network, or bank. A refund may terminate or reduce access to paid features, credits, usage limits, workspaces, automations, stored outputs, connected-account workflows, and support associated with the refunded purchase. You are responsible for exporting or preserving any information you need before access changes. The refund window applies to the initial purchase unless Omentir states otherwise in writing; renewals, add-ons, usage overages, partial billing periods, custom services, implementation work, and previously refunded accounts may be ineligible. You may cancel at any time to stop future renewals, but cancellation does not automatically refund amounts already paid. If a refund is required by law, that legal requirement controls this policy.",
  },
  {
    title: "6. Service availability",
    body: "Omentir depends on third-party services for authentication, hosting, database storage, AI processing, LinkedIn provider access, billing, monitoring, and email delivery. Availability, speed, feature behavior, and data freshness may be affected by those providers, internet conditions, rate limits, platform restrictions, maintenance, security events, customer configuration, or events outside our control. We may update, pause, modify, remove, or limit features to improve the product, protect users, comply with law, manage platform risk, or preserve service stability. We try to operate Omentir professionally, but we do not promise uninterrupted or error-free access.",
  },
  {
    title: "7. No LinkedIn affiliation",
    body: "Omentir is not associated with, endorsed by, sponsored by, or officially approved by LinkedIn. LinkedIn is a trademark of its respective owner. Your use of LinkedIn or any third-party platform remains governed by that platform's own terms, policies, and enforcement decisions. Omentir cannot control third-party platform actions, including account reviews, restrictions, message limits, interface changes, provider outages, data availability, or policy updates.",
  },
  {
    title: "8. Privacy and data",
    body: "Your use of Omentir is also governed by our Privacy Policy, which explains how we collect, use, store, process, protect, and delete information. You retain responsibility for the data, leads, instructions, campaign content, and account connections you provide to Omentir. You represent that you have the rights, permissions, notices, and lawful basis needed to provide that information and use it for outreach. We may process information through vendors and infrastructure providers as needed to operate Omentir, secure the service, provide support, comply with law, and enforce these terms.",
  },
  {
    title: "9. Intellectual property",
    body: "Omentir and its software, branding, workflows, user interface, documentation, systems, and underlying technology are owned by Omentir or its licensors. These terms do not transfer ownership of Omentir to you. You retain ownership of your own business content, product information, campaign instructions, and approved outreach copy, subject to the rights you grant us to host, process, display, transmit, and use that content to provide the service. Feedback, suggestions, and ideas you provide may be used by Omentir without restriction or compensation.",
  },
  {
    title: "10. Liability",
    body: "The service is provided as is and as available. To the maximum extent permitted by law, Omentir disclaims warranties of merchantability, fitness for a particular purpose, non-infringement, uninterrupted availability, error-free operation, deliverability, business results, and third-party platform acceptance. To the maximum extent permitted by law, our liability for claims related to the service is limited to the amount you paid Omentir in the twelve months before the claim. We are not liable for indirect, incidental, special, consequential, exemplary, punitive, lost-profit, lost-revenue, lost-data, lost-goodwill, platform-enforcement, or business-interruption damages.",
  },
  {
    title: "11. Changes and termination",
    body: "We may update these terms from time to time. If changes are material, we may provide notice through the product, website, email, or another reasonable method. Continued use of Omentir after updated terms become effective means you accept the updated terms. You may stop using Omentir at any time, and we may suspend or terminate access if required by law, requested by a provider, needed to protect the service, or caused by actual or suspected violation of these terms. Sections that by their nature should survive termination will continue to apply.",
  },
  {
    title: "12. Contact",
    body: "Questions about these terms can be sent to hi@omentir.com.",
  },
];

export default function TermsOfServicePage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Terms of Service"
      description="The rules for using Omentir and running outbound workflows through the product."
    >
      <div className="rounded-xl border border-[#ba3871] bg-white p-6">
        <p className="text-sm text-zinc-500">Last updated: June 12, 2026</p>
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
