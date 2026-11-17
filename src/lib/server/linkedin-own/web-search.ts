// People and company search from LinkedIn's own search pages.
//
// The Voyager GraphQL search query this client used to call now answers
// 200 with an empty result set for every query (verified live), while the
// search pages at linkedin.com/search/results still return full results
// as server-rendered HTML to a signed-in session. So search reads those
// pages with the account's session and parses the result list. The
// markup is LinkedIn's current SDUI output: hashed class names, but
// stable profile/company links and plain result text, which is what the
// parsers below key on.
//
// People results carry a public identifier (vanity), not a member id.
// Callers resolve vanity -> member id with one profile read before any
// outreach. Company results are resolved to numeric ids through the
// company endpoint, because company filters elsewhere need the number.

import { decodeHtml, textContent } from "./login";
import { endpoints } from "./endpoints";
import { mapCompanyResponse } from "./mappers";
import { fetchLinkedInWebPage, voyagerRequest, type OwnSession, type SessionHooks } from "./transport";
import { activityTimestamp, type VoyagerResponse } from "./voyager";

const PAGE_SIZE = 10;
const NOISE = /mutual connection|followers?|connect|message|follow|visit my|view my|services|website|people also|similar profiles/i;

function rehydrationText(html: string) {
  const script = html.match(/<script[^>]*id=["']rehydrate-data["'][^>]*>([\s\S]*?)<\/script>/i)?.[1] || "";
  const arrayLiteral = script.match(/window\.__como_rehydration__\s*=\s*(\[[\s\S]*\])\s*;?\s*$/)?.[1];
  if (!arrayLiteral) return "";
  try {
    const chunks = JSON.parse(arrayLiteral) as unknown[];
    return chunks.filter((chunk): chunk is string => typeof chunk === "string").join("\n");
  } catch {
    return "";
  }
}

function flightMemberIdBySlug(flight: string) {
  const bySlug = new Map<string, string>();
  for (const match of flight.matchAll(/"profileNavTargets":(\{[^}]+\})/g)) {
    try {
      const parsed = JSON.parse(match[1]) as Record<string, unknown>;
      for (const [memberId, url] of Object.entries(parsed)) {
        if (typeof url !== "string" || !memberId.startsWith("ACo")) continue;
        const slug = url.match(/\/in\/([^/?#]+)/)?.[1];
        if (slug) bySlug.set(slug, memberId);
      }
    } catch {
      // ignore malformed chunk
    }
  }
  return bySlug;
}

function flightAvatarsByLabel(flight: string) {
  const avatars = new Map<string, string>();
  const pattern =
    /"aria-labelledby":"([^"]+)"[^{}]*"renderPayload":\{"rootUrl":"(https:\/\/media\.licdn\.com\/[^"]+)","imageRenditions":\[([^\]]+)\]/g;
  for (const match of flight.matchAll(pattern)) {
    const renditions = [...match[3].matchAll(/\{"width":(\d+),"height":\d+,"suffixUrl":"([^"]+)"\}/g)]
      .map((item) => ({ width: Number(item[1]), suffixUrl: item[2] }))
      .sort((a, b) => b.width - a.width);
    if (match[1] && match[2] && renditions[0]?.suffixUrl) {
      avatars.set(match[1], `${match[2]}${renditions[0].suffixUrl}`);
    }
  }
  return avatars;
}

function flightCompanyIdBySlug(flight: string) {
  const bySlug = new Map<string, string>();
  const pattern = /"companyId":"(\d+)"[\s\S]{0,900}?"url":"https:\/\/www\.linkedin\.com\/company\/([^/?#"\\]+)/g;
  for (const match of flight.matchAll(pattern)) {
    if (!bySlug.has(match[2])) bySlug.set(match[2], match[1]);
  }
  return bySlug;
}

function segments(html: string) {
  return decodeHtml(
    html
      .replace(/<script\b[\s\S]*?<\/script\b[^>]*>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style\s*>/gi, " ")
      .replace(/<[^>]+>/g, "\n"),
  ).replace(/\\u2022/g, "•")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function pictureIn(html: string) {
  const match = html.match(/<img[^>]+(?:src|data-delayed-url)="(https:\/\/[^"]*licdn[^"]*)"/);
  return match?.[1];
}

function resultChunks(html: string, kind: "in" | "company") {
  const region = html.indexOf("data-sdui-screen");
  if (region < 0) return [];
  const body = html.slice(region);
  const linkPattern = new RegExp(String.raw`<a\b[^>]*href="https://www\.linkedin\.com/${kind}/([^"/?#]+)/?"`, "i");
  const listItems = body.split(/role=["']listitem["']/i).slice(1);
  if (listItems.length) {
    const bySlug = new Map<string, { slug: string; html: string }>();
    for (const rawItem of listItems) {
      const openEnd = rawItem.indexOf(">");
      const chunk = rawItem.slice(openEnd >= 0 ? openEnd + 1 : 0, 16_000);
      // Only take the card's primary entity link (before any social-proof
      // snippet like "Sam Dow & Adam Helmey are mutual connections").
      const headerSlice = chunk.split(/SearchResultssnippet_|are mutual connections|is a mutual connection/i)[0] || chunk;
      const slug = headerSlice.match(linkPattern)?.[1];
      if (!slug || bySlug.has(slug)) continue;
      bySlug.set(slug, { slug, html: chunk });
    }
    if (bySlug.size) return [...bySlug.values()];
  }

  const pattern = new RegExp(String.raw`<a\b[^>]*href="https://www\.linkedin\.com/${kind}/([^"/]+)/?"`, "g");
  // Fallback for synthetic fixtures without role="listitem".
  const bySlug = new Map<string, { slug: string; html: string }>();
  const matches = [...body.matchAll(pattern)];
  for (let index = 0; index < matches.length; index += 1) {
    const slug = matches[index][1];
    const start = matches[index].index || 0;
    const end = matches[index + 1]?.index ?? Math.min(body.length, start + 12_000);
    const chunk = body.slice(start, Math.min(end, start + 12_000));
    const existing = bySlug.get(slug);
    if (!existing || chunk.length > existing.html.length) bySlug.set(slug, { slug, html: chunk });
  }
  return [...bySlug.values()];
}

// Degree lines look like "• 2nd"; the bullet arrives as a real bullet, a
// literal \u2022 escape, or another separator depending on the payload.
const DEGREE = /^(?:[^A-Za-z0-9\s]+\s*)?(1st|2nd|3rd\+?)$/;

// Past a free account's monthly people-search allowance, LinkedIn still
// answers every search, with about three results and an upgrade notice.
// Both have to hold: the notice text alone could sit in a page bundle.
const MONTHLY_SEARCH_LIMIT = /monthly limit/i;
const LIMITED_RESULT_COUNT = 3;

export function hasMonthlySearchLimit(html: string, resultCount: number) {
  return resultCount <= LIMITED_RESULT_COUNT && MONTHLY_SEARCH_LIMIT.test(`${textContent(html)}\n${rehydrationText(html)}`);
}

export function parsePeopleResults(html: string) {
  const flight = rehydrationText(html);
  const memberBySlug = flightMemberIdBySlug(flight);
  const avatarsByLabel = flightAvatarsByLabel(flight);
  return resultChunks(html, "in").flatMap(({ slug, html: chunk }) => {
    const lines = segments(chunk);
    const rawFirst = lines[0] || "";
    const inlineDegree = rawFirst.match(/\s*•\s*(1st|2nd|3rd\+?)\b/i)?.[1];
    const name = rawFirst.replace(/\s*•\s*(?:1st|2nd|3rd\+?)\b.*$/i, "").trim();
    if (!name || NOISE.test(name) || name.toLowerCase() === "linkedin member") return [];
    const degreeIndex = lines.findIndex((line) => DEGREE.test(line));
    const inlineSecondDegree = lines[1]?.match(/\s*•\s*(1st|2nd|3rd\+?)\b/i)?.[1];
    const degreeToken = degreeIndex >= 0 ? lines[degreeIndex] : inlineSecondDegree || inlineDegree;
    const headlineIndex =
      degreeIndex >= 0
        ? degreeIndex + 1
        : lines[1] === name || Boolean(inlineSecondDegree)
          ? 2
          : 1;
    const headline = lines[headlineIndex];
    const location = lines[headlineIndex + 1];
    const memberId =
      memberBySlug.get(slug) ||
      chunk.match(/SearchResults(ACo[A-Za-z0-9_-]+)/)?.[1] ||
      (slug.startsWith("ACo") ? slug : undefined);
    const labelId = chunk.match(/aria-labelledby="([^"]+)"/)?.[1];
    const picture = pictureIn(chunk) || (labelId ? avatarsByLabel.get(labelId) : undefined);
    const publicIdentifier = slug.startsWith("ACo") ? undefined : slug;
    return [{
      id: memberId || slug,
      ...(memberId ? { provider_id: memberId } : {}),
      ...(publicIdentifier ? { public_identifier: publicIdentifier } : {}),
      profile_url: `https://www.linkedin.com/in/${slug}/`,
      name,
      ...(headline ? { headline } : {}),
      ...(location && !NOISE.test(location) && location.length <= 90 ? { location } : {}),
      ...(picture ? { profile_picture_url: picture } : {}),
      ...(degreeToken ? { network_distance: `DISTANCE_${degreeToken.replace(/[^123]/g, "")}` } : {}),
    }];
  });
}

export function parseCompanyResults(html: string) {
  const flight = rehydrationText(html);
  const companyIdBySlug = flightCompanyIdBySlug(flight);
  return resultChunks(html, "company").flatMap(({ slug, html: chunk }) => {
    const lines = segments(chunk);
    const name = lines[0];
    if (!name || NOISE.test(name)) return [];
    const detail = lines[lines[1] === name ? 2 : 1];
    const location = lines[(lines[1] === name ? 2 : 1) + 1];
    const numericId = companyIdBySlug.get(slug);
    return [{
      id: numericId || slug,
      public_identifier: slug,
      profile_url: `https://www.linkedin.com/company/${slug}/`,
      name,
      ...(detail ? { industry: detail } : {}),
      ...(location && !NOISE.test(location) && location.length <= 90 ? { location } : {}),
      ...(pictureIn(chunk) ? { profile_picture_url: pictureIn(chunk) } : {}),
    }];
  });
}

// Post results: the page's embedded state pairs each activity id with
// its post URL in card order, and each rendered card starts with a
// "Feed post" label followed by author, headline, age and the post text.
// Zip the two by position.
export function parsePostResults(html: string) {
  const region = html.indexOf("data-sdui-screen");
  if (region < 0) return [];
  const flight = rehydrationText(html);
  // Post results: check Flight rehydration mapping first (current SDUI pages),
  // then fall back to inline activityId + postSlugUrl pairs.
  const activityByKey = new Map<string, string>();
  for (const match of flight.matchAll(/commentsSectionAnchor-urn:li:activity:(\d+)"\}\],"collectionId":"[^"]*?-commentList([A-Za-z0-9_-]+)FeedType_/g)) {
    activityByKey.set(match[2], match[1]);
  }
  const shareUrnByActivity = new Map<string, string>();
  for (const match of flight.matchAll(/"activityId":"(\d+)"\}\}\},"rootUrn":"(urn:li:(?:ugcPost|share):\d+)"/g)) {
    shareUrnByActivity.set(match[1], match[2]);
  }
  if (activityByKey.size) {
    const results: Array<Record<string, unknown>> = [];
    const seenItems = new Set<string>();
    for (const chunk of html.slice(region).split(/role=["']listitem["']/i).slice(1)) {
      const key = chunk.match(/update-card-focus([A-Za-z0-9_-]+)FeedType_/)?.[1];
      const activityId = (key ? activityByKey.get(key) : undefined) || chunk.match(/urn:li:activity:(\d+)/)?.[1];
      if (!activityId || seenItems.has(activityId)) continue;
      seenItems.add(activityId);
      const authorUrl = chunk.match(/href=["'](https:\/\/www\.linkedin\.com\/(?:in|company)\/[^"'?#]+)\/?["']/i)?.[1];
      const isCompany = Boolean(authorUrl?.includes("/company/"));
      const rawLabel = decodeHtml(chunk.match(/aria-label=["']([^"']+)["']/i)?.[1] || "").trim();
      const author = rawLabel.replace(/\s*(?:Verified Profile|Premium Profile)?\s*(?:1st|2nd|3rd\+?)?$/i, "").trim() || segments(chunk)[1];
      const textBoxStart = chunk.search(/data-testid=["']expandable-text-box["']/i);
      let bodyText = "";
      if (textBoxStart >= 0) {
        const slice = chunk.slice(textBoxStart, textBoxStart + 8_000);
        const openEnd = slice.indexOf(">");
        const closeSpan = slice.indexOf("</span>");
        if (openEnd >= 0) {
          bodyText = textContent(slice.slice(openEnd + 1, closeSpan > openEnd ? closeSpan : openEnd + 4_000));
        }
      }
      const shareUrn = shareUrnByActivity.get(activityId);
      results.push({
        id: activityId,
        social_id: `urn:li:activity:${activityId}`,
        share_url: `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}/`,
        ...(bodyText ? { text: bodyText } : {}),
        ...(activityTimestamp(activityId) ? { parsed_datetime: activityTimestamp(activityId) } : {}),
        author: {
          ...(author ? { name: author } : {}),
          ...(authorUrl ? { profile_url: authorUrl } : {}),
          ...(isCompany ? { is_company: true } : {}),
        },
        ...(shareUrn ? { thread_urn: shareUrn } : {}),
      });
    }
    if (results.length) return results;
  }
  const pairs: Array<{ activityId: string; url: string }> = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/\\"activityId\\":\\"(\d+)\\"[\s\S]{0,400}?\\"postSlugUrl\\":\\"([^\\"]+)\\"/g)) {
    if (seen.has(match[1])) continue;
    seen.add(match[1]);
    pairs.push({ activityId: match[1], url: match[2].replace(/\\u002F/g, "/") });
  }
  const cards = html.slice(region).split("Feed post").slice(1).map((chunk) => segments(chunk));
  return pairs.flatMap((pair, index) => {
    const lines = cards[index] || [];
    const author = lines[0];
    const degreeIndex = lines.findIndex((line) => DEGREE.test(line));
    const headline = degreeIndex >= 0 ? lines[degreeIndex + 1] : undefined;
    const textLines = lines.slice((degreeIndex >= 0 ? degreeIndex + 2 : 1)).filter((line) => line !== "Follow" && !/^(?:now|\d+[smhdwy])$/i.test(line));
    const shareUrn = shareUrnByActivity.get(pair.activityId);
    return [{
      id: pair.activityId,
      social_id: `urn:li:activity:${pair.activityId}`,
      share_url: pair.url,
      ...(textLines.length ? { text: textLines.join(" ").slice(0, 1_000) } : {}),
      ...(activityTimestamp(pair.activityId) ? { parsed_datetime: activityTimestamp(pair.activityId) } : {}),
      author: { ...(author ? { name: author } : {}), ...(headline ? { headline } : {}) },
      ...(shareUrn ? { thread_urn: shareUrn } : {}),
    }];
  });
}

// ------------------------------------------------------------ URL search

export type ParsedLinkedInUrl =
  | { kind: "search"; resultType: "PEOPLE" | "COMPANIES" | "CONTENT"; keywords: string; filters: Array<{ key: string; values: string[] }> }
  | { kind: "profile"; identifier: string }
  | { kind: "company"; identifier: string };

function jsonListParam(url: URL, name: string) {
  const raw = url.searchParams.get(name);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [raw];
  }
}

// Accepts the URLs a person copies out of LinkedIn: search result pages
// (keywords and facet filters ride in the query string), Sales Navigator
// people searches (keywords plain or inside the rison `query` parameter),
// and single profile or company pages. Anything else returns null so the
// caller can refuse it plainly instead of guessing.
export function parseLinkedInSearchUrl(raw: string): ParsedLinkedInUrl | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !(url.hostname === "linkedin.com" || url.hostname.endsWith(".linkedin.com"))) return null;
  const path = url.pathname.replace(/\/+$/, "");

  const profile = path.match(/^\/in\/([^/]+)$/);
  if (profile) return { kind: "profile", identifier: decodeURIComponent(profile[1]) };
  const company = path.match(/^\/company\/([^/]+)$/);
  if (company) return { kind: "company", identifier: decodeURIComponent(company[1]) };

  const classic = path.match(/^\/search\/results\/(people|companies|content|all)$/);
  if (classic) {
    const resultType = classic[1] === "companies" ? "COMPANIES" : classic[1] === "content" ? "CONTENT" : "PEOPLE";
    const geo = jsonListParam(url, "geoUrn");
    const filters =
      resultType === "PEOPLE"
        ? [
            { key: "geoUrn", values: geo },
            { key: "currentCompany", values: jsonListParam(url, "currentCompany") },
          ]
        : resultType === "COMPANIES"
          ? [{ key: "companyHqGeo", values: geo }]
          : [];
    return { kind: "search", resultType, keywords: url.searchParams.get("keywords") || "", filters };
  }

  if (/^\/sales\/search\/people/.test(path) || /^\/sales\/lists\/people/.test(path)) {
    let keywords = url.searchParams.get("keywords") || "";
    if (!keywords) {
      // Older Sales Navigator links carry the query rison-encoded.
      keywords = url.searchParams.get("query")?.match(/keywords:([^,)]+)/)?.[1] || "";
      try {
        keywords = decodeURIComponent(keywords).replace(/^"|"$/g, "");
      } catch {
        // keep the raw token
      }
    }
    // A Sales Navigator link with no readable keywords carries filters
    // this client does not parse; refuse it instead of running an
    // unscoped people search that would return the wrong leads.
    if (!keywords.trim()) return null;
    return { kind: "search", resultType: "PEOPLE", keywords, filters: [] };
  }

  return null;
}

function searchUrl(input: { resultType: "PEOPLE" | "COMPANIES" | "CONTENT"; keywords: string; filters: Array<{ key: string; values: string[] }>; page: number }) {
  const path = input.resultType === "PEOPLE" ? "people" : input.resultType === "COMPANIES" ? "companies" : "content";
  const url = new URL(`https://www.linkedin.com/search/results/${path}/`);
  if (input.keywords.trim()) url.searchParams.set("keywords", input.keywords.trim());
  url.searchParams.set("origin", "FACETED_SEARCH");
  url.searchParams.set("page", String(input.page));
  for (const filter of input.filters) {
    if (!filter.values.length) continue;
    // Web search takes the same filter values as the GraphQL query, JSON
    // encoded. companyHqGeo is the GraphQL name; the page calls it geoUrn.
    const key = filter.key === "companyHqGeo" ? "geoUrn" : filter.key;
    url.searchParams.set(key, JSON.stringify(filter.values));
  }
  return url;
}

export async function webSearch(
  session: OwnSession,
  input: {
    resultType: "PEOPLE" | "COMPANIES" | "CONTENT";
    keywords: string;
    filters: Array<{ key: string; values: string[] }>;
    start: number;
    limit: number;
  },
  hooks: SessionHooks = {},
) {
  const items: Array<Record<string, unknown>> = [];
  const seenIds = new Set<string>();
  let page = Math.floor(input.start / PAGE_SIZE) + 1;
  let more = false;
  let limitReached = false;
  let pagesFetched = 0;
  while (items.length < input.limit && pagesFetched < 5) {
    pagesFetched += 1;
    const html = await fetchLinkedInWebPage(session, searchUrl({ ...input, page }), hooks);
    const parsed = input.resultType === "PEOPLE" ? parsePeopleResults(html) : input.resultType === "COMPANIES" ? parseCompanyResults(html) : parsePostResults(html);
    if (input.resultType === "PEOPLE" && pagesFetched === 1 && hasMonthlySearchLimit(html, parsed.length)) limitReached = true;
    let added = 0;
    for (const item of parsed) {
      const id = String(item.id || "");
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      items.push(item);
      added += 1;
    }
    const expectedMin = input.resultType === "CONTENT" ? 1 : PAGE_SIZE - 1;
    more = added >= expectedMin;
    if (!more) break;
    page += 1;
  }
  const sliced = items.slice(0, input.limit);
  if (input.resultType === "COMPANIES") {
    // Company filters and employee search need the numeric company id.
    // Resolve only slugs that did not already carry a numeric companyId in the page payload.
    for (const item of sliced) {
      if (/^\d+$/.test(String(item.id || ""))) continue;
      try {
        const company = mapCompanyResponse((await voyagerRequest(session, { path: endpoints.companyByUniversalName(String(item.public_identifier)) }, hooks)) as VoyagerResponse);
        if (company?.id) item.id = company.id;
      } catch {
        // The slug still opens the company; a later read can resolve it.
      }
    }
  }
  return { items: sliced, more, limitReached };
}
