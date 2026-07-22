import { completeOnboardingQuestionsAction } from "../actions";
import { SelectField } from "./select-field";
import { TextAreaField } from "../ui/text-field";

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
  return (
    <>
      <h1
        style={{ fontFamily: "var(--font-varta)" }}
        className="text-4xl font-semibold tracking-tight sm:text-5xl"
      >
        Tell us about you
      </h1>
      <p className="mt-4 text-base leading-7 text-zinc-600">
        This helps Omentir shape the buyer profile and outreach setup around
        your actual team.
      </p>

      <div className="mt-8 w-full rounded-xl border border-[#ba3871] bg-white p-5 text-left shadow-[0_18px_70px_rgba(15,23,42,0.06)]">
        <form action={completeOnboardingQuestionsAction} className="grid gap-5">
          <SelectField label="Where did you hear about us?" name="source" options={sources} />
          <SelectField label="What is your job?" name="role" options={roles} />
          <SelectField label="Company size" name="companySize" options={sizes} />

          <TextAreaField
            name="goal"
            required
            rows={4}
            label="What do you want Omentir to help with?"
            placeholder="Example: find SaaS founders and start LinkedIn outreach"
          />

          <button
            type="submit"
            style={{ fontFamily: "var(--font-varta)" }}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-[#ba3871] px-5 text-sm font-semibold text-white transition hover:brightness-[0.98]"
          >
            Continue
          </button>
        </form>
      </div>
    </>
  );
}
