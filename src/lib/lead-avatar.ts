// LinkedIn serves headshots from media.licdn.com with a short-lived token.
// The app stored that URL and rendered <img src> with no fallback, so a 403
// looked like a missing photo. Keep extraction to real https URLs, hide the
// image when it fails, and offer a same-origin proxy as a second try.

const AVATAR_KEYS = [
  "profile_picture_url_large",
  "profilePictureUrlLarge",
  "public_picture_url",
  "publicPictureUrl",
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

export function httpsAvatarUrl(value: unknown, depth = 0): string | undefined {
  if (value == null || depth > 3) return undefined;

  if (typeof value === "string") {
    const cleaned = value.replace(/&amp;/gi, "&").trim();
    return looksLikeHttpsUrl(cleaned) ? cleaned : undefined;
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

  const nestedContainers = [record.urls, record.picture, record.avatar, record.image, record.profile_picture];
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
// instant the CDN 404s, and hitting our proxy just repeats the miss.
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

export function proxiedAvatarUrl(url: string, nowMs = Date.now()) {
  if (!isLinkedInMediaUrl(url) || isExpiredLinkedInMediaUrl(url, nowMs)) return undefined;
  return `/api/app/avatar?u=${encodeURIComponent(url)}`;
}

// Same-origin photo keyed by lead, so the UI still has a headshot after the
// LinkedIn CDN token in avatarUrl expires.
export function durableLeadAvatarUrl(leadId?: string) {
  const id = leadId?.trim();
  if (!id) return undefined;
  return `/api/app/avatar?leadId=${encodeURIComponent(id)}`;
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
