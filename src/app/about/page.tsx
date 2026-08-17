import Image from "next/image";
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
        title="We are building AI agents for sales and marketing."
        description="Omentir helps founders, SDRs, and small sales teams find potential buyers, organize them into groups, and run LinkedIn campaigns from their own account."
        centeredHeader
      >
        <div className="mx-auto max-w-3xl py-8 sm:py-12">
          <div className="rounded-[1.4rem] border-2 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] px-6 py-10 shadow-[var(--md-sys-elevation-2)] sm:px-12 sm:py-14">
            {/* A real <img>, not <object>: the app's CSP sends
                object-src 'none', so the photo never loaded and every visitor
                saw the "VY" fallback initials instead. */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--md-sys-color-surface-container)] bg-[var(--md-sys-color-primary)] text-2xl font-bold text-[var(--md-sys-color-on-primary)] shadow-[var(--md-sys-elevation-1)]">
              <Image
                src="/founder.jpg"
                alt="Vansh, founder of Omentir"
                width={192}
                height={192}
                priority
                className="h-full w-full object-cover"
              />
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
                After a 15-week solo trip in the mountains, I dropped out of my{" "}
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">IITB</span> degree and
                started building my own app. I shipped an{" "}
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">AI video editor</span>{" "}
                I thought people would love. It did not get many users.
              </p>

              <p>
                So one random afternoon, out of pure frustration, I started{" "}
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                  manually messaging people on LinkedIn
                </span>
                .
              </p>

              <p>
                That day, I{" "}
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">booked two deals</span>{" "}
                through <span className="font-semibold">LinkedIn DMs</span> for a product I was about to give up on.
              </p>

              <p>
                I started automating the motion that worked: find intent, message from
                your own account, and follow up until someone replies.
              </p>

              <p>
                I later killed the video editor, but kept the automation. I added Opus
                4.5 and tested the motion with other business owners. It worked well
                enough that they booked three to four demos per week on average.
              </p>

              <p>
                I turned that internal tool into a product called{" "}
                <span
                  style={{ fontFamily: "var(--font-varta)" }}
                  className="select-none font-bold text-[var(--md-sys-color-on-surface)]"
                >
                  Omentir
                </span>
                {". In Quenya, the name means "}
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">to contact</span>.
              </p>

              <p>
                Omentir was closed source until recently. The entire code is now{" "}
                <a
                  href="https://github.com/vanshyadav1408/Omentir"
                  target="_blank"
                  rel="noopener"
                  className="font-bold text-[var(--md-sys-color-on-surface)] underline underline-offset-4"
                >
                  open source on GitHub
                </a>
                , so you can read what runs your outreach.
              </p>

              <p className="pt-2 text-center">
                If you are in that same early stage, try Omentir from the button below.
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
