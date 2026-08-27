import "server-only";

import {
  extractLinkedInProfileSections,
  headlineFromLinkedInTitle,
  linkedInProfileSlug,
  normalizeLinkedInProfileDraft,
  parsePublicLinkedInProfileUrl,
  profileDraftHasContent,
  type LinkedInProfileDraft,
} from "@/lib/linkedin-profile-tool";
import { extractPublicLinkedInProfileFromSearch } from "./gemini";
import { ExaSearchError } from "./exa-people-search";

const EXA_SEARCH_URL = "https://api.exa.ai/search";
const EXA_CONTENTS_URL = "https://api.exa.ai/contents";
const FETCH_TIMEOUT_MS = 20_000;

type ExaWorkRole = {
  title?: string | null;
  location?: string | null;
  dates?: { from?: string | null; to?: string | null } | null;
  company?: { id?: string | null; name?: string | null } | null;
};

type ExaPersonProperties = {
  name?: string | null;
  workHistory?: ExaWorkRole[] | null;
};

type ExaEntity = {
  type?: string;
  properties?: ExaPersonProperties;
};

type ExaPage = {
  title?: string | null;
  url?: string | null;
  author?: string | null;
  text?: string | null;
  highlights?: string[] | null;
  entities?: ExaEntity[] | null;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function looksLikeLoginWall(pageText: string) {
  if (pageText.length > 1200) return false;
  return /sign in to (view|see)|join (to view|linkedin)|agree (&|and) join|log in to linkedin/i.test(
    pageText,
  );
}

function workHistoryText(history: ExaWorkRole[] | null | undefined) {
  if (!Array.isArray(history) || history.length === 0) return "";
  return history
    .map((role) => {
      const title = text(role?.title);
      const company = text(role?.company?.name);
      const from = text(role?.dates?.from);
      const to = text(role?.dates?.to) || (from && role?.dates?.to == null ? "Present" : "");
      const dates = [from, to].filter(Boolean).join(" - ");
      const line = [title, company ? `at ${company}` : "", dates ? `(${dates})` : ""]
        .filter(Boolean)
        .join(" ");
      return line;
    })
    .filter(Boolean)
    .join("\n\n");
}

function personProperties(page: ExaPage): ExaPersonProperties {
  const person = (page.entities || []).find((entity) => entity?.type === "person");
  return person?.properties || {};
}

function sameProfile(page: ExaPage, slug: string) {
  return linkedInProfileSlug(text(page.url)) === slug;
}

function draftFromPage(page: ExaPage): LinkedInProfileDraft {
  const pageText = looksLikeLoginWall(text(page.text)) ? "" : text(page.text);
  const sections = extractLinkedInProfileSections(pageText);
  const highlights = Array.isArray(page.highlights)
    ? page.highlights.map(text).filter(Boolean).join("\n\n")
    : "";
  const properties = personProperties(page);
  const experience = sections.experience || workHistoryText(properties.workHistory);
  const about = sections.about || highlights;

  return normalizeLinkedInProfileDraft({
    profileUrl: text(page.url),
    headline: headlineFromLinkedInTitle(page.title),
    about,
    experience,
    skills: sections.skills,
  });
}

function pickPage(pages: ExaPage[], slug: string, allowFirst = false): ExaPage | null {
  const matched = pages.find((page) => sameProfile(page, slug));
  if (matched) return matched;
  return allowFirst ? pages[0] || null : null;
}

async function exaPost(url: string, apiKey: string, body: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (response.status === 401 || response.status === 403) {
    const detail = await response.text().catch(() => "");
    console.error(`[exa-linkedin-profile] status=${response.status} body=${detail.slice(0, 400)}`);
    throw new ExaSearchError("Profile lookup is misconfigured.", 503);
  }
  if (response.status === 429) {
    throw new ExaSearchError("The lookup provider is busy. Try again in a minute.", 429);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[exa-linkedin-profile] status=${response.status} body=${detail.slice(0, 400)}`);
    throw new ExaSearchError("Could not read that public profile. Try again in a minute.", 502);
  }

  return response.json();
}

async function searchPublicProfile(canonicalUrl: string, apiKey: string): Promise<ExaPage[]> {
  const payload = (await exaPost(EXA_SEARCH_URL, apiKey, {
    query: canonicalUrl,
    type: "auto",
    category: "people",
    numResults: 5,
    contents: {
      text: { maxCharacters: 8000 },
      highlights: true,
    },
  })) as { results?: ExaPage[] };
  return Array.isArray(payload.results) ? payload.results : [];
}

async function contentsPublicProfile(canonicalUrl: string, apiKey: string): Promise<ExaPage[]> {
  const payload = (await exaPost(EXA_CONTENTS_URL, apiKey, {
    urls: [canonicalUrl],
    text: { maxCharacters: 8000 },
    livecrawl: "fallback",
  })) as { results?: ExaPage[] };
  return Array.isArray(payload.results) ? payload.results : [];
}

export async function fetchPublicLinkedInProfileDraft(
  rawUrl: string,
): Promise<LinkedInProfileDraft> {
  const canonicalUrl = parsePublicLinkedInProfileUrl(rawUrl);
  const slug = linkedInProfileSlug(canonicalUrl);
  if (!canonicalUrl || !slug) {
    throw new ExaSearchError("Use a public linkedin.com/in URL.", 400);
  }

  const apiKey = process.env.EXA_API_KEY?.trim();
  if (apiKey) {
    try {
      let pages = await searchPublicProfile(canonicalUrl, apiKey);
      let page = pickPage(pages, slug);
      let draft = page
        ? draftFromPage(page)
        : normalizeLinkedInProfileDraft({ profileUrl: canonicalUrl });

      if (!profileDraftHasContent(draft)) {
        pages = await contentsPublicProfile(canonicalUrl, apiKey);
        page = pickPage(pages, slug, true);
        if (page) draft = draftFromPage(page);
      }

      draft = normalizeLinkedInProfileDraft({ ...draft, profileUrl: canonicalUrl });
      if (profileDraftHasContent(draft)) return draft;
    } catch (error) {
      if (error instanceof ExaSearchError && error.status === 400) throw error;
      const message = error instanceof Error ? error.message : "exa lookup failed";
      console.error(`[exa-linkedin-profile] falling back to search: ${message}`);
    }
  }

  try {
    return await extractPublicLinkedInProfileFromSearch(canonicalUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/unavailable|configure|GEMINI|Vertex/i.test(message)) {
      throw new ExaSearchError("This tool is temporarily unavailable.", 503);
    }
    if (/linkedin\.com\/in/i.test(message)) {
      throw new ExaSearchError(message, 400);
    }
    throw new ExaSearchError(
      "Could not read that public profile. Use a public linkedin.com/in URL.",
      422,
    );
  }
}
