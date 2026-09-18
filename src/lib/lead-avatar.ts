// LinkedIn serves headshots from media.licdn.com with a short-lived token.
// The app stored that URL and rendered <img src> with no fallback, so a 403
// looked like a missing photo. Keep extraction to real https URLs, hide the
// image when it fails, and offer a same-origin proxy as a second try.

const AVATAR_KEYS = [
  "profile_picture_url_large",
  "profilePictureUrlLarge",
  "public_picture_url_large",
  "publicPictureUrlLarge",
  "public_picture_url",
  "publicPictureUrl",
  "private_picture_download_url",
  "privatePictureDownloadUrl",
  "profile_picture_url",
  "profilePictureUrl",
  "profile_image_url",
  "profileImageUrl",
  "picture_url",
  "pictureUrl",
  "avatar_url",
  "avatarUrl",
  "image_url",
  "imageUrl",
  "url",
  "large",
  "original",
  "medium",
  "small",
];

function looksLikeHttpsUrl(value: string) {
  if (!/^https:\/\//i.test(value) || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function looksLikeAvatarUrl(value: string) {
  if (!looksLikeHttpsUrl(value)) return false;
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/\.$/, "");
    // Profile pages are https and used to be stored as avatarUrl, so every
    // <img> 404ed. Headshots live on licdn (or another image host), not linkedin.com.
    if (host === "linkedin.com" || host.endsWith(".linkedin.com")) return false;
    return true;
  } catch {
    return false;
  }
}

function cleanedAvatarString(value: string) {
  let cleaned = value.replace(/&amp;/gi, "&").trim();
  if (cleaned.startsWith("//") && !cleaned.startsWith("///")) {
    cleaned = `https:${cleaned}`;
  } else if (/^http:\/\/(?:[\w.-]+\.)?licdn\.com\b/i.test(cleaned)) {
    cleaned = `https:${cleaned.slice("http:".length)}`;
  }
  return cleaned;
}

export function httpsAvatarUrl(value: unknown, depth = 0): string | undefined {
  if (value == null || depth > 3) return undefined;

  if (typeof value === "string") {
    const cleaned = cleanedAvatarString(value);
    return looksLikeAvatarUrl(cleaned) ? cleaned : undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value.slice(0, 6)) {
      const found = httpsAvatarUrl(item, depth + 1);
      if (found) return found;
    }
    return undefined;
  }

  if (typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  for (const key of AVATAR_KEYS) {
    if (!(key in record)) continue;
    const found = httpsAvatarUrl(record[key], depth + 1);
    if (found) return found;
  }

  const nestedContainers = [
    record.urls,
    record.picture,
    record.avatar,
    record.image,
    record.profile_picture,
    record.specifics,
  ];
  for (const nested of nestedContainers) {
    if (nested === value) continue;
    const found = httpsAvatarUrl(nested, depth + 1);
    if (found) return found;
  }

  return undefined;
}

export function isLinkedInMediaUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/\.$/, "");
    return host === "licdn.com" || host.endsWith(".licdn.com");
  } catch {
    return false;
  }
}

// LinkedIn signs media URLs with `e=` (unix seconds, sometimes ms). After that
// instant the CDN often 404s. Still try the proxy: the parser false-positives,
// and LinkedIn sometimes keeps serving the file past e=.
export function linkedInMediaExpirySeconds(url: string) {
  try {
    const raw = new URL(url).searchParams.get("e");
    if (!raw) return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return null;
    return value > 1e12 ? Math.floor(value / 1000) : Math.floor(value);
  } catch {
    return null;
  }
}

export function isExpiredLinkedInMediaUrl(url: string, nowMs = Date.now()) {
  const expiry = linkedInMediaExpirySeconds(url);
  return expiry != null && expiry * 1000 <= nowMs;
}

export function proxiedAvatarUrl(url: string) {
  if (!isLinkedInMediaUrl(url)) return undefined;
  return `/api/app/avatar?u=${encodeURIComponent(url)}`;
}

// Same-origin photo keyed by lead, so the UI still has a headshot after the
// LinkedIn CDN token in avatarUrl expires.
export function durableLeadAvatarUrl(leadId?: string) {
  const id = leadId?.trim();
  if (!id) return undefined;
  return `/api/app/avatar?leadId=${encodeURIComponent(id)}`;
}

export function durableLeadAvatarUrlWithRetry(leadId: string | undefined, retry: number) {
  const base = durableLeadAvatarUrl(leadId);
  if (!base) return undefined;
  if (retry <= 0) return base;
  return `${base}&r=${retry}`;
}

// Unipile GET /users/{id} accepts a provider id (ACo...) or a profile URL.
export function leadAvatarRefreshIdentifier(input: {
  providerProfileId?: string;
  linkedInUrl?: string;
}) {
  const providerId = input.providerProfileId?.trim();
  if (providerId && !providerId.includes("/")) return providerId;
  return input.linkedInUrl?.trim() || "";
}

// Provider ids go stale (Unipile 422 invalid_recipient). Keep the public
// profile URL as a second try so production can still pull a headshot.
export function leadAvatarRefreshIdentifiers(input: {
  providerProfileId?: string;
  linkedInUrl?: string;
}) {
  const seen = new Set<string>();
  const identifiers: string[] = [];
  for (const candidate of [leadAvatarRefreshIdentifier(input), input.linkedInUrl?.trim() || ""]) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    identifiers.push(candidate);
  }
  return identifiers;
}

// Server-side fetch of media.licdn.com. Expired e= tokens 404 from the VPS
// the same as from the browser; do not spend a request on a URL we already
// know is dead.
export function leadAvatarUrlCanBePersisted(rawUrl: string | undefined, nowMs = Date.now()) {
  const url = httpsAvatarUrl(rawUrl);
  if (!url) return false;
  return !isLinkedInMediaUrl(url) || !isExpiredLinkedInMediaUrl(url, nowMs);
}

// Live CDN first when the token is still valid, then the same-origin proxy
// (including URLs our e= parser already called expired; LinkedIn often still
// serves them), then the lead-keyed cache. Durable-first 404s blanked every
// row for six seconds and never tried the photo the browser could load.
export function avatarImgCandidates(
  input: { leadId?: string; avatarUrl?: string },
  nowMs = Date.now(),
) {
  const raw = httpsAvatarUrl(input.avatarUrl);
  const durable = durableLeadAvatarUrl(input.leadId);
  const direct =
    raw && (!isLinkedInMediaUrl(raw) || !isExpiredLinkedInMediaUrl(raw, nowMs)) ? raw : undefined;
  const proxy = raw ? proxiedAvatarUrl(raw) : undefined;
  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const src of [direct, proxy, durable]) {
    if (!src || seen.has(src)) continue;
    seen.add(src);
    candidates.push(src);
  }
  return candidates;
}

export function personInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "?";
}
