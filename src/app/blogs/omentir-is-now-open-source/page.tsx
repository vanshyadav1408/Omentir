import Link from "next/link";
import FaqAccordion from "../../faq-accordion";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";

export const metadata = createPageMetadata({
  title: "Omentir is now open source - Omentir",
  description:
    "Until today, Omentir's code was private. Now the full source code is public on GitHub under the MIT license. Here is why we did it and what it means for you.",
  path: "/blogs/omentir-is-now-open-source",
  keywords: [
    "Omentir open source",
    "open source AI sales agent",
    "open source LinkedIn outreach",
    "self-hosted sales automation",
    "MIT licensed SaaS",
  ],
});

const tocItems: { id: string; label: string; level: 1 | 2 }[] = [
  { id: "why", label: "Why We Did It", level: 1 },
  { id: "whats-in-the-repo", label: "What's in the Repo", level: 1 },
  { id: "self-hosting", label: "You Can Run It Yourself", level: 1 },
  { id: "what-stays-private", label: "What Stays Private", level: 1 },
  { id: "hosted-product", label: "Nothing Changes If You're a Customer", level: 1 },
  { id: "faqs", label: "Frequently Asked Questions", level: 1 },
];

const faqItems = [
  {
    question: "Is all of Omentir open source?",
    answer:
      "The application, AI drafting layer, automation scheduler, Agent API, MCP server, database rules, Docker setup, and marketing site are in the public repository. Credentials, customer data, private messages, and production logs are not.",
  },
  {
    question: "Which license does Omentir use?",
    answer:
      "Omentir uses the MIT license. You can read, modify, run, and build on the software. The Omentir name and logo are separate from the software license, so public forks should use their own branding.",
  },
  {
    question: "Can I run Omentir myself?",
    answer:
      "Yes. The supported self-hosted setup uses Docker and your own Firebase, Unipile, and Gemini or Vertex AI accounts. It is self-hostable, but it is not offline or free of external provider costs.",
  },
  {
    question: "Why is there still a paid version?",
    answer:
      "The managed version is for people who want Omentir without operating the infrastructure or configuring every provider. The subscription pays for that convenience, the connected services, and support. Both options use the same application code.",
  },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="Omentir is now open source"
      description="Until today, Omentir's code was private. Now the full source code is public on GitHub under the MIT license. Here is why we did it and what it means for you."
      slug="omentir-is-now-open-source"
      publishedDate="July 23, 2026"
      updatedDate="July 23, 2026"
      bannerSrc="/omentir-open-source-banner-dark.png"
      bannerAlt="Omentir open source announcement banner"
      tocItems={tocItems}
      faqItems={faqItems}
    >
      <a
        href="https://github.com/vanshyadav1408/Omentir"
        target="_blank"
        rel="noopener"
        className="blog-github-button inline-flex h-10 items-center rounded-md bg-black px-6 text-sm font-medium text-white no-underline transition-colors hover:bg-zinc-800"
      >
        View on GitHub
      </a>

      <p className="text-lg leading-8">
        Since day one, Omentir&apos;s code has been private. Today that
        changes. The full source code is now public on GitHub under the MIT
        license - the app, the AI layer, the automation engine, all of it.
      </p>
      <p>
        This is the same code that runs Omentir.com right now. Not a stripped
        down community edition. Not a demo. The actual product.
      </p>

      <h2
        id="why"
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-10 scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-2xl font-semibold tracking-tight text-black"
      >
        Why We Did It
      </h2>
      <p>
        One word: trust. Omentir connects to your LinkedIn account and sends
        messages on your behalf. That is a lot to ask. Your account, your
        reputation, your conversations - all in the hands of software you
        cannot see inside.
      </p>
      <p>
        We built safeguards from the start: daily limits, spacing between
        actions, dry-run mode, checks before anything gets sent. But until
        today, you just had to take our word for it. Now you don&apos;t. You
        can open the code and see exactly what happens before a message goes
        out.
      </p>
      <p>
        There is a second reason too. We are a small team. We miss things.
        With the code public, anyone can report a bug, suggest a better
        approach, or send a fix. That makes the product better for everyone.
      </p>

      <h2
        id="whats-in-the-repo"
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-10 scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-2xl font-semibold tracking-tight text-black"
      >
        What&apos;s in the Repo
      </h2>
      <p>Everything that makes Omentir work:</p>
      <ul className="list-disc space-y-2 pl-6">
        <li>Lead discovery and scoring</li>
        <li>Campaigns and AI message drafting</li>
        <li>Reply handling and the automation scheduler</li>
        <li>The Agent API and MCP server</li>
        <li>Docker setup, database rules, and example configuration</li>
        <li>Even this marketing site and the docs</li>
      </ul>
      <p>
        The hosted product and the open-source version share the same
        codebase. When we ship an improvement to one, the other gets it too.
      </p>

      <h2
        id="self-hosting"
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-10 scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-2xl font-semibold tracking-tight text-black"
      >
        You Can Run It Yourself
      </h2>
      <p>
        If you would rather run Omentir on your own infrastructure, you can.
        The repo ships with a Docker setup, and you bring your own Firebase
        project, Unipile account, and Gemini or Vertex AI credentials.
      </p>
      <p>
        One honest note: self-hosted does not mean free or offline. The
        external providers still do real work and may charge for it, and you
        take on updates, backups, and configuration yourself. But the option
        is there, and it does not depend on us.
      </p>
      <p>
        The defaults are cautious on purpose. The server binds to your local
        machine, a password is required, and live automation stays off until
        you turn it on - so you can try everything in dry-run mode before a
        single real message is sent.
      </p>

      <h2
        id="what-stays-private"
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-10 scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-2xl font-semibold tracking-tight text-black"
      >
        What Stays Private
      </h2>
      <p>
        Open source means the software is public, not the people using it.
        Customer data, credentials, API keys, private LinkedIn conversations,
        and production logs were never in the code and never will be.
      </p>
      <p>
        The Omentir name and logo are also separate from the MIT license. Use
        the code, modify it, build on it - commercially too. Just give your
        fork its own name.
      </p>

      <h2
        id="hosted-product"
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-10 scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-2xl font-semibold tracking-tight text-black"
      >
        Nothing Changes If You&apos;re a Customer
      </h2>
      <p>
        Omentir.com keeps running exactly as before. The subscription pays for
        the infrastructure, the AI usage, and support - so you get Omentir
        without setting up servers or juggling provider accounts.
      </p>
      <p>
        The only difference is that now you can see what you are paying for,
        down to the last line of code.
      </p>
      <p>
        If you are curious, go read the README. If something is confusing,
        open an issue. And if you just want outreach that works without the
        setup, the hosted product is right here.
      </p>
      <div className="my-10 flex flex-wrap gap-3">
        <a
          href="https://github.com/vanshyadav1408/Omentir"
          target="_blank"
          rel="noopener"
          className="blog-github-button inline-flex h-11 items-center justify-center rounded-md bg-black px-5 text-sm font-semibold text-white no-underline transition hover:bg-zinc-800"
        >
          View on GitHub
        </a>
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--md-sys-color-outline)] px-5 text-sm font-semibold text-[var(--md-sys-color-on-surface)] no-underline transition hover:bg-[var(--md-sys-state-hover)]"
        >
          Use the hosted product
        </Link>
      </div>

      <h2
        id="faqs"
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-10 scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-2xl font-semibold tracking-tight text-black"
      >
        Frequently Asked Questions
      </h2>
      <FaqAccordion items={faqItems} />
    </BlogPostTemplate>
  );
}
