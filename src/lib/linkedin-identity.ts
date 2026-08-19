// Identity keys for matching the same LinkedIn person across Classic (ACo),
// Sales Navigator (ACw), vanity URLs, and webhook payloads. Provider ids are
// not interchangeable, so a public slug or unique name among a small pending
// invite set is what actually joins those records.

export type LinkedInIdentity = {
  providerProfileId?: string;
  linkedInUrl?: string;
  publicIdentifier?: string;
  name?: string;
};

function addKey(keys: Set<string>, value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (normalized) keys.add(normalized);
}

export function linkedInPathIdentifier(value?: string) {
  if (!value) return "";
  if (!value.includes("/")) return value.trim();

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const parts = url.pathname.split("/").filter(Boolean);
    const profileIndex = parts.findIndex((part) => part === "in" || part === "pub");
    return (profileIndex >= 0 ? parts[profileIndex + 1] : parts.at(-1)) || "";
  } catch {
    return value.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop() || "";
  }
}

export function linkedInIdentityKeys(identity: LinkedInIdentity) {
  const keys = new Set<string>();
  addKey(keys, identity.providerProfileId);
  addKey(keys, identity.publicIdentifier);
  addKey(keys, linkedInPathIdentifier(identity.linkedInUrl));
  return [...keys];
}

export function normalizePersonName(name?: string) {
  return (name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function pickLeadForProviderIdentity<T extends LinkedInIdentity>(
  leads: T[],
  identity: LinkedInIdentity,
): T | null {
  const eventKeys = new Set(linkedInIdentityKeys(identity));
  const idMatches = eventKeys.size
    ? leads.filter((lead) => linkedInIdentityKeys(lead).some((key) => eventKeys.has(key)))
    : [];
  if (idMatches.length === 1) return idMatches[0];
  if (idMatches.length > 1) {
    const provider = identity.providerProfileId?.trim().toLowerCase();
    if (provider) {
      const exact = idMatches.filter(
        (lead) => lead.providerProfileId?.trim().toLowerCase() === provider,
      );
      if (exact.length === 1) return exact[0];
    }
    return null;
  }

  const name = normalizePersonName(identity.name);
  if (!name) return null;
  const nameMatches = leads.filter((lead) => normalizePersonName(lead.name) === name);
  return nameMatches.length === 1 ? nameMatches[0] : null;
}

export function firstDegreeFromUnipileProfile(profile: {
  network_distance?: string;
  is_relationship?: boolean;
}) {
  if (profile.is_relationship === true) return true;
  const distance = (profile.network_distance || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, "_");
  if (
    distance === "FIRST_DEGREE" ||
    distance === "DISTANCE_1" ||
    distance === "FIRST" ||
    distance === "1"
  ) {
    return true;
  }
  if (
    distance === "SECOND_DEGREE" ||
    distance === "THIRD_DEGREE" ||
    distance === "OUT_OF_NETWORK" ||
    distance === "DISTANCE_2" ||
    distance === "DISTANCE_3" ||
    distance === "SELF"
  ) {
    return false;
  }
  if (profile.is_relationship === false) return false;
  return null;
}
