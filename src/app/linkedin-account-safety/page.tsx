import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "../json-ld";
import {
  CalPageHero,
  MarketingFooter,
  MarketingHeader,
} from "../marketing-shell";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  createWebPageJsonLd,
  siteUrl,
} from "../seo";

const description =
  "How Omentir signs in to your LinkedIn account, what it stores (and what it never stores), the limits it works within, and what happens when you disconnect or your plan ends.";

export const metadata = createPageMetadata({
  title: "How Omentir Handles Your LinkedIn Account - Omentir",
  description,
  path: "/linkedin-account-safety",
  keywords: [
    "Omentir LinkedIn account safety",
    "Omentir LinkedIn password",
    "Omentir LinkedIn session",
    "is Omentir safe for LinkedIn",
  ],
});

const email = <a href="mailto:vansh@omentir.com">vansh@omentir.com</a>;

type Section = { title: string; paragraphs: ReactNode[] };

const sections: Section[] = [
  {
    title: "Signing in with your password",
    paragraphs: [
      <>
        You type your LinkedIn email and password into Omentir&apos;s connect
        form. Our server opens a browser, goes to linkedin.com, and signs in
        with them once. LinkedIn hands back a signed-in session, and that
        session is all Omentir keeps. The password is never saved and never
        written to logs.
      </>,
      <>
        We sign in this way because LinkedIn turns away sign-in requests that do
        not come from a real browser. The browser runs on our server, signs in,
        and closes.
      </>,
    ],
  },
  {
    title: "Verification codes",
    paragraphs: [
      <>
        LinkedIn often asks for a second check after a password sign-in: a code
        sent to your email or phone, a code from an authenticator app, or a tap
        to approve the sign-in in the LinkedIn app on your phone. When that
        happens, the connect form tells you which check LinkedIn picked, and the
        sign-in waits up to ten minutes while you finish it. If the wait runs
        out, you just start the sign-in again.
      </>,
    ],
  },
  {
    title: "If password sign-in fails",
    paragraphs: [
      <>
        Sometimes LinkedIn will not accept a sign-in from our server (a security
        puzzle, or an account that only uses Google to sign in). The connect form
        then offers a browser session option: you copy two cookies (li_at and
        JSESSIONID) from your own signed-in LinkedIn tab and paste them into
        Omentir. Those become the same encrypted session a password sign-in would
        have produced. Your password is still never stored.
      </>,
    ],
  },
  {
    title: "What Omentir stores",
    paragraphs: [
      <>
        The LinkedIn session cookies, encrypted with AES-256-GCM before they go
        into the database, and never written to logs. The session is what lets
        Omentir act as your account: send connection requests and messages, read
        replies, and notice when someone accepts a request. Omentir never stores
        your LinkedIn password, and nobody at Omentir can read your session out
        of the database.
      </>,
      <>
        The session lives with the rest of your workspace data on Google Cloud
        in us-central1 (Iowa, US), encrypted at rest. The{" "}
        <Link href="/security">Security page</Link> covers storage, vendors, and
        access controls in full.
      </>,
    ],
  },
  {
    title: "How long the session lasts",
    paragraphs: [
      <>
        Until LinkedIn ends it, you disconnect, or your plan has been over for 7
        days (see below). LinkedIn sessions do expire on their own from time to
        time. When that happens, Omentir marks the account disconnected and asks
        you to sign in again. Nothing is lost: your campaigns, leads, and
        message history stay in your workspace.
      </>,
    ],
  },
  {
    title: "Daily limits",
    paragraphs: [
      <>
        Every workspace has daily caps for connection requests and messages. The
        defaults are 10 invites and 20 messages a day. You can raise or lower
        them in Settings, up to 100 invites and 200 messages a day. Campaigns
        only send inside the send window you pick, in the lead&apos;s time zone,
        and requests go out one at a time with gaps between them rather than all
        at once.
      </>,
      <>
        Profile views through the connected account are limited to 75 a day.
        Connection requests that sit unanswered for 28 days are withdrawn, on by
        default, so old invites do not pile up on your account.
      </>,
    ],
  },
  {
    title: "Risk of LinkedIn restrictions",
    paragraphs: [
      <>
        We will not pretend otherwise: LinkedIn does not allow automation on
        personal accounts, and any tool that sends invites and messages for you
        carries some risk, including ours. The caps, send windows, and spacing
        above exist to keep your activity close to what a person would do by
        hand. They lower the risk. They do not remove it. If your LinkedIn
        account is your livelihood and any risk is too much, do not connect it
        to automation, ours included.
      </>,
    ],
  },
  {
    title: "Disconnecting",
    paragraphs: [
      <>
        You can disconnect any time from Settings. Omentir deletes the stored
        session first, then marks the account disconnected, so a disconnected
        account in Omentir never hides a session we still hold. Campaigns on
        that account stop sending.
      </>,
      <>
        Deleting our copy does not sign you out of LinkedIn itself. To end the
        session on LinkedIn&apos;s side too, open LinkedIn&apos;s settings and
        remove it from the list of active sessions. That also cuts off any
        access Omentir could still have, right away.
      </>,
    ],
  },
  {
    title: "When your plan ends",
    paragraphs: [
      <>
        Your LinkedIn account stays connected for 7 days after your plan ends.
        If you resubscribe inside that week, nothing changes and you do not have
        to sign in to LinkedIn again. After the 7 days, Omentir disconnects the
        account and deletes the stored session, the same as if you had clicked
        Disconnect. We delete it rather than keep it because a stored session
        lets us act on your LinkedIn, and we should not hold that for an account
        that is no longer paying.
      </>,
      <>
        Your workspace data is not deleted when this happens. Leads, campaigns,
        and conversation history stay where they are, and everything picks up
        again if you resubscribe and reconnect.
      </>,
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      <>
        Email {email}. You reach the person who wrote the code, and the code
        itself is open source under the MIT license on{" "}
        <a
          href="https://github.com/vanshyadav1408/Omentir"
          target="_blank"
          rel="noopener"
        >
          GitHub
        </a>
        , so your team can check anything on this page against what the software
        actually does.
      </>,
    ],
  },
];

export default function LinkedInAccountSafetyPage() {
  const jsonLd = [
    createWebPageJsonLd({
      name: "How Omentir Handles Your LinkedIn Account",
      description,
      url: `${siteUrl}/linkedin-account-safety`,
      dateModified: "November 16, 2026",
    }),
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      {
        name: "LinkedIn account safety",
        url: `${siteUrl}/linkedin-account-safety`,
      },
    ]),
  ];

  return (
    <>
      <JsonLd id="linkedin-account-safety-jsonld" data={jsonLd} />
      {/* Same layout as the legal pages: cream hero, then one plain
          reading column. */}
      <main className="site-theme min-h-screen overflow-x-hidden">
        <MarketingHeader transparentAtTop />
        <CalPageHero title="How Omentir handles your LinkedIn account">
          <p className="cal-page-meta">Last updated November 16, 2026</p>
        </CalPageHero>

        <article className="site-legal-body cal-read">
          <p>
            This page explains how Omentir signs in to your LinkedIn account,
            what it stores and what it never stores, the limits it works within,
            and what happens when you disconnect or your plan ends.
          </p>
          {sections.map((section, index) => (
            <section key={section.title} className="mt-8">
              <h2>
                {index + 1}. {section.title}
              </h2>
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="mt-3">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </article>
        <MarketingFooter />
      </main>
    </>
  );
}
