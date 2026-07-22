import { NextRequest, NextResponse } from "next/server";
import { getSurvey } from "@/app/surveys/survey-data";
import { getDb, nowIso } from "@/lib/server/firebase";

export const dynamic = "force-dynamic";

const MAX_TEXT_ANSWER_LENGTH = 5000;
const MAX_RESPONDENT_LENGTH = 200;

type SubmitBody = {
  slug?: unknown;
  respondent?: unknown;
  answers?: unknown;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SubmitBody | null;
  const survey = typeof body?.slug === "string" ? getSurvey(body.slug) : undefined;

  if (!survey) {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  const raw =
    body?.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
      ? (body.answers as Record<string, unknown>)
      : {};

  const answers: Record<string, string | string[] | number> = {};
  for (const question of survey.questions) {
    const value = raw[question.id];

    if (question.type === "rating") {
      const rating = Number(value);
      if (Number.isInteger(rating) && rating >= 1 && rating <= (question.max ?? 5)) {
        answers[question.id] = rating;
      }
    } else if (question.type === "choice") {
      if (typeof value === "string" && question.options.includes(value)) {
        answers[question.id] = value;
      }
    } else if (question.type === "multi") {
      if (Array.isArray(value)) {
        const picked = question.options.filter((option) => value.includes(option));
        if (picked.length > 0) {
          answers[question.id] = picked;
        }
      }
    } else {
      if (typeof value === "string" && value.trim().length > 0) {
        answers[question.id] = value.trim().slice(0, MAX_TEXT_ANSWER_LENGTH);
      }
    }

    if (question.required && answers[question.id] === undefined) {
      return NextResponse.json(
        { error: `Please answer "${question.question}".` },
        { status: 400 },
      );
    }
  }

  const respondent =
    typeof body?.respondent === "string"
      ? body.respondent.trim().slice(0, MAX_RESPONDENT_LENGTH)
      : "";

  await getDb().collection("surveyResponses").add({
    surveySlug: survey.slug,
    respondent,
    answers,
    submittedAt: nowIso(),
  });

  return NextResponse.json({ ok: true });
}
