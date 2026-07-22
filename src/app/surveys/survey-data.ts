// Unlisted feedback surveys. Each entry renders at /surveys/<slug>.
//
// These pages are intentionally hidden: nothing links to them, they are
// noindex, robots.txt disallows /surveys/, and the bare /surveys route 404s.
// Only people who receive the link (via email) can open one.
//
// When creating a survey:
// - Use an unguessable slug: append a short random suffix, e.g. "july-feedback-x7k2".
// - To know who answered, append ?r=<email> to the link you send out;
//   it is stored with the response (nothing is shown to the respondent).
//
// Responses land in the `surveyResponses` Firestore collection as
// { surveySlug, respondent, answers: { [questionId]: value }, submittedAt }.

export type SurveyQuestion =
  | {
      id: string;
      type: "text" | "textarea";
      question: string;
      required?: boolean;
      placeholder?: string;
    }
  | {
      id: string;
      type: "choice" | "multi";
      question: string;
      required?: boolean;
      options: string[];
    }
  | {
      id: string;
      type: "rating";
      question: string;
      required?: boolean;
      /** Scale runs 1..max. Defaults to 5. */
      max?: 5 | 10;
      minLabel?: string;
      maxLabel?: string;
    };

export type Survey = {
  slug: string;
  title: string;
  intro?: string;
  questions: SurveyQuestion[];
  /** Shown after submitting. Defaults to a generic thank-you. */
  thankYou?: string;
};

export const SURVEYS: Survey[] = [
  // Example — copy this shape when adding a real survey:
  // {
  //   slug: "july-feedback-x7k2",
  //   title: "How is Omentir working for you?",
  //   intro: "Two minutes, a few questions — your answers directly shape what we build next.",
  //   questions: [
  //     {
  //       id: "recommend",
  //       type: "rating",
  //       question: "How likely are you to recommend Omentir to a friend?",
  //       max: 10,
  //       minLabel: "Not likely",
  //       maxLabel: "Very likely",
  //       required: true,
  //     },
  //     {
  //       id: "most-used",
  //       type: "choice",
  //       question: "Which part of Omentir do you use the most?",
  //       options: ["Lead discovery", "Automated outreach", "AI replies", "Something else"],
  //     },
  //     {
  //       id: "frustrations",
  //       type: "textarea",
  //       question: "What is missing or frustrating right now?",
  //       required: true,
  //     },
  //   ],
  // },
];

export function getSurvey(slug: string) {
  return SURVEYS.find((survey) => survey.slug === slug);
}
