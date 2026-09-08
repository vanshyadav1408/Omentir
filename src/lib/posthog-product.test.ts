import { describe, expect, test } from "bun:test";
import {
  ONBOARDING_SURVEY_ID,
  ONBOARDING_SURVEY_QUESTIONS,
  ONBOARDING_SURVEY_SENT_EVENT,
  ONBOARDING_SURVEY_SHOWN_EVENT,
  onboardingPersonProperties,
  onboardingSurveySentProperties,
  onboardingSurveyShownProperties,
} from "./posthog-onboarding";
import { isLocalDevHost } from "./posthog-local";
import { isProductAppPath } from "./posthog-product-paths";
import { posthogIngestHost } from "./posthog-server";
import {
  SUPPORT_WIDGET_GREETING,
  shouldInjectSupportGreeting,
} from "./posthog-support";

describe("onboarding survey capture", () => {
  test("writes answers onto the person so revenue and fetch dashboards can segment by role and source", () => {
    expect(
      onboardingPersonProperties({
        source: "LinkedIn",
        role: "Founder",
        companySize: "2-10",
        goal: "find SaaS founders",
      }),
    ).toEqual({
      onboarding_source: "LinkedIn",
      onboarding_role: "Founder",
      onboarding_company_size: "2-10",
      onboarding_goal: "find SaaS founders",
    });
    expect(
      onboardingPersonProperties(
        {
          source: "LinkedIn",
          role: "Founder",
          companySize: "2-10",
          goal: "find SaaS founders",
        },
        { websiteUrl: "https://acme.com" },
      ),
    ).toMatchObject({ onboarding_website: "https://acme.com" });
  });

  test("uses the live PostHog survey ids so responses land in Surveys, not a one-off event", () => {
    expect(ONBOARDING_SURVEY_SHOWN_EVENT).toBe("survey shown");
    expect(ONBOARDING_SURVEY_SENT_EVENT).toBe("survey sent");
    expect(onboardingSurveyShownProperties()).toEqual({
      $survey_id: ONBOARDING_SURVEY_ID,
      $survey_name: "Onboarding",
    });

    const properties = onboardingSurveySentProperties({
      source: "Product Hunt",
      role: "Sales",
      companySize: "Just me",
      goal: "book more demos",
    });

    expect(properties.$survey_id).toBe(ONBOARDING_SURVEY_ID);
    expect(properties.$survey_name).toBe("Onboarding");
    expect(properties.$survey_completed).toBe(true);
    expect(properties.$survey_submission_id).toBeUndefined();
    expect(
      onboardingSurveySentProperties(
        { source: "Product Hunt", role: "Sales", companySize: "Just me", goal: "book more demos" },
        "user_abc",
      ).$survey_submission_id,
    ).toBe("user_abc");
    expect(properties[`$survey_response_${ONBOARDING_SURVEY_QUESTIONS.source.id}`]).toBe(
      "Product Hunt",
    );
    expect(properties[`$survey_response_${ONBOARDING_SURVEY_QUESTIONS.goal.id}`]).toBe(
      "book more demos",
    );
    expect(properties.$set).toMatchObject({
      onboarding_source: "Product Hunt",
      [`$survey_responded/${ONBOARDING_SURVEY_ID}`]: true,
    });
    expect(
      onboardingSurveySentProperties(
        { source: "Product Hunt", role: "Sales", companySize: "Just me", goal: "book more demos" },
        "user_abc",
        { websiteUrl: "https://acme.com" },
      ).$set,
    ).toMatchObject({ onboarding_website: "https://acme.com" });
  });
});

describe("support widget greeting", () => {
  test("injects only in an empty chat room so the first line is ours, not a blank composer", () => {
    expect(
      shouldInjectSupportGreeting({
        hasComposer: true,
        isIdentificationForm: false,
        hasGreeting: false,
        posthogBubbleCount: 0,
      }),
    ).toBe(true);
    expect(SUPPORT_WIDGET_GREETING).toBe("How can we help?");
  });

  test("skips the email form and an already-started thread so we do not stack fake bubbles", () => {
    expect(
      shouldInjectSupportGreeting({
        hasComposer: true,
        isIdentificationForm: true,
        hasGreeting: false,
        posthogBubbleCount: 0,
      }),
    ).toBe(false);
    expect(
      shouldInjectSupportGreeting({
        hasComposer: true,
        isIdentificationForm: false,
        hasGreeting: false,
        posthogBubbleCount: 1,
      }),
    ).toBe(false);
  });
});

describe("product app paths", () => {
  test("includes my-product and api-keys so signed-in usage is not undercounted", () => {
    expect(isProductAppPath("/agents")).toBe(true);
    expect(isProductAppPath("/my-product")).toBe(true);
    expect(isProductAppPath("/api-keys")).toBe(true);
    expect(isProductAppPath("/pricing")).toBe(false);
  });
});

describe("local dev host detection", () => {
  test("flags localhost and loopback so dev sessions never inflate dashboard visitor counts", () => {
    expect(isLocalDevHost("localhost")).toBe(true);
    expect(isLocalDevHost("127.0.0.1")).toBe(true);
    expect(isLocalDevHost("app.localhost")).toBe(true);
  });

  test("keeps production and tunnel hosts so real traffic still reaches PostHog", () => {
    expect(isLocalDevHost("omentir.com")).toBe(false);
    expect(isLocalDevHost("tunnel.omentir.com")).toBe(false);
  });
});

describe("PostHog ingest host", () => {
  test("sends server events to PostHog US ingest, not the browser reverse proxy", () => {
    const previous = process.env.POSTHOG_INGEST_HOST;
    delete process.env.POSTHOG_INGEST_HOST;
    expect(posthogIngestHost()).toBe("https://us.i.posthog.com");
    if (previous === undefined) delete process.env.POSTHOG_INGEST_HOST;
    else process.env.POSTHOG_INGEST_HOST = previous;
  });
});
