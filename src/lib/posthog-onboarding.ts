export const ONBOARDING_SURVEY_ID = "01a0578d-dc6f-0000-2fc2-3fedab12088a";

export const ONBOARDING_SURVEY_QUESTIONS = {
  source: {
    id: "a013ac3c-663e-407f-b919-bedd0710ba9e",
    question: "Where did you hear about us?",
  },
  role: {
    id: "da3959b6-788b-4544-ac98-72195b395d7f",
    question: "What is your job?",
  },
  companySize: {
    id: "54b45c55-0c75-44d8-9821-0322cc700db4",
    question: "Company size",
  },
  goal: {
    id: "a5049f39-2315-476c-b086-ccd02b6d0ec0",
    question: "What do you want Omentir to help with?",
  },
} as const;

export type OnboardingAnswers = {
  source: string;
  role: string;
  companySize: string;
  goal: string;
};

export function onboardingPersonProperties(answers: OnboardingAnswers) {
  return {
    onboarding_source: answers.source,
    onboarding_role: answers.role,
    onboarding_company_size: answers.companySize,
    onboarding_goal: answers.goal,
  };
}

/** Event payload so the existing onboarding form shows up in PostHog Surveys. */
export function onboardingSurveySentProperties(answers: OnboardingAnswers) {
  const questions = ONBOARDING_SURVEY_QUESTIONS;
  return {
    $survey_id: ONBOARDING_SURVEY_ID,
    $survey_name: "Onboarding",
    $survey_completed: true,
    $survey_questions: [
      { id: questions.source.id, question: questions.source.question },
      { id: questions.role.id, question: questions.role.question },
      { id: questions.companySize.id, question: questions.companySize.question },
      { id: questions.goal.id, question: questions.goal.question },
    ],
    [`$survey_response_${questions.source.id}`]: answers.source,
    [`$survey_response_${questions.role.id}`]: answers.role,
    [`$survey_response_${questions.companySize.id}`]: answers.companySize,
    [`$survey_response_${questions.goal.id}`]: answers.goal,
    $set: {
      ...onboardingPersonProperties(answers),
      [`$survey_responded/${ONBOARDING_SURVEY_ID}`]: true,
    },
    $set_once: {
      initial_onboarding_source: answers.source,
      initial_onboarding_role: answers.role,
      initial_onboarding_company_size: answers.companySize,
    },
  };
}
