import { completeOnboardingQuestionsAction } from "../actions";
import { AuthHeading, AuthSelect, AuthTextArea } from "../auth-ui";

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
    <div className="mx-auto w-full max-w-lg">
      <AuthHeading
        title="Tell us about yourself"
        subtitle="This helps Omentir shape the buyer profile and outreach setup around your actual team."
      />

      <form action={completeOnboardingQuestionsAction} className="grid w-full gap-4">
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

        <button type="submit" className="auth-btn">
          Continue
        </button>
      </form>
    </div>
  );
}
