import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "../json-ld";
import { MarketingArticle } from "../marketing-shell";
import {
  MarketingTable,
  MarketingTd,
  MarketingTh,
  MarketingThead,
  MarketingTr,
} from "../marketing-table";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  createWebPageJsonLd,
  siteUrl,
} from "../seo";

const description =
  "How Omentir handles your LinkedIn login, where your data is stored, who can reach it, which vendors process it, and what we do not have yet.";

export const metadata = createPageMetadata({
  title: "Security - Omentir",
  description,
  path: "/security",
  keywords: [
    "Omentir security",
    "Omentir data storage",
    "Omentir subprocessors",
    "Omentir LinkedIn login",
  ],
});

const linkClass =
  "font-medium text-[var(--md-sys-color-primary)] underline underline-offset-4";

const email = (
  <a href="mailto:vansh@omentir.com" className={linkClass}>
    vansh@omentir.com
  </a>
);

// Short answers for the cards at the top. The markdown twin reads these too.
const glance: Array<{ label: string; value: string }> = [
  { label: "Your LinkedIn password", value: "Never reaches Omentir. You sign in on Unipile's page." },
  { label: "When you disconnect", value: "The LinkedIn session is deleted at Unipile first." },
  { label: "Where data lives", value: "Google Cloud, us-central1 (Iowa, US), encrypted at rest." },
  { label: "AI and your data", value: "Vertex AI on our own project. Nothing is used for training." },
  { label: "The code", value: "Open source, MIT. The same code runs omentir.com." },
  { label: "Certifications", value: "None yet. We answer questionnaires by email." },
];

type Section = { title: string; paragraphs: ReactNode[] };
type Group = { heading: string; sections: Section[] };

const securityGroups: Group[] = [
  {
    heading: "Your LinkedIn account",
    sections: [
      {
        title: "Do you store our LinkedIn password?",
        paragraphs: [
          <>
            No. You sign in to LinkedIn on a login page run by Unipile, the
            LinkedIn API provider Omentir uses. Your password goes to that page
            and never reaches Omentir&apos;s servers. Unipile keeps the LinkedIn
            session that lets Omentir send invites and messages for you.
          </>,
          <>
            The link that opens the login page works once and expires after 30
            minutes.
          </>,
        ],
      },
      {
        title: "What happens when we disconnect or cancel?",
        paragraphs: [
          <>
            When you click Disconnect in Omentir, we delete the LinkedIn session
            at Unipile first and only then mark the account as disconnected.
            When a subscription is cancelled, Omentir deletes every LinkedIn
            session connected to that customer&apos;s workspaces.
          </>,
          <>
            You can also end the session yourself at any time from the list of
            active sessions in LinkedIn&apos;s own settings. That cuts off
            Omentir&apos;s access too.
          </>,
        ],
      },
      {
        title: "How do you protect the account from LinkedIn restrictions?",
        paragraphs: [
          <>
            Every workspace has its own daily caps for connection requests and
            messages. You set them in Settings, up to 100 invites and 200
            messages a day. Campaigns only send inside the send window you pick,
            in the lead&apos;s time zone.
          </>,
          <>
            Omentir withdraws connection requests that sit unanswered for 28
            days, on by default, so stale invites do not pile up. Profile views
            through the connected account are limited to 75 a day.
          </>,
        ],
      },
    ],
  },
  {
    heading: "Your data",
    sections: [
      {
        title: "Where is our data stored?",
        paragraphs: [
          <>
            Omentir runs on Google Cloud in the us-central1 region, in Iowa,
            United States. The app server and the Firestore database are both
            there. Google encrypts Firestore data at rest by default.
          </>,
          <>
            We do not offer EU or other regional data hosting yet. If your
            company needs data to stay in a specific region, you can self-host
            Omentir on your own infrastructure.
          </>,
        ],
      },
      {
        title: "Is data encrypted in transit?",
        paragraphs: [
          <>
            Yes. omentir.com is served over HTTPS through Cloudflare, with HSTS
            turned on so browsers refuse plain HTTP. Every page also sends a
            Content Security Policy, denies framing by other sites, and sends
            the nosniff and referrer policy headers.
          </>,
        ],
      },
      {
        title: "What data does Omentir keep?",
        paragraphs: [
          <>
            Omentir keeps what it needs to run your outreach: your workspace
            settings, your product description and target customer profile, the
            leads it finds, your campaigns, and the LinkedIn messages it sends
            and receives for you. The{" "}
            <Link href="/privacy-policy" className={linkClass}>
              Privacy Policy
            </Link>{" "}
            has the full list.
          </>,
        ],
      },
      {
        title: "Is our data used to train AI models?",
        paragraphs: [
          <>
            Omentir uses Google&apos;s Gemini models through Vertex AI on Google
            Cloud, not a consumer chat app. Google&apos;s Cloud terms say it does
            not use customer data to train its models without permission.
            Omentir does not train any models on your data.
          </>,
          <>
            The AI reads your website, product notes, lead profiles, and
            conversation history so it can score leads and draft messages.
          </>,
        ],
      },
      {
        title: "Can we delete our data?",
        paragraphs: [
          <>
            Yes. Deleting a workspace removes its agents, leads, lead groups,
            campaigns, conversations, and API tokens from the database right
            away. To delete your whole account, email {email}.
          </>,
        ],
      },
    ],
  },
  {
    heading: "Access and application security",
    sections: [
      {
        title: "How do people sign in to Omentir?",
        paragraphs: [
          <>
            Clerk handles sign-in for Omentir accounts. Omentir never sees or
            stores your Omentir password. Every page and API route outside the
            public website requires a signed-in session.
          </>,
        ],
      },
      {
        title: "Can another customer see our workspace?",
        paragraphs: [
          <>
            No. Each request resolves the workspace from the signed-in user, and
            every database query is scoped to that workspace. The database is
            only reachable from the server with a service account. There is no
            client-side database access.
          </>,
        ],
      },
      {
        title: "How are API tokens and webhooks protected?",
        paragraphs: [
          <>
            Omentir stores only a SHA-256 hash of each API token. We show the
            token once when you create it and cannot show it again. You can
            revoke a token at any time from the API keys page.
          </>,
          <>
            Omentir checks the signature or shared secret on every webhook from
            Clerk, Whop, and Unipile before acting on it.
          </>,
        ],
      },
      {
        title: "Who handles payments?",
        paragraphs: [
          <>
            Whop runs checkout on its own hosted page. Your card details go to
            Whop, and Omentir never sees your card number.
          </>,
        ],
      },
      {
        title: "Can our security team review the code?",
        paragraphs: [
          <>
            Yes. Omentir is open source under the MIT license, and the code on{" "}
            <a
              href="https://github.com/vanshyadav1408/Omentir"
              target="_blank"
              rel="noopener"
              className={linkClass}
            >
              GitHub
            </a>{" "}
            is the same code that deploys to omentir.com. Your team can read it,
            and you can run your own copy if you would rather keep everything on
            your own servers.
          </>,
          <>
            The repository has GitHub secret scanning with push protection
            turned on, and the main branch cannot be force-pushed or deleted.
          </>,
        ],
      },
    ],
  },
  {
    heading: "Company and compliance",
    sections: [
      {
        title: "Who is behind Omentir?",
        paragraphs: [
          <>
            Omentir started in 2026 and is run from India by its founder, Vansh.
            The{" "}
            <Link href="/about" className={linkClass}>
              About page
            </Link>{" "}
            has the story. It is a small company, so when you email us you reach
            the person who wrote the code.
          </>,
        ],
      },
      {
        title: "What do you not have yet?",
        paragraphs: [
          <>
            We would rather you hear this from us than find out in review. Omentir
            does not yet have a SOC 2 or ISO 27001 report, EU data hosting, a
            published uptime SLA, or a standard data processing agreement. If
            your company needs any of these, email us and we will tell you what
            is possible and when.
          </>,
        ],
      },
      {
        title: "Do you fill in security questionnaires?",
        paragraphs: [
          <>
            Yes. Send it to {email} and we will complete it. Everything on this
            page can be quoted in your review as is.
          </>,
        ],
      },
      {
        title: "Need a document for your IT team?",
        paragraphs: [
          <>
            This page is also available as plain text at{" "}
            <a href="https://omentir.com/security.md" className={linkClass}>
              omentir.com/security.md
            </a>
            , so you can forward it or attach it to a review.
          </>,
        ],
      },
      {
        title: "How do we report a vulnerability?",
        paragraphs: [
          <>
            Email {email} with the steps to reproduce it. Please do not open a
            public GitHub issue, and do not include passwords, tokens, or
            customer data in the report.
          </>,
        ],
      },
    ],
  },
];

const subprocessors: Array<{ name: string; purpose: string; data: string }> = [
  { name: "Google Cloud", purpose: "Hosts the app server and database, runs the AI models.", data: "All workspace data." },
  { name: "Unipile", purpose: "Connects to LinkedIn.", data: "LinkedIn session, profiles, invites, and messages." },
  { name: "Clerk", purpose: "Sign-in for Omentir accounts.", data: "Name, email, and login sessions." },
  { name: "Whop", purpose: "Checkout and billing.", data: "Email and payment details." },
  { name: "Cloudflare", purpose: "Serves omentir.com over HTTPS.", data: "Traffic in transit." },
  { name: "PostHog", purpose: "Product analytics, hosted in the US.", data: "Page views and in-app events." },
  { name: "Resend", purpose: "Sends account emails, such as reply alerts.", data: "Your email address and the alert text." },
];

const headingClass =
  "text-xl font-medium tracking-tight text-[var(--md-sys-color-on-surface)]";
const bodyClass =
  "mt-4 space-y-5 text-base font-medium leading-8 text-[var(--md-sys-color-on-surface)]";

export default function SecurityPage() {
  const jsonLd = [
    createWebPageJsonLd({
      name: "Security",
      description,
      url: `${siteUrl}/security`,
      dateModified: "October 29, 2026",
    }),
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: "Security", url: `${siteUrl}/security` },
    ]),
  ];

  return (
    <>
      <JsonLd id="security-jsonld" data={jsonLd} />
      <MarketingArticle
        path="security"
        title="Security"
        description={description}
        updated="October 29, 2026"
      >
        <dl className="grid gap-3 sm:grid-cols-2">
          {glance.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-5 py-4"
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)]">
                {item.label}
              </dt>
              <dd className="mt-1.5 text-sm font-medium leading-6 text-[var(--md-sys-color-on-surface)]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 space-y-14">
          {securityGroups.map((group) => (
            <section key={group.heading}>
              <h2
                style={{ fontFamily: "var(--font-cal-display)" }}
                className="text-2xl font-medium tracking-tight text-[var(--md-sys-color-on-surface)]"
              >
                {group.heading}
              </h2>
              <div className="mt-6 space-y-10 border-l border-[var(--md-sys-color-outline-variant)] pl-6">
                {group.sections.map((section) => (
                  <section key={section.title}>
                    <h3 style={{ fontFamily: "var(--font-cal-display)" }} className={headingClass}>
                      {section.title}
                    </h3>
                    <div className={bodyClass}>
                      {section.paragraphs.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2
              style={{ fontFamily: "var(--font-cal-display)" }}
              className="text-2xl font-medium tracking-tight text-[var(--md-sys-color-on-surface)]"
            >
              Which vendors process our data?
            </h2>
            <p className={bodyClass}>
              These are the companies that touch your data when you use the
              hosted version of Omentir. Self-hosting removes Clerk, Whop, and
              PostHog from the list.
            </p>
            <MarketingTable className="mt-6" minWidthClass="min-w-[36rem]">
              <MarketingThead>
                <tr>
                  <MarketingTh>Vendor</MarketingTh>
                  <MarketingTh>What it does</MarketingTh>
                  <MarketingTh>Data it touches</MarketingTh>
                </tr>
              </MarketingThead>
              <tbody>
                {subprocessors.map((vendor) => (
                  <MarketingTr key={vendor.name}>
                    <MarketingTh scope="row">{vendor.name}</MarketingTh>
                    <MarketingTd>{vendor.purpose}</MarketingTd>
                    <MarketingTd>{vendor.data}</MarketingTd>
                  </MarketingTr>
                ))}
              </tbody>
            </MarketingTable>
          </section>
        </div>
      </MarketingArticle>
    </>
  );
}
