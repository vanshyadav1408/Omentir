export const LINKEDIN_PROFILE_FIELD_LIMITS = {
  profileUrl: 240,
  headline: 300,
  about: 4000,
  experience: 8000,
  skills: 1500,
  audience: 300,
} as const;

export const LINKEDIN_PROFILE_DRAFT_STORAGE_KEY = "omentir.linkedin-profile-draft.v1";

export type LinkedInProfileToolMode = "rating" | "improve";

export type LinkedInProfileDraft = {
  profileUrl: string;
  fetchedUrl: string;
  headline: string;
  about: string;
  experience: string;
  skills: string;
  audience: string;
};

export type LinkedInProfileScoreBreakdown = {
  headline: number;
  about: number;
  experience: number;
  proof: number;
  outboundFit: number;
};

export type LinkedInProfileRatingResult = {
  overall: number;
  scores: LinkedInProfileScoreBreakdown;
  verdict: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  nextFixes: string[];
};

export type LinkedInProfileChange = {
  area: string;
  why: string;
};

export type LinkedInProfileImproveResult = {
  headline: string;
  about: string;
  experience: string;
  skills: string;
  changes: LinkedInProfileChange[];
};

export type LinkedInProfileToolResponse =
  | { mode: "rating"; rating: LinkedInProfileRatingResult }
  | { mode: "improve"; improve: LinkedInProfileImproveResult };

export const EMPTY_LINKEDIN_PROFILE_DRAFT: LinkedInProfileDraft = {
  profileUrl: "",
  fetchedUrl: "",
  headline: "",
  about: "",
  experience: "",
  skills: "",
  audience: "",
};

const LINKEDIN_IN_SLUG = /^[\p{L}\p{N}._%-]{2,100}$/u;

export function parsePublicLinkedInProfileUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, LINKEDIN_PROFILE_FIELD_LIMITS.profileUrl);
  if (!trimmed) return "";

  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withScheme);
    const host = url.hostname.toLowerCase();
    if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return "";

    const parts = url.pathname.split("/").filter(Boolean);
    const inIndex = parts.findIndex((part) => part.toLowerCase() === "in");
    if (inIndex < 0) return "";

    const slug = decodeURIComponent(parts[inIndex + 1] || "")
      .replace(/\/+$/g, "")
      .trim();
    if (!slug || slug.toLowerCase() === "me") return "";
    if (!LINKEDIN_IN_SLUG.test(slug)) return "";

    return `https://www.linkedin.com/in/${slug.toLowerCase()}`;
  } catch {
    return "";
  }
}

export function linkedInProfileSlug(value: string): string {
  const parsed = parsePublicLinkedInProfileUrl(value);
  if (!parsed) return "";
  return parsed.slice("https://www.linkedin.com/in/".length);
}

export function headlineFromLinkedInTitle(title: unknown): string {
  if (typeof title !== "string") return "";
  const cleaned = title
    .replace(/\s*\|\s*LinkedIn\s*$/i, "")
    .replace(/\s*[—–]\s*/g, " - ")
    .trim();
  const parts = cleaned.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return "";
  return parts.slice(1).join(" - ").slice(0, LINKEDIN_PROFILE_FIELD_LIMITS.headline);
}

const PROFILE_SECTION_ALIASES: Record<"about" | "experience" | "skills", string[]> = {
  about: ["about", "about me", "summary"],
  experience: ["experience", "work experience", "work history"],
  skills: ["skills", "top skills"],
};

const PROFILE_SECTION_STOP = new Set([
  "about",
  "about me",
  "summary",
  "experience",
  "work experience",
  "work history",
  "education",
  "skills",
  "top skills",
  "activity",
  "featured",
  "licenses & certifications",
  "licenses and certifications",
  "volunteer experience",
  "honors & awards",
  "honors and awards",
  "languages",
  "organizations",
  "publications",
  "people also viewed",
  "recommendations",
  "interests",
  "courses",
  "projects",
]);

function headingKey(line: string): string {
  return line.replace(/^#{1,6}\s*/, "").replace(/:$/, "").trim().toLowerCase();
}

function isNoiseProfileLine(line: string) {
  return /^(connect|follow|message|more|show all|see all|\d[\d,.]*\+?\s+connections|contact info|notify me)$/i.test(
    line.trim(),
  );
}

export function extractLinkedInProfileSections(pageText: unknown): Pick<
  LinkedInProfileDraft,
  "about" | "experience" | "skills"
> {
  const source = typeof pageText === "string" ? pageText : "";
  const lines = source.split(/\r?\n/).map((line) => line.trim());
  const buckets: Record<"about" | "experience" | "skills", string[]> = {
    about: [],
    experience: [],
    skills: [],
  };
  let current: "about" | "experience" | "skills" | null = null;

  for (const line of lines) {
    if (!line) {
      if (current) buckets[current].push("");
      continue;
    }
    const heading = headingKey(line);
    const nextSection = (Object.keys(PROFILE_SECTION_ALIASES) as Array<
      "about" | "experience" | "skills"
    >).find((key) => PROFILE_SECTION_ALIASES[key].includes(heading));
    if (nextSection) {
      current = nextSection;
      continue;
    }
    if (PROFILE_SECTION_STOP.has(heading)) {
      current = null;
      continue;
    }
    if (!current || isNoiseProfileLine(line)) continue;
    buckets[current].push(line);
  }

  return {
    about: trimProfileField(buckets.about.join("\n"), LINKEDIN_PROFILE_FIELD_LIMITS.about),
    experience: trimProfileField(buckets.experience.join("\n"), LINKEDIN_PROFILE_FIELD_LIMITS.experience),
    skills: trimProfileField(buckets.skills.join("\n"), LINKEDIN_PROFILE_FIELD_LIMITS.skills),
  };
}

export function clampProfileScore(value: unknown, fallback = 0) {
  const score = Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function profileScoreLabel(score: number) {
  if (score >= 87) return "Ready for outbound";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Decent";
  if (score >= 40) return "Needs work";
  return "Weak";
}

export function trimProfileField(
  value: unknown,
  maxLength: number,
): string {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, maxLength);
}

export function normalizeLinkedInProfileDraft(
  input: Partial<LinkedInProfileDraft> | null | undefined,
): LinkedInProfileDraft {
  return {
    profileUrl: trimProfileField(input?.profileUrl, LINKEDIN_PROFILE_FIELD_LIMITS.profileUrl),
    fetchedUrl: parsePublicLinkedInProfileUrl(input?.fetchedUrl),
    headline: trimProfileField(input?.headline, LINKEDIN_PROFILE_FIELD_LIMITS.headline),
    about: trimProfileField(input?.about, LINKEDIN_PROFILE_FIELD_LIMITS.about),
    experience: trimProfileField(input?.experience, LINKEDIN_PROFILE_FIELD_LIMITS.experience),
    skills: trimProfileField(input?.skills, LINKEDIN_PROFILE_FIELD_LIMITS.skills),
    audience: trimProfileField(input?.audience, LINKEDIN_PROFILE_FIELD_LIMITS.audience),
  };
}

export function profileDraftHasContent(draft: LinkedInProfileDraft) {
  return Boolean(
    draft.headline || draft.about || draft.experience || draft.skills,
  );
}

export function readStoredLinkedInProfileDraft(): LinkedInProfileDraft {
  if (typeof window === "undefined") return EMPTY_LINKEDIN_PROFILE_DRAFT;
  try {
    const raw = window.sessionStorage.getItem(LINKEDIN_PROFILE_DRAFT_STORAGE_KEY);
    if (!raw) return EMPTY_LINKEDIN_PROFILE_DRAFT;
    return normalizeLinkedInProfileDraft(JSON.parse(raw) as Partial<LinkedInProfileDraft>);
  } catch {
    return EMPTY_LINKEDIN_PROFILE_DRAFT;
  }
}

export function storeLinkedInProfileDraft(draft: LinkedInProfileDraft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      LINKEDIN_PROFILE_DRAFT_STORAGE_KEY,
      JSON.stringify(normalizeLinkedInProfileDraft(draft)),
    );
  } catch {
    // Private mode or a full quota should not break the form.
  }
}
