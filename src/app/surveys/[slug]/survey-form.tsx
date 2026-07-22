"use client";

import { useState } from "react";
import { TextAreaField, TextField } from "../../ui/text-field";
import type { Survey, SurveyQuestion } from "../survey-data";

type AnswerValue = string | string[] | number;

function isAnswered(value: AnswerValue | undefined) {
  if (value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export default function SurveyForm({
  survey,
  respondent,
}: {
  survey: Survey;
  respondent?: string;
}) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const missing = survey.questions.find(
      (question) => question.required && !isAnswered(answers[question.id]),
    );
    if (missing) {
      setError(`Please answer "${missing.question}".`);
      return;
    }

    setError(null);
    setStatus("submitting");

    try {
      const response = await fetch("/api/surveys/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: survey.slug, respondent, answers }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Something went wrong. Please try again.");
      }
      setStatus("done");
    } catch (submitError) {
      setStatus("idle");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  if (status === "done") {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] px-6 py-10 text-center">
        <p
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]"
        >
          Thank you!
        </p>
        <p className="mt-2 text-base text-[var(--md-sys-color-on-surface-variant)]">
          {survey.thankYou || "Your feedback means a lot — we read every response."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8" noValidate>
      {survey.questions.map((question, index) => (
        <fieldset key={question.id}>
          <legend className="text-base font-medium leading-7 text-[var(--md-sys-color-on-surface)]">
            {index + 1}. {question.question}
            {question.required ? (
              <span className="text-[var(--md-sys-color-primary)]"> *</span>
            ) : null}
          </legend>
          <div className="mt-3">
            <QuestionInput
              question={question}
              value={answers[question.id]}
              onChange={(value) => setAnswer(question.id, value)}
            />
          </div>
        </fieldset>
      ))}

      {error ? (
        <p role="alert" className="text-sm font-medium text-[var(--md-sys-color-error)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="m3-btn m3-btn-filled h-10 px-6 text-sm"
      >
        {status === "submitting" ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}) {
  if (question.type === "text") {
    return (
      <TextField
        placeholder={question.placeholder || "Your answer"}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (question.type === "textarea") {
    return (
      <TextAreaField
        rows={4}
        placeholder={question.placeholder || "Your answer"}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (question.type === "choice" || question.type === "multi") {
    const selected = new Set(
      question.type === "multi"
        ? Array.isArray(value)
          ? value
          : []
        : typeof value === "string"
          ? [value]
          : [],
    );

    return (
      <div className="space-y-2">
        {question.options.map((option) => {
          const checked = selected.has(option);
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                checked
                  ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
                  : "border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)]"
              }`}
            >
              <input
                type={question.type === "multi" ? "checkbox" : "radio"}
                name={question.id}
                value={option}
                checked={checked}
                onChange={() => {
                  if (question.type === "multi") {
                    const next = new Set(selected);
                    if (next.has(option)) {
                      next.delete(option);
                    } else {
                      next.add(option);
                    }
                    onChange([...next]);
                  } else {
                    onChange(option);
                  }
                }}
                className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
              />
              <span
                className={`text-sm font-medium ${
                  checked
                    ? "text-[var(--md-sys-color-on-primary-container)]"
                    : "text-[var(--md-sys-color-on-surface)]"
                }`}
              >
                {option}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  if (question.type !== "rating") {
    return null;
  }

  const max = question.max ?? 5;
  const steps = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => {
          const active = value === step;
          return (
            <button
              key={step}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(step)}
              className={`h-10 w-10 rounded-full border text-sm font-semibold transition-colors ${
                active
                  ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                  : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]"
              }`}
            >
              {step}
            </button>
          );
        })}
      </div>
      {question.minLabel || question.maxLabel ? (
        <div className="mt-2 flex justify-between text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
          <span>{question.minLabel}</span>
          <span>{question.maxLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
