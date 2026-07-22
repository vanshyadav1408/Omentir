import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LogoMark from "../../logo-mark";
import { getSurvey } from "../survey-data";
import SurveyForm from "./survey-form";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ r?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const survey = getSurvey(slug);

  return {
    title: survey ? `${survey.title} - Omentir` : "Survey - Omentir",
    robots: { index: false, follow: false },
  };
}

export default async function SurveyPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const survey = getSurvey(slug);

  if (!survey) {
    notFound();
  }

  const { r } = await searchParams;

  return (
    <main className="min-h-screen bg-[var(--md-sys-color-surface)] px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center gap-3">
          <LogoMark className="h-8 w-8" />
          <span
            style={{ fontFamily: "var(--font-varta)" }}
            className="text-xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]"
          >
            Omentir
          </span>
        </div>

        <h1
          style={{ fontFamily: "var(--font-varta)" }}
          className="mt-8 text-3xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-4xl"
        >
          {survey.title}
        </h1>
        {survey.intro ? (
          <p className="mt-3 text-base leading-7 text-[var(--md-sys-color-on-surface-variant)]">
            {survey.intro}
          </p>
        ) : null}

        <SurveyForm survey={survey} respondent={typeof r === "string" ? r : undefined} />
      </div>
    </main>
  );
}
