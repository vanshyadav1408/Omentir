import { describe, expect, test } from "bun:test";
import {
  ONBOARDING_SURVEY_ID,
  ONBOARDING_SURVEY_QUESTIONS,
  onboardingPersonProperties,
  onboardingSurveySentProperties,
} from "./posthog-onboarding";
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
  });

  test("uses the live PostHog survey ids so responses land in Surveys, not a one-off event", () => {
    const properties = onboardingSurveySentProperties({
      source: "Product Hunt",
      role: "Sales",
      companySize: "Just me",
      goal: "book more demos",
    });

    expect(properties.$survey_id).toBe(ONBOARDING_SURVEY_ID);
    expect(properties.$survey_completed).toBe(true);
    expect(properties[`$survey_response_${ONBOARDING_SURVEY_QUESTIONS.source.id}`]).toBe(
      "Product Hunt",
    );
    expect(properties[`$survey_response_${ONBOARDING_SURVEY_QUESTIONS.goal.id}`]).toBe(
      "book more demos",
    );
    expect(properties.$set).toMatchObject({ onboarding_source: "Product Hunt" });
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
