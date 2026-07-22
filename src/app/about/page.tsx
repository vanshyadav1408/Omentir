import Link from "next/link";
import JsonLd from "../json-ld";
import { MarketingPage } from "../marketing-shell";
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
      <MarketingPage
        eyebrow="Company"
        title="We are building AI agents for sales & marketing."
        titleStyle={{ fontFamily: "var(--font-varta)" }}
        description="Omentir helps founders, SDRs, and small sales teams find potential buyers, organize them into groups, and run LinkedIn campaigns from their own account."
        centeredHeader
      >
        <div className="mx-auto max-w-3xl py-8 sm:py-12">
          <div className="rounded-[1.4rem] border-2 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] px-6 py-10 shadow-[var(--md-sys-elevation-2)] sm:px-12 sm:py-14">
            <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--md-sys-color-surface-container)] bg-[var(--md-sys-color-primary)] text-2xl font-bold text-[var(--md-sys-color-on-primary)] shadow-[var(--md-sys-elevation-1)]">
              <object
                data="/founder.jpg"
                type="image/jpeg"
                aria-label="Vansh, founder of Omentir"
                className="h-full w-full object-cover"
              >
                <span className="flex h-full w-full items-center justify-center">VY</span>
              </object>
            </div>

            <h2
              style={{ fontFamily: "var(--font-varta)" }}
              className="mt-6 text-center text-4xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-5xl"
            >
              heyo! it&apos;s{" "}
              <span className="text-[var(--md-sys-color-primary)]">Vansh</span>
            </h2>
            <p className="mt-2 text-center text-sm font-medium text-[var(--md-sys-color-on-surface-variant)]">
              (the guy who built Omentir)
            </p>

            <div className="mx-auto mt-10 max-w-xl space-y-6 text-base font-medium leading-8 text-[var(--md-sys-color-on-surface)]">
              <p>
                After my 15 weeks long solo trip in the mountains out of an
                existential crisis, I dropped my{" "}
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">IITB</span> degree and
                started working on my own app. I shipped an{" "}
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">AI video editor</span>{" "}
                I was convinced people would love. Then reality hit. I couldn&apos;t
                get much users.
              </p>

              <p>
                So one random afternoon, out of pure frustration, I started{" "}
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                  manually messaging people on LinkedIn
                </span>
                .
              </p>

              <p>
                Somehow, that day, I{" "}
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">booked 2 deals</span>.
                From <span className="font-semibold">LinkedIn DMs</span>. For a product
                I was about to give up on.
              </p>

              <p>
                Then, I started automating the exact motion that worked: find intent,
                message from your own account, follow up until someone replies.
              </p>

              <p>
                I later killed the video editor. It was never going to work. But I
                kept the automation alive, added some opus 4.5 on top of that and
                this time, I dmed other business owners to try, it kinda worked, they
                were booking 3-4 demos per week on average only because of it.
              </p>

              <p>
                Now, I present a more refined version of the sales tool I built
                for myself, and I call it{" "}
                <span
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="select-none font-bold text-[var(--md-sys-color-on-surface)]"
                >
                  Omentir
                </span>
                {", because in Quenya, it means "}
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">to contact</span>.
              </p>

              <p className="pt-2 text-center">
                If you&apos;re where I was a few months ago, you can{" "}
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">Try Omentir</span>{" "}
                from the button below.
              </p>
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                href="/signup"
                className="inline-flex h-10 cursor-pointer items-center rounded-md bg-black px-6 text-sm font-medium text-white"
              >
                Try Omentir
              </Link>
            </div>
          </div>
        </div>
      </MarketingPage>
    </>
  );
}
