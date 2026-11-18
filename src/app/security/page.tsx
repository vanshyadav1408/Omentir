import Link from "next/link";
import JsonLd from "../json-ld";
import { LegalShell, type LegalSection } from "../legal-shell";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  createWebPageJsonLd,
  siteUrl,
} from "../seo";

const description =
  "How Omentir handles your LinkedIn login, where your data is stored, who can reach it, which vendors process it, and what we do not have yet.";

const updated = "November 18, 2026";

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

const email = <a href="mailto:vansh@omentir.com">vansh@omentir.com</a>;

// Plain `title` + `<>paragraph</>` entries: the markdown twin
// (src/lib/public-page-markdown.ts) reads them straight from this source,
// so keep hrefs literal and titles free of double quotes.
const sections: LegalSection[] = [
  {
    title: "Your LinkedIn password",
    paragraphs: [
      <>
        You type your LinkedIn email and password into Omentir&apos;s connect
        form. They travel over HTTPS to our server, which signs in on
        linkedin.com once, in a Chromium browser it runs, again over HTTPS. The
        password is used for that one sign-in request. It is never written to
        the database, to logs, or to analytics.
      </>,
      <>
        The connect form only accepts requests from a signed-in Omentir user on
        omentir.com, and each user gets 5 sign-in attempts a minute. If LinkedIn
        asks for a verification code, the sign-in waits up to ten minutes and
        allows 5 code attempts. Anything Omentir saves during that wait is
        encrypted the same way as a session (see the next section) and never
        includes the password.
      </>,
      <>
        Code:{" "}
        <a href="https://github.com/vanshyadav1408/Omentir/blob/main/src/lib/server/linkedin-own/browser-login.ts" target="_blank" rel="noopener">browser-login.ts</a>{" "}
        and{" "}
        <a href="https://github.com/vanshyadav1408/Omentir/blob/main/src/app/api/connect/linkedin/own/login/route.ts" target="_blank" rel="noopener">the sign-in route</a>
        .
      </>,
    ],
  },
  {
    title: "How the LinkedIn session is encrypted",
    paragraphs: [
      <>
        After sign-in, LinkedIn hands back session cookies. That session is what
        Omentir keeps instead of your password. Before it goes into the
        database, Omentir encrypts it with AES-256-GCM: a 256-bit key, a new
        random 96-bit nonce every time it is encrypted, and an authentication
        tag, so a record that was changed or damaged fails to decrypt and is
        never used.
      </>,
      <>
        The key is kept in the app server&apos;s environment, not in the
        database, so a copy of the database on its own cannot be decrypted.
        Session cookies are never written to logs. Code:{" "}
        <a href="https://github.com/vanshyadav1408/Omentir/blob/main/src/lib/server/linkedin-own/session-crypto.ts" target="_blank" rel="noopener">session-crypto.ts</a>
        .
      </>,
    ],
  },
  {
    title: "How Omentir talks to LinkedIn",
    paragraphs: [
      <>
        Omentir does not click through LinkedIn in a browser. After sign-in it
        sends HTTPS requests to LinkedIn&apos;s web API, the same one
        linkedin.com uses in your own browser tab, with your session and the
        browser user agent you connected from.
      </>,
      <>
        Requests for one account go out one at a time, never in parallel.
        Omentir waits a random 1.2 to 2.8 seconds between reads and 3 to 6.5
        seconds between sends, such as invites and messages. Code:{" "}
        <a href="https://github.com/vanshyadav1408/Omentir/blob/main/src/lib/server/linkedin-own/transport.ts" target="_blank" rel="noopener">transport.ts</a>
        .
      </>,
    ],
  },
  {
    title: "Your account's IP address",
    paragraphs: [
      <>
        Each connected LinkedIn account gets its own IP address, picked in or
        near the country you connect from. The sign-in and every later request
        for that account go through it, so LinkedIn does not see many accounts
        arriving from one shared server. The omentir.com server refuses to send
        any LinkedIn request without one, and if no IP is free for a new
        account, Omentir tells you and does not connect it.
      </>,
      <>
        Byteful supplies these IP addresses. The connection to linkedin.com is
        encrypted end to end through it, so Byteful sees that the traffic goes
        to linkedin.com but cannot read your password, session, or messages.
        Code:{" "}
        <a href="https://github.com/vanshyadav1408/Omentir/blob/main/src/lib/server/linkedin-own/proxy-pool.ts" target="_blank" rel="noopener">proxy-pool.ts</a>
        .
      </>,
    ],
  },
  {
    title: "Limits that protect the account",
    paragraphs: [
      <>
        Every workspace has daily caps for connection requests and messages. The
        defaults are 10 invites and 20 messages a day, and you can raise them to
        100 invites and 200 messages in Settings. Campaigns only send inside the
        send window you pick, in the lead&apos;s time zone.
      </>,
      <>
        Profile views through the connected account are capped at 75 a day.
        Connection requests that sit unanswered for 28 days are withdrawn, on by
        default, so stale invites do not pile up.
      </>,
    ],
  },
  {
    title: "Disconnecting and cancelling",
    paragraphs: [
      <>
        When you click Disconnect in Omentir, we delete the stored LinkedIn
        session first and only then mark the account as disconnected. When a
        plan ends, the account stays connected for 7 days in case the customer
        resubscribes. After those 7 days, Omentir disconnects it and deletes
        every LinkedIn session connected to that customer&apos;s workspaces.
      </>,
      <>
        Deleting our copy does not sign you out on LinkedIn. To end the session
        there too, remove it from the list of active sessions in LinkedIn&apos;s
        own settings. That also cuts off Omentir&apos;s access right away. The{" "}
        <Link href="/linkedin-account-safety">LinkedIn account safety page</Link>{" "}
        walks through sign-in, storage, limits, and disconnection step by step.
      </>,
    ],
  },
  {
    title: "Where your data is stored",
    paragraphs: [
      <>
        Omentir runs on Google Cloud in the us-central1 region, in Iowa, United
        States. The app server and the Firestore database are both there.
        Google encrypts Firestore data at rest by default, with AES-256.
      </>,
      <>
        We do not offer EU or other regional data hosting yet. If your company
        needs data to stay in a specific region, you can self-host Omentir on
        your own infrastructure.
      </>,
    ],
  },
  {
    title: "Who can reach the database",
    paragraphs: [
      <>
        Only Omentir&apos;s server. The database rules deny every read and write
        from a browser, and the server reaches Firestore with a Google service
        account. Each request works out the workspace from the signed-in user,
        and every query is limited to that workspace, so one customer cannot
        read another customer&apos;s data. Code:{" "}
        <a href="https://github.com/vanshyadav1408/Omentir/blob/main/firestore.rules" target="_blank" rel="noopener">firestore.rules</a>
        .
      </>,
    ],
  },
  {
    title: "Encryption in transit and browser protections",
    paragraphs: [
      <>
        omentir.com is served only over HTTPS, through Cloudflare. HSTS is set
        for one year with subdomains included, so browsers refuse plain HTTP.
        Our server&apos;s own calls to Google Cloud and to LinkedIn use TLS too.
      </>,
      <>
        Every page also sends a Content Security Policy that blocks framing by
        other sites, plugins, and form posts to other domains, plus
        X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy
        strict-origin-when-cross-origin, and a Permissions-Policy that turns
        off the camera, microphone, and location.
      </>,
    ],
  },
  {
    title: "Signing in to Omentir",
    paragraphs: [
      <>
        Clerk handles sign-in for Omentir accounts. Omentir never sees or stores
        your Omentir password. Every page and API route outside the public
        website requires a signed-in session.
      </>,
    ],
  },
  {
    title: "API tokens and webhooks",
    paragraphs: [
      <>
        Omentir stores only a SHA-256 hash of each API token. We show the token
        once when you create it and cannot show it again. You can revoke a token
        at any time from the API keys page.
      </>,
      <>
        Webhooks from Clerk and Whop are checked against their signatures before
        Omentir acts on them. A webhook that fails the check is rejected.
      </>,
    ],
  },
  {
    title: "Payments",
    paragraphs: [
      <>
        Whop runs checkout on its own hosted page. Your card details go to Whop,
        and Omentir never sees your card number.
      </>,
    ],
  },
  {
    title: "AI and your data",
    paragraphs: [
      <>
        Omentir uses Google&apos;s Gemini models through Vertex AI on Google
        Cloud, not a consumer chat app. Google&apos;s Cloud terms say it does not
        use customer data to train its models without permission. Omentir does
        not train any models on your data.
      </>,
      <>
        The AI reads your website, product notes, lead profiles, and
        conversation history so it can score leads and draft messages.
      </>,
    ],
  },
  {
    title: "What data Omentir keeps",
    paragraphs: [
      <>
        Omentir keeps what it needs to run your outreach: your workspace
        settings, your product description and target customer profile, the
        leads it finds, your campaigns, and the LinkedIn messages it sends and
        receives for you. The <Link href="/privacy-policy">Privacy Policy</Link>{" "}
        has the full list.
      </>,
    ],
  },
  {
    title: "Deleting your data",
    paragraphs: [
      <>
        Deleting a workspace removes its agents, leads, lead groups, campaigns,
        conversations, and API tokens from the database right away. To delete
        your whole account, email {email}.
      </>,
    ],
  },
  {
    title: "The code",
    paragraphs: [
      <>
        Omentir is open source under the MIT license, and the code on{" "}
        <a href="https://github.com/vanshyadav1408/Omentir" target="_blank" rel="noopener">GitHub</a>{" "}
        is the same code that deploys to omentir.com. Your team can read it, and
        you can run your own copy if you would rather keep everything on your
        own servers.
      </>,
      <>
        The repository has GitHub secret scanning with push protection, CodeQL
        code scanning, and Dependabot alerts turned on. The main branch cannot
        be force-pushed or deleted.
      </>,
    ],
  },
  {
    title: "Vendors that process your data",
    paragraphs: [
      <>
        These companies touch your data when you use the hosted version of
        Omentir. Self-hosting removes Clerk, Whop, and PostHog from the list,
        and you pick your own IP provider.
      </>,
      <>
        Google Cloud hosts the app server and database and runs the AI models.
        It holds all workspace data.
      </>,
      <>Clerk handles sign-in for Omentir accounts. It holds your name, email, and login sessions.</>,
      <>Whop runs checkout and billing. It holds your email and payment details.</>,
      <>Cloudflare serves omentir.com over HTTPS. It handles traffic in transit.</>,
      <>
        Byteful supplies the IP address each LinkedIn account connects through.
        It carries encrypted LinkedIn traffic and sees that it goes to
        linkedin.com, not what it says.
      </>,
      <>
        PostHog runs product analytics, session replays, and the support chat,
        hosted in the US. It receives page views, clicks, and replays of app
        sessions, with text typed into form fields masked.
      </>,
      <>Resend sends account emails, such as reply alerts. It receives your email address and the alert text.</>,
    ],
  },
  {
    title: "What we do not have yet",
    paragraphs: [
      <>
        We would rather you hear this from us than find out in review. Omentir
        does not yet have a SOC 2 or ISO 27001 report, EU data hosting, a
        published uptime SLA, or a standard data processing agreement. If your
        company needs any of these, email us and we will tell you what is
        possible and when.
      </>,
    ],
  },
  {
    title: "Security reviews and questionnaires",
    paragraphs: [
      <>
        Send your questionnaire to {email} and we will complete it. Everything
        on this page can be quoted in your review as is. This page is also
        available as plain text at{" "}
        <a href="https://omentir.com/security.md">omentir.com/security.md</a>, so
        you can forward it or attach it to a review.
      </>,
    ],
  },
  {
    title: "Reporting a vulnerability",
    paragraphs: [
      <>
        Email {email} with the steps to reproduce it. Please do not open a
        public GitHub issue, and do not include passwords, tokens, or customer
        data in the report.
      </>,
    ],
  },
  {
    title: "Who runs Omentir",
    paragraphs: [
      <>
        Omentir started in 2026 and is run from India by its founder, Vansh. The{" "}
        <Link href="/about">About page</Link> has the story. It is a small
        company, so when you email us you reach the person who wrote the code.
      </>,
    ],
  },
];

export default function SecurityPage() {
  const jsonLd = [
    createWebPageJsonLd({
      name: "Security",
      description,
      url: `${siteUrl}/security`,
      dateModified: updated,
    }),
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: "Security", url: `${siteUrl}/security` },
    ]),
  ];

  return (
    <>
      <JsonLd id="security-jsonld" data={jsonLd} />
      <LegalShell
        path="/security"
        title="Security"
        updated={updated}
        lede={
          <>
            How Omentir protects your LinkedIn login and your data. Omentir is
            open source, so where this page makes a technical claim, it links to
            the file in our public code that does the work. Your team can read
            it and check.
          </>
        }
        sections={sections}
      />
    </>
  );
}
