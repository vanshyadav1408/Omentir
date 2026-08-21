import Image from "next/image";
import JsonLd from "../json-ld";
import { MarketingArticle } from "../marketing-shell";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  founderJsonLd,
  organizationJsonLd,
  siteUrl,
} from "../seo";

export const metadata = createPageMetadata({
  title: "About - Omentir",
  description:
    "Learn why Omentir was built and how it helps founders, SDRs, and small sales teams find buyers and run LinkedIn campaigns.",
  path: "/about",
  keywords: ["about Omentir", "AI sales tool founder story"],
});

export default function AboutPage() {
  const jsonLd = [
    organizationJsonLd,
    founderJsonLd,
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "@id": `${siteUrl}/about#about-page`,
      name: "About Omentir",
      description:
        "Learn why Omentir was built and how it helps founders, SDRs, and small sales teams find buyers and run LinkedIn campaigns.",
      url: `${siteUrl}/about`,
      mainEntity: {
        "@id": `${siteUrl}/#organization`,
      },
    },
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      { name: "About", url: `${siteUrl}/about` },
    ]),
  ];

  return (
    <>
      <JsonLd id="about-jsonld" data={jsonLd} />
      <MarketingArticle
        path="about"
        title="We are building AI agents for sales and marketing."
        description="Omentir helps founders, SDRs, and small sales teams find potential buyers, organize them into groups, and run LinkedIn campaigns from their own account."
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--md-sys-color-primary)] text-lg font-bold text-[var(--md-sys-color-on-primary)]">
            <Image
              src="/founder.jpg"
              alt="Vansh, founder of Omentir"
              width={128}
              height={128}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2
              style={{ fontFamily: "var(--font-varta)" }}
              className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]"
            >
              heyo! it&apos;s Vansh
            </h2>
            <p className="mt-0.5 text-sm text-[var(--md-sys-color-on-surface-variant)]">
              (the guy who built Omentir)
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-6 text-base font-medium leading-8 text-[var(--md-sys-color-on-surface)]">
          <p>
            After a 15-week solo trip in the mountains, I dropped out of my{" "}
            <span className="font-bold">IITB</span> degree and started building my own app. I shipped
            an <span className="font-bold">AI video editor</span> I thought people would love. It did
            not get many users.
          </p>
          <p>
            So one random afternoon, out of pure frustration, I started{" "}
            <span className="font-bold">manually messaging people on LinkedIn</span>.
          </p>
          <p>
            That day, I <span className="font-bold">booked two deals</span> through LinkedIn DMs for a
            product I was about to give up on.
          </p>
          <p>
            I started automating the motion that worked: find intent, message from your own account,
            and follow up until someone replies.
          </p>
          <p>
            I later killed the video editor, but kept the automation. I added Opus 4.5 and tested the
            motion with other business owners. It worked well enough that they booked three to four
            demos per week on average.
          </p>
          <p>
            I turned that internal tool into a product called{" "}
            <span style={{ fontFamily: "var(--font-varta)" }} className="select-none font-bold">
              Omentir
            </span>
            {". In Quenya, the name means "}
            <span className="font-bold">to contact</span>.
          </p>
          <p>
            Omentir was closed source until recently. The entire code is now{" "}
            <a
              href="https://github.com/vanshyadav1408/Omentir"
              target="_blank"
              rel="noopener"
              className="font-medium text-[var(--md-sys-color-primary)] underline decoration-[var(--md-sys-color-primary)]/30 underline-offset-4 hover:text-[var(--md-sys-color-on-surface)]"
            >
              open source on GitHub
            </a>
            , so you can read what runs your outreach.
          </p>
        </div>
      </MarketingArticle>
    </>
  );
}
