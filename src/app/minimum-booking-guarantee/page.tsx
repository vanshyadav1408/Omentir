import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "../json-ld";
import { MarketingPage } from "../marketing-shell";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  createWebPageJsonLd,
  siteUrl,
} from "../seo";
import { minimumBookingGuaranteeStatement } from "../minimum-booking-guarantee-link";

export const metadata = createPageMetadata({
  title: "Minimum Booking Guarantee - Omentir",
  description:
    "Read the eligibility requirements, two-week warm-up period, weekly measurement, and refund process for Omentir's Minimum Booking Guarantee.",
  path: "/minimum-booking-guarantee",
  keywords: [
    "Omentir booking guarantee",
    "Omentir refund policy",
    "Omentir minimum bookings",
  ],
});

const policySections: Array<{ title: string; paragraphs: ReactNode[] }> = [
  {
    title: "1. Overview",
    paragraphs: [
      <>
        Omentir offers the Minimum Booking Guarantee to give eligible customers a
        clear outcome standard for an active outbound motion. The guarantee is
        simple: after the warm-up period and during a completed eligible week,
        your workspace should receive at least three qualifying bookings.
      </>,
      <>
        If an eligible workspace receives fewer than three qualifying bookings
        during that completed week, the customer may apply for a full refund in
        accordance with this policy. This page explains how Omentir measures the
        result, what an active agent means, how a booking is counted, and how to
        submit a request.
      </>,
    ],
  },
  {
    title: "2. Two-week warm-up period",
    paragraphs: [
      <>
        Every workspace begins with a two-week warm-up period. The warm-up starts
        on the first calendar day that the workspace has at least one active
        Omentir agent configured to run an active outreach motion. The warm-up
        lasts for 14 consecutive calendar days.
      </>,
      <>
        No booking guarantee applies during the two-week warm-up period. This
        period allows the workspace to connect the right account, establish the
        campaign, validate the targeting and offer, and begin outreach at an
        appropriate pace. Bookings received during warm-up remain visible in your
        product reporting, but they do not create an entitlement under this
        policy.
      </>,
    ],
  },
  {
    title: "3. Eligibility requirements",
    paragraphs: [
      <>
        To be eligible for a weekly guarantee review, the workspace must have an
        active paid Omentir subscription in good standing, and at least one agent
        must remain active for the entire seven-day measurement week. An agent is
        not considered active if it is paused, deleted, disconnected from its
        required LinkedIn account, or otherwise unable to operate for a material
        part of that week.
      </>,
      <>
        The workspace must also keep its connected account, campaign setup,
        booking destination, and access to Omentir in working order. Customers
        must use the product in accordance with the Terms of Service, applicable
        law, and third-party platform rules. A workspace subject to a payment
        dispute, fraud review, account suspension, or material misuse review is
        not eligible while that issue remains unresolved.
      </>,
    ],
  },
  {
    title: "4. What counts as a qualifying booking",
    paragraphs: [
      <>
        A qualifying booking is a new sales conversation scheduled by a prospect
        who was reached through an active Omentir outreach motion and whose
        booking can be attributed to that motion through Omentir records or
        reasonable supporting evidence. The booking must be for a genuine
        prospective customer and not a test, duplicate, internal meeting, or a
        meeting scheduled by the customer or someone acting on the customer's
        behalf.
      </>,
      <>
        The same prospect is counted once for the applicable measurement week,
        even if the meeting is moved or rebooked. Omentir may rely on available
        campaign, conversation, booking-link, and calendar evidence to verify
        attribution. Where the records are incomplete, Omentir may ask the
        customer for reasonable documentation before completing a review.
      </>,
    ],
  },
  {
    title: "5. Weekly measurement",
    paragraphs: [
      <>
        After the warm-up period, Omentir measures completed seven-day periods
        using the workspace time zone recorded in the product. A week is eligible
        only when the active-agent requirement has been satisfied from the first
        day through the last day of that period. The guarantee applies to the
        workspace as a whole, not separately to every agent or LinkedIn account.
      </>,
      <>
        Omentir counts qualifying bookings recorded during the completed week. If
        the total is three or more, the guarantee has been met for that week. If
        the total is fewer than three and all eligibility requirements are met,
        the customer may submit a refund request under the process below.
      </>,
    ],
  },
  {
    title: "6. Refund entitlement",
    paragraphs: [
      <>
        For an approved claim, Omentir will issue a full refund of the applicable
        current subscription charge paid by the customer for the billing period
        that contains the eligible missed week. This is the meaning of "you pay
        nothing" in the Minimum Booking Guarantee.
      </>,
      <>
        Enterprise customers are covered by the same booking standard unless a
        signed order form or other written enterprise agreement states different
        terms. Where a signed enterprise agreement specifies a different billing
        schedule or refund amount, that written agreement controls for the
        enterprise customer.
      </>,
    ],
  },
  {
    title: "7. How to apply for a refund",
    paragraphs: [
      <>
        Submit your request within 14 calendar days after the eligible week ends.
        Email hi@omentir.com or use an available support channel and include the
        email address used for purchase, workspace name, the seven-day period you
        want reviewed, the active agent name, and the booking records you believe
        are relevant. Clear information helps us verify a request quickly.
      </>,
      <>
        You do not need to cancel your subscription before submitting a request.
        However, a cancellation, account disconnection, or extended agent pause
        before the end of the measurement week can affect eligibility for that
        week. If you decide to cancel, export any information you need before
        access changes.
      </>,
    ],
  },
  {
    title: "8. Review and payment process",
    paragraphs: [
      <>
        Omentir will review the workspace subscription status, warm-up dates,
        agent activity, connected-account status, campaign records, and
        qualifying booking count. We may request clarification or supporting
        records if the available information does not establish eligibility. We
        will use reasonable good-faith judgment when reviewing the evidence.
      </>,
      <>
        Approved refunds are generally returned to the original payment method.
        Processing times depend on the payment provider, card network, and bank.
        A refund may end or reduce access to paid product features, support,
        automations, stored outputs, and connected-account workflows associated
        with the refunded subscription charge.
      </>,
    ],
  },
  {
    title: "9. Circumstances that are not eligible",
    paragraphs: [
      <>
        The guarantee does not apply to a week that has not been completed, a
        workspace that is still in the warm-up period, or a workspace without at
        least one active agent for the entire week. It also does not apply where
        the customer pauses the motion, removes required access, supplies a
        nonfunctional booking destination, or prevents Omentir from reasonably
        measuring the result.
      </>,
      <>
        Omentir may deny a request involving fraud, misuse, duplicate claims,
        chargebacks, a previously refunded subscription charge, a material breach
        of the Terms of Service, or deliberately manipulated booking records.
        Third-party platform restrictions, provider outages, or account actions
        will be reviewed against the available records and the specific facts of
        the customer’s workspace.
      </>,
    ],
  },
  {
    title: "10. Relationship to other terms",
    paragraphs: [
      <>
        This policy is part of the public terms for the Minimum Booking
        Guarantee. It supplements the{" "}
        <Link
          href="/terms-of-service"
          className="font-medium text-[var(--md-sys-color-primary)] underline underline-offset-4"
        >
          Terms of Service
        </Link>
        . If there is a conflict between the standard refund language in the
        Terms of Service and an approved eligible claim under this policy, this
        policy controls for that claim.
      </>,
      <>
        Omentir may update this policy prospectively as the product, billing
        model, or relevant operating requirements change. The version available
        on this page when a customer starts an eligible measurement week will
        govern that week, unless a signed enterprise agreement provides otherwise.
      </>,
    ],
  },
];

export default function MinimumBookingGuaranteePage() {
  const jsonLd = [
    createWebPageJsonLd({
      name: "Minimum Booking Guarantee",
      description:
        "The eligibility, warm-up, weekly measurement, and refund terms behind Omentir's booking guarantee.",
      url: `${siteUrl}/minimum-booking-guarantee`,
      dateModified: "August 9, 2026",
    }),
    createBreadcrumbJsonLd([
      { name: "Home", url: siteUrl },
      {
        name: "Minimum Booking Guarantee",
        url: `${siteUrl}/minimum-booking-guarantee`,
      },
    ]),
  ];

  return (
    <>
      <JsonLd id="minimum-booking-guarantee-jsonld" data={jsonLd} />
      <MarketingPage
        eyebrow="Policy"
        title="Minimum Booking Guarantee"
        description="The eligibility, warm-up, weekly measurement, and refund terms behind Omentir's booking guarantee."
        contentClassName="max-w-4xl"
      >
        <article className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-5 sm:p-8">
          <div className="rounded-xl border border-[#ba3871] bg-[color-mix(in_srgb,#ba3871_12%,var(--md-sys-color-surface-container-high))] p-5">
            <p className="text-lg font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
              {minimumBookingGuaranteeStatement}
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
              <li>The two-week warm-up period must be complete.</li>
              <li>At least one agent must remain active for the full week.</li>
              <li>If there are fewer than three qualifying bookings, you may apply for a full refund.</li>
            </ul>
          </div>

          <p className="mt-6 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Last updated: August 9, 2026
          </p>

          <div className="mt-8 space-y-9">
            {policySections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-2xl">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-4 text-base leading-7 text-[var(--md-sys-color-on-surface-variant)]">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </MarketingPage>
    </>
  );
}
