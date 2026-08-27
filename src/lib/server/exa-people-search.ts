import "server-only";

import type { PublicLead } from "@/app/tools/find-leads/types";

export const PUBLIC_LEAD_COUNT = 10;
export const PROMPT_MIN_LENGTH = 20;
export const PROMPT_MAX_LENGTH = 1500;

const EXA_SEARCH_URL = "https://api.exa.ai/search";
const SEARCH_TIMEOUT_MS = 20_000;

type ExaWorkRole = {
  title?: string | null;
  location?: string | null;
  dates?: { from?: string | null; to?: string | null } | null;
  company?: { id?: string | null; name?: string | null } | null;
};

type ExaPersonProperties = {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  location?: string | null;
  workHistory?: ExaWorkRole[] | null;
};

type ExaEntity = {
  type?: string;
  properties?: ExaPersonProperties;
};

type ExaSearchResult = {
  title?: string;
  url?: string;
  author?: string | null;
  image?: string | null;
  highlights?: string[];
  entities?: ExaEntity[];
};

type ExaSearchResponse = {
  results?: ExaSearchResult[];
};

export class ExaSearchError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "ExaSearchError";
  }
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function currentRole(history: ExaWorkRole[] | null | undefined) {
  if (!Array.isArray(history) || history.length === 0) return null;
  return history.find((role) => role?.dates?.to == null) || history[0];
}

function personProperties(result: ExaSearchResult): ExaPersonProperties {
  const person = (result.entities || []).find((entity) => entity?.type === "person");
  return person?.properties || {};
}

function displayName(result: ExaSearchResult, properties: ExaPersonProperties) {
  const full = text(properties.name);
  if (full) return full;
  const joined = [text(properties.firstName), text(properties.lastName)].filter(Boolean).join(" ");
  if (joined) return joined;
  const author = text(result.author);
  if (author) return author;
  const title = text(result.title);
  const beforeDash = title.split(" - ")[0]?.trim() || "";
  return beforeDash && beforeDash.length <= 80 ? beforeDash : "";
}

function httpsUrl(value: string) {
  return /^https:\/\//i.test(value) ? value : "";
}

function mapResult(result: ExaSearchResult): PublicLead | null {
  const properties = personProperties(result);
  const name = displayName(result, properties);
  if (!name) return null;

  const role = currentRole(properties.workHistory);
  const title = text(role?.title) || text(result.title);
  const company = text(role?.company?.name);
  const location = text(properties.location) || text(role?.location);
  const profileUrl = httpsUrl(text(result.url));
  if (!profileUrl) return null;

  const highlight = Array.isArray(result.highlights)
    ? result.highlights.map(text).find(Boolean) || ""
    : "";
  const reason =
    highlight ||
    [title, company ? `at ${company}` : ""].filter(Boolean).join(" ") ||
    "Public professional profile that matched the description.";

  return {
    name: name.slice(0, 120),
    title: title.slice(0, 160),
    company: company.slice(0, 160),
    location: location.slice(0, 160),
    reason: reason.slice(0, 400),
    profileUrl,
    imageUrl: httpsUrl(text(result.image)),
  };
}

function uniqueLeads(leads: PublicLead[]) {
  const seen = new Set<string>();
  return leads.filter((lead) => {
    const key = `${lead.name.toLowerCase()}|${lead.company.toLowerCase()}|${lead.profileUrl}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function peopleSearchQuery(prompt: string) {
  return `${prompt.trim()} Find people who would buy this, not people who work at the seller. Prefer founders, owners, and operators at companies that match the likely customer.`;
}

function exaHeaders(apiKey: string) {
  return {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
    "x-api-key": apiKey,
  };
}

async function exaSearch(
  query: string,
  apiKey: string,
  extra: Record<string, unknown>,
): Promise<ExaSearchResult[]> {
  const response = await fetch(EXA_SEARCH_URL, {
    method: "POST",
    headers: exaHeaders(apiKey),
    body: JSON.stringify({
      query,
      type: "auto",
      numResults: PUBLIC_LEAD_COUNT + 5,
      contents: { highlights: true },
      ...extra,
    }),
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  });

  if (response.ok) {
    const payload = (await response.json()) as ExaSearchResponse;
    return Array.isArray(payload.results) ? payload.results : [];
  }

  const detail = await response.text().catch(() => "");
  console.error(`[exa] search failed status=${response.status} body=${detail.slice(0, 400)}`);

  if (response.status === 401) {
    throw new ExaSearchError("Lead search is misconfigured.", 503);
  }
  if (response.status === 403 && extra.category === "people") {
    return exaSearch(query, apiKey, {
      includeDomains: ["linkedin.com"],
    });
  }
  if (response.status === 403) {
    throw new ExaSearchError("Lead search is misconfigured.", 503);
  }
  if (response.status === 429) {
    throw new ExaSearchError("The search provider is busy. Try again in a minute.", 429);
  }
  throw new ExaSearchError("Lead search failed. Try again in a minute.", 502);
}

async function exaPeopleSearch(query: string, apiKey: string): Promise<ExaSearchResult[]> {
  return exaSearch(query, apiKey, { category: "people" });
}

export async function findPublicLeads(prompt: string): Promise<PublicLead[]> {
  const apiKey = process.env.EXA_API_KEY?.trim();
  if (!apiKey) {
    throw new ExaSearchError("Lead search is not configured on this server.", 503);
  }

  const trimmed = prompt.trim();
  let results = await exaPeopleSearch(peopleSearchQuery(trimmed), apiKey);
  let leads = uniqueLeads(results.map(mapResult).filter((lead): lead is PublicLead => Boolean(lead)));

  if (leads.length === 0) {
    results = await exaPeopleSearch(trimmed, apiKey);
    leads = uniqueLeads(results.map(mapResult).filter((lead): lead is PublicLead => Boolean(lead)));
  }

  return leads.slice(0, PUBLIC_LEAD_COUNT);
}
