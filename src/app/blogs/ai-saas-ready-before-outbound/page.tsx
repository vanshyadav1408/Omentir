import Link from "next/link";
import type { ReactNode } from "react";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";

export const metadata = createPageMetadata({
  title: "AI Tools to Use Before You Start Outbound | Omentir",
  description:
    "A simple list of AI tools to use while you build a SaaS: coding, code review, landing pages, App Store screenshots, payments, and analytics, before you start outbound.",
  path: "/blogs/ai-saas-ready-before-outbound",
  image: {
    url: "/ai-saas-ready-before-outbound-v3.avif",
    width: 1774,
    height: 887,
    alt: "Minimal dark editorial cover reading Before You Scale Outbound",
  },
  keywords: [
    "AI tools for SaaS",
    "tools before outbound",
    "AI coding tools",
    "SaaS launch tools",
    "critique.sh",
    "AppGrowthKit",
    "appgrowthkit.com",
    "App Store screenshots",
    "independent code review",
  ],
});

const critiqueUrl = "https://critique.sh/";
const appGrowthKitUrl = "https://appgrowthkit.com";

const tocItems = [
  { id: "the-list", label: "The short list", level: 1 },
  { id: "build", label: "Build the product", level: 1 },
  { id: "review", label: "Review the code", level: 1 },
  { id: "landing", label: "Landing page and copy", level: 1 },
  { id: "brand", label: "Logo and visuals", level: 1 },
  { id: "store", label: "App Store and Play Store screenshots", level: 1 },
  { id: "payments", label: "Payments and analytics", level: 1 },
  { id: "support", label: "Support and docs", level: 1 },
  { id: "outbound", label: "Then start outbound", level: 1 },
  { id: "faqs", label: "Frequently asked questions", level: 1 },
] as const;

const faqItems = [
  {
    question: "Do I need every tool on this list before I start outbound?",
    answer:
      "No. Use the ones that match what you are shipping. A web SaaS needs a working product, a way to take money, and a landing page. A mobile app also needs store screenshots. Code review is worth doing either way.",
  },
  {
    question: "What should I use to review AI-written code?",
    answer:
      "Use a reviewer that did not write the code. Critique is a local CLI that checks the change on your machine and returns evidence. Asking the same coding agent \"does this look good?\" is not a second opinion.",
  },
  {
    question: "What should I use for App Store and Google Play screenshots?",
    answer:
      "AppGrowthKit at appgrowthkit.com. Upload your raw app screens, add device frames and headlines, and export the sizes Apple and Google ask for. That is the listing people see before they install.",
  },
  {
    question: "When should I start outbound?",
    answer:
      "When a new person can sign up, reach the main result, and pay if you charge. You do not need a perfect product. You do need something a stranger can use without you sitting next to them.",
  },
  {
    question: "Can I start outbound while the product is still an MVP?",
    answer:
      "Yes, if you are honest about what works. A small batch of design partners is fine. A large campaign that promises self-serve onboarding is not, until that path actually works.",
  },
] as const;

const sectionClassName =
  "mt-10 scroll-mt-28 border-b border-[var(--md-sys-color-outline-variant)] pb-2 pt-2 text-2xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]";

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
      {children}
    </a>
  );
}

const tools: ReadonlyArray<{
  job: string;
  items: ReadonlyArray<{ name: string; href: string }>;
}> = [
  {
    job: "Build the product",
    items: [
      { name: "Cursor", href: "https://cursor.com" },
      { name: "Claude Code", href: "https://claude.com/product/claude-code" },
    ],
  },
  { job: "Review the code", items: [{ name: "Critique", href: critiqueUrl }] },
  { job: "Landing page", items: [{ name: "v0", href: "https://v0.app" }] },
  {
    job: "Copy",
    items: [
      { name: "Claude", href: "https://claude.ai" },
      { name: "ChatGPT", href: "https://chatgpt.com" },
    ],
  },
  {
    job: "Logo and visuals",
    items: [
      { name: "Recraft", href: "https://www.recraft.ai" },
      { name: "Ideogram", href: "https://ideogram.ai" },
    ],
  },
  { job: "Store screenshots", items: [{ name: "AppGrowthKit", href: appGrowthKitUrl }] },
  { job: "Payments", items: [{ name: "Stripe", href: "https://stripe.com" }] },
  { job: "Analytics", items: [{ name: "PostHog", href: "https://posthog.com" }] },
  { job: "Support", items: [{ name: "Crisp", href: "https://crisp.chat" }] },
  { job: "Docs", items: [{ name: "Mintlify", href: "https://mintlify.com" }] },
];

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="AI Tools to Use Before You Start Outbound"
      description="A simple list of AI tools to use while you build a SaaS: coding, code review, landing pages, App Store screenshots, payments, and analytics, before you start outbound."
      slug="ai-saas-ready-before-outbound"
      bannerSrc="/ai-saas-ready-before-outbound-v3.avif"
      bannerAlt="Minimal dark editorial cover reading Before You Scale Outbound"
      tocItems={tocItems}
      faqItems={faqItems}
      visibleFaqItems={[
        faqItems[0],
        {
          question: faqItems[1].question,
          answer: (
            <>
              Use a reviewer that did not write the code.{" "}
              <ExternalLink href={critiqueUrl}>Critique</ExternalLink> at{" "}
              <ExternalLink href={critiqueUrl}>critique.sh</ExternalLink> is a
              local CLI that checks the change on your machine and returns
              evidence. Asking the same coding agent &quot;does this look
              good?&quot; is not a second opinion.
            </>
          ),
        },
        {
          question: faqItems[2].question,
          answer: (
            <>
              <ExternalLink href={appGrowthKitUrl}>AppGrowthKit</ExternalLink> at{" "}
              <ExternalLink href={appGrowthKitUrl}>appgrowthkit.com</ExternalLink>
              . Upload your raw app screens, add device frames and headlines, and
              export the sizes Apple and Google ask for. That is the listing
              people see before they install.
            </>
          ),
        },
        faqItems[3],
        faqItems[4],
      ]}
    >
      <p id="the-list" className="scroll-mt-28">
        Building a SaaS is faster than it used to be. A coding agent can get you a working product in days. The part people skip is everything around that product: a second look at the code, a landing page, store screenshots if you have an app, payments, and a way to see what users do.
      </p>
      <p>
        This is a short list of tools I would use while building, before I start outbound. It is not a framework. Pick what matches the product you are shipping.
      </p>

      <div className="not-prose my-8 overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)]">
        {tools.map((row, index) => (
          <div
            key={row.job}
            className={`grid gap-1 bg-[var(--md-sys-color-surface-container-low)] p-4 sm:grid-cols-[200px_1fr] sm:items-center sm:gap-6 ${index > 0 ? "border-t border-[var(--md-sys-color-outline-variant)]" : ""}`}
          >
            <p className="m-0 text-sm font-semibold text-[var(--md-sys-color-on-surface)]">{row.job}</p>
            <p className="m-0 text-sm text-[var(--md-sys-color-on-surface-variant)]">
              {row.items.map((item, itemIndex) => (
                <span key={item.href}>
                  {itemIndex > 0 ? " or " : null}
                  <a href={item.href} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                    {item.name}
                  </a>
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      <h2 id="build" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Build the product
      </h2>
      <p>
        Use a coding agent to write the first version.{" "}
        <ExternalLink href="https://cursor.com">Cursor</ExternalLink> (
        <ExternalLink href="https://cursor.com">cursor.com</ExternalLink>) is the one I open first: the agent lives in the editor, so you can ship the signup path without leaving the repo.{" "}
        <ExternalLink href="https://claude.com/product/claude-code">Claude Code</ExternalLink> (
        <ExternalLink href="https://claude.com/product/claude-code">claude.com/product/claude-code</ExternalLink>) is the better pick when you want that same agent in the terminal.
      </p>
      <p>
        For screens and landing pages, use{" "}
        <ExternalLink href="https://v0.app">v0</ExternalLink> at{" "}
        <ExternalLink href="https://v0.app">v0.app</ExternalLink>. Generate a UI, drop it into the repo, then keep going in the coding agent. Point all three at one job: a new user can sign up and reach the main result.
      </p>
      <p>
        The product does not need every feature. It needs one path that works for a stranger.
      </p>

      <h2 id="review" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Review the code
      </h2>
      <p>
        The agent that wrote the change should not be the only thing that checks it. It will tell you the patch looks good. That is the writer grading its own homework.
      </p>
      <p>
        Use{" "}
        <ExternalLink href={critiqueUrl}>Critique</ExternalLink> at{" "}
        <ExternalLink href={critiqueUrl}>critique.sh</ExternalLink>. It is an independent code-review CLI. It reviews the code on your machine before you commit, including staged and unstaged changes. Your coding agent stays in the lead. Critique reconstructs the change and comes back with evidence, not a vibe.
      </p>
      <p>
        Install it, connect it to the agents you already use, and run a finish pass against the thing you are about to sell:
      </p>
      <div className="not-prose my-8 overflow-x-auto rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-5">
        <pre className="m-0 text-sm leading-7 text-[var(--md-sys-color-on-surface)]">
          <code>{`npm install --global @critiquedotsh/cli

critique login
critique integrate --agent all
critique finish --intent "A new user can sign up, pay once, and reach the core result" --repair pack --json`}</code>
        </pre>
      </div>
      <p>
        You do not need a long review ritual. You need a second opinion on auth, billing, and anything that can run twice. Start at{" "}
        <ExternalLink href={critiqueUrl}>critique.sh</ExternalLink>.
      </p>

      <h2 id="landing" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Landing page and copy
      </h2>
      <p>
        Before outbound, you need a page that states who the product is for and what happens after they sign up.{" "}
        <ExternalLink href="https://v0.app">v0</ExternalLink> at{" "}
        <ExternalLink href="https://v0.app">v0.app</ExternalLink> can draft that page. For the words on it, use{" "}
        <ExternalLink href="https://claude.ai">Claude</ExternalLink> (
        <ExternalLink href="https://claude.ai">claude.ai</ExternalLink>) or{" "}
        <ExternalLink href="https://chatgpt.com">ChatGPT</ExternalLink> (
        <ExternalLink href="https://chatgpt.com">chatgpt.com</ExternalLink>). Both are good. Pick the one you already have open.
      </p>
      <p>Keep the page to a few things:</p>
      <ul className="list-disc space-y-2 pl-6 text-[var(--md-sys-color-on-surface)]">
        <li>Who it is for.</li>
        <li>The result they get.</li>
        <li>One screenshot or short demo.</li>
        <li>A signup or waitlist button.</li>
      </ul>
      <p>
        Do not write a novel. The page should match the promise you will use in outreach. If the page says &quot;start in two minutes&quot; and setup takes an hour of your help, change the page.
      </p>

      <h2 id="brand" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Logo and visuals
      </h2>
      <p>
        You do not need a brand agency.{" "}
        <ExternalLink href="https://www.recraft.ai">Recraft</ExternalLink> at{" "}
        <ExternalLink href="https://www.recraft.ai">recraft.ai</ExternalLink> is the one I would use for a simple logo, icons, and the images on the landing page.{" "}
        <ExternalLink href="https://ideogram.ai">Ideogram</ExternalLink> at{" "}
        <ExternalLink href="https://ideogram.ai">ideogram.ai</ExternalLink> is the backup when you need text inside an image to stay readable.
      </p>
      <p>
        Pick one typeface, one accent color, and reuse them. That is enough for a first version.
      </p>

      <h2 id="store" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        App Store and Play Store screenshots
      </h2>
      <p>
        If you are shipping a mobile app, the store listing is the first product page most people see. Apple and Google want screenshots at specific sizes. Building those by hand in Figma is a waste of a week.
      </p>
      <p>
        Use{" "}
        <ExternalLink href={appGrowthKitUrl}>AppGrowthKit</ExternalLink> at{" "}
        <ExternalLink href={appGrowthKitUrl}>appgrowthkit.com</ExternalLink>. Upload your raw app screens, drop them into device frames, add headlines, and export the sizes the App Store and Google Play ask for.
      </p>
      <p>
        You still need real screens from the app. AppGrowthKit is for turning those screens into a listing, not for inventing a product you do not have.
      </p>

      <h2 id="payments" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Payments and analytics
      </h2>
      <p>
        Take money with{" "}
        <ExternalLink href="https://stripe.com">Stripe</ExternalLink> at{" "}
        <ExternalLink href="https://stripe.com">stripe.com</ExternalLink>. It is the default for a reason: checkout, subscriptions, customer portal, and failed-card emails are already there. Test a real card, a failed card, and a cancel before you invite anyone.
      </p>
      <p>
        Watch what users do with{" "}
        <ExternalLink href="https://posthog.com">PostHog</ExternalLink> at{" "}
        <ExternalLink href="https://posthog.com">posthog.com</ExternalLink>. You want to know whether someone signed up, reached the main result, and came back. If you cannot see that, outbound will feel like guesswork.
      </p>
      <p>
        You do not need a big dashboard. Three events are enough at the start: signed up, reached the core result, paid.
      </p>

      <h2 id="support" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Support and docs
      </h2>
      <p>
        Put a chat widget on the app with{" "}
        <ExternalLink href="https://crisp.chat">Crisp</ExternalLink> at{" "}
        <ExternalLink href="https://crisp.chat">crisp.chat</ExternalLink> so the first users can reach you. For docs, use{" "}
        <ExternalLink href="https://mintlify.com">Mintlify</ExternalLink> at{" "}
        <ExternalLink href="https://mintlify.com">mintlify.com</ExternalLink>: a short getting-started page, how to connect the one integration you need, and how billing works.
      </p>
      <p>
        Early support is just you answering quickly. The tool only has to make that easy.
      </p>

      <h2 id="outbound" style={{ fontFamily: "var(--font-varta)" }} className={sectionClassName}>
        Then start outbound
      </h2>
      <p>
        Once a new person can use the product, talk to a small group. One customer type, one promise, a batch small enough that you can read every reply.
      </p>
      <p>
        If you need help finding that first group, read{" "}
        <Link href="/blogs/finding-early-adopters-outbound" className="text-blue-600 hover:underline">
          finding early adopters through outbound
        </Link>
        . If the product is still an MVP, pair it with{" "}
        <Link href="/blogs/validate-mvp-via-cold-outreach" className="text-blue-600 hover:underline">
          using cold outreach to validate an MVP
        </Link>
        .
      </p>
      <p>
        When you are ready to run the batch, use{" "}
        <ExternalLink href="https://omentir.com">Omentir</ExternalLink> at{" "}
        <ExternalLink href="https://omentir.com">omentir.com</ExternalLink>. It finds a focused LinkedIn audience, writes the first messages, and keeps replies in one place. Keep the volume low until the product and the message both survive a real customer.
      </p>
    </BlogPostTemplate>
  );
}
