// Restriction matching. Pure so the enroll path, the send path and the Settings
// page all agree on what counts as the same person, company or country.

import { RESOLVABLE_COUNTRIES, resolveLeadCountry } from "./server/lead-time-zone";

export type ExclusionKind = "profile" | "company" | "country";

export type ParsedExclusion = {
  kind: ExclusionKind;
  // What the user typed, tidied, shown back on the Settings page.
  value: string;
  // What leads are matched on.
  key: string;
};

export const MAX_EXCLUSIONS_PER_WORKSPACE = 5000;

// Words that differ between how a person writes a company and how LinkedIn
// shows it on a profile ("Acme" vs "Acme, Inc."). Dropped before comparing.
const COMPANY_SUFFIXES = new Set([
  "inc", "incorporated", "llc", "ltd", "limited", "corp", "corporation", "co", "company",
  "gmbh", "ag", "sa", "sas", "sarl", "bv", "nv", "plc", "pte", "pty", "pvt", "private",
  "oy", "ab", "as", "aps", "srl", "spa", "kk", "lp", "llp",
]);

export function companyExclusionKey(name: string) {
  const words = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  while (words.length > 1 && COMPANY_SUFFIXES.has(words[words.length - 1])) words.pop();
  return words.join("");
}

// The profile's public id (linkedin.com/in/<id>), lowercased. Empty when the
// text is not a LinkedIn person profile.
export function profileExclusionKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return "";
  }
  const host = url.hostname.toLowerCase();
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return "";
  const match = url.pathname.match(/^\/(in|pub)\/([^/]+)/i);
  if (!match) return "";
  try {
    return decodeURIComponent(match[2]).toLowerCase();
  } catch {
    return match[2].toLowerCase();
  }
}

function linkedInCompanySlug(value: string) {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const host = url.hostname.toLowerCase();
    if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return "";
    return url.pathname.match(/^\/company\/([^/]+)/i)?.[1] || "";
  } catch {
    return "";
  }
}

// One entry per line. Commas do not split: "Acme, Inc." is one company. A
// LinkedIn profile link blocks that person; a LinkedIn company link or a
// company name blocks everyone whose current company matches.
export function parseExclusionInput(text: string): ParsedExclusion[] {
  const seen = new Set<string>();
  const entries: ParsedExclusion[] = [];
  for (const raw of text.split(/[\r\n;]+/)) {
    const line = raw.trim().replace(/^["']|["']$/g, "").trim();
    if (!line) continue;
    const profileKey = profileExclusionKey(line);
    const slug = profileKey ? "" : linkedInCompanySlug(line);
    const entry: ParsedExclusion | null = profileKey
      ? { kind: "profile", value: `https://www.linkedin.com/in/${profileKey}`, key: profileKey }
      : slug
        ? { kind: "company", value: slug.replace(/-/g, " "), key: companyExclusionKey(slug) }
        : /^https?:\/\//i.test(line) || /linkedin\.com/i.test(line)
          ? null
          : { kind: "company", value: line.slice(0, 120), key: companyExclusionKey(line) };
    if (!entry || !entry.key) continue;
    const id = `${entry.kind}:${entry.key}`;
    if (seen.has(id)) continue;
    seen.add(id);
    entries.push(entry);
  }
  return entries;
}

function countryLabel(key: string) {
  return key.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

// The countries Settings offers to block: the ones a profile location can be
// recognised as, so every country a user picks can be enforced.
export const BLOCKABLE_COUNTRIES = RESOLVABLE_COUNTRIES.map(countryLabel).sort((a, b) => a.localeCompare(b));

// null when the name is not a country we can recognise on a profile.
export function parseCountryExclusion(name: string): ParsedExclusion | null {
  const key = name.trim().toLowerCase();
  return RESOLVABLE_COUNTRIES.includes(key) ? { kind: "country", value: countryLabel(key), key } : null;
}

export type ExclusionKeys = { profiles: Set<string>; companies: Set<string>; countries: Set<string> };

export function buildExclusionKeys(entries: Array<{ kind: ExclusionKind; key: string }>): ExclusionKeys {
  const keys: ExclusionKeys = { profiles: new Set(), companies: new Set(), countries: new Set() };
  for (const entry of entries) {
    (entry.kind === "profile" ? keys.profiles : entry.kind === "country" ? keys.countries : keys.companies).add(entry.key);
  }
  return keys;
}

// A blank location, or one that names nowhere we recognise, is not blocked:
// nobody is dropped on a guess about where they live.
export function isLocationBlocked(location: string | undefined, keys: Pick<ExclusionKeys, "countries">) {
  if (!keys.countries.size) return false;
  const country = resolveLeadCountry(location);
  return Boolean(country && keys.countries.has(country));
}

export function isLeadExcluded(
  lead: { linkedInUrl?: string; company?: string; location?: string },
  keys: ExclusionKeys,
) {
  const profile = profileExclusionKey(lead.linkedInUrl || "");
  if (profile && keys.profiles.has(profile)) return true;
  const company = companyExclusionKey(lead.company || "");
  if (company && keys.companies.has(company)) return true;
  return isLocationBlocked(lead.location, keys);
}
