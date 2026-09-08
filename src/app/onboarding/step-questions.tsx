"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { completeOnboardingQuestionsAction } from "../actions";
import { AuthHeading, AuthSelect, AuthTextArea } from "../auth-ui";
import {
  ONBOARDING_SURVEY_SENT_EVENT,
  ONBOARDING_SURVEY_SHOWN_EVENT,
  onboardingSurveySentProperties,
  onboardingSurveyShownProperties,
} from "@/lib/posthog-onboarding";

const sources = [
  "LinkedIn",
  "Google",
  "A founder friend",
  "Twitter / X",
  "YouTube",
  "Reddit",
  "Newsletter / blog",
  "Product Hunt",
  "Other",
];
const roles = [
  "Founder",
  "Sales",
  "Marketing",
  "Operator",
  "Growth",
  "Agency owner",
  "Recruiter",
  "Freelancer / consultant",
  "Other",
];
const sizes = ["Just me", "2-10", "11-50", "51-200", "201-500", "500+"];

export default function StepQuestions() {
  const posthog = usePostHog();
  const [pending, setPending] = useState(false);
  const [submissionId] = useState(() => crypto.randomUUID());
  const shown = useRef(false);

  useEffect(() => {
    if (!posthog || shown.current) return;
    shown.current = true;
    posthog.capture(ONBOARDING_SURVEY_SHOWN_EVENT, onboardingSurveyShownProperties());
  }, [posthog]);

  async function submit(formData: FormData) {
    if (pending) return;
    setPending(true);
    const answers = {
      source: String(formData.get("source") || "").trim(),
      role: String(formData.get("role") || "").trim(),
      companySize: String(formData.get("companySize") || "").trim(),
      goal: String(formData.get("goal") || "").trim(),
    };
    if (posthog && answers.source && answers.role && answers.companySize && answers.goal) {
      // Beacon + send_instantly so the event leaves before the server action redirects.
      posthog.capture(
        ONBOARDING_SURVEY_SENT_EVENT,
        {
          ...onboardingSurveySentProperties(answers, submissionId),
          $insert_id: `onboarding_survey:${submissionId}`,
        },
        { send_instantly: true, transport: "sendBeacon" },
      );
    }
    try {
      await completeOnboardingQuestionsAction(formData);
    } catch (error) {
      setPending(false);
      throw error;
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <AuthHeading
        title="Tell us about yourself"
        subtitle="This helps Omentir shape the buyer profile and outreach setup around your actual team."
      />

      <form action={submit} className="grid w-full gap-4">
        <input type="hidden" name="surveySubmissionId" value={submissionId} />
        <AuthSelect label="Where did you hear about us?" name="source" options={sources} />
        <AuthSelect label="What is your job?" name="role" options={roles} />
        <AuthSelect label="Company size" name="companySize" options={sizes} />

        <AuthTextArea
          name="goal"
          required
          rows={4}
          label="What do you want Omentir to help with?"
          placeholder="Example: find SaaS founders and start LinkedIn outreach"
        />

        <button type="submit" className="auth-btn" disabled={pending}>
          {pending ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
