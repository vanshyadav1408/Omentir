const ICON_REL = /(?:^|\s)(?:icon|shortcut|apple-touch-icon|apple-touch-icon-precomposed)(?:\s|$)/i;

function attr(tag: string, name: string) {
  const quoted = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  if (quoted?.[1]) return quoted[1].trim();
  const unquoted = tag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, "i"));
  return unquoted?.[1]?.trim() || "";
}

function resolveHref(href: string, pageUrl: string) {
  const trimmed = href.trim();
  if (!trimmed || /^data:/i.test(trimmed)) return null;
  try {
    return new URL(trimmed, pageUrl).toString();
  } catch {
    return null;
  }
}

function sizeScore(sizes: string) {
  const parts = sizes.match(/\d+/g);
  if (!parts?.length) return 0;
  return Math.min(256, Math.max(...parts.map(Number)));
}

function candidateScore(rel: string, type: string, sizes: string, href: string) {
  const rels = rel.toLowerCase();
  let score = 0;
  if (rels.includes("apple-touch-icon")) score += 120;
  else if (/\bicon\b/.test(rels)) score += 50;
  if (rels.includes("shortcut")) score += 10;
  if (/svg/i.test(type) || /\.svg(?:$|\?)/i.test(href)) score += 35;
  else if (/png/i.test(type) || /\.png(?:$|\?)/i.test(href)) score += 25;
  else if (/webp/i.test(type) || /\.webp(?:$|\?)/i.test(href)) score += 20;
  else if (/jpe?g/i.test(type) || /\.jpe?g(?:$|\?)/i.test(href)) score += 10;
  score += sizeScore(sizes) / 4;
  if (/\.ico(?:$|\?)/i.test(href)) score -= 8;
  return score;
}

export function parseFaviconCandidates(html: string, pageUrl: string) {
  const ranked: Array<{ href: string; score: number }> = [];
  const seen = new Set<string>();

  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = attr(tag, "rel");
    if (!ICON_REL.test(rel)) continue;
    const href = resolveHref(attr(tag, "href"), pageUrl);
    if (!href || seen.has(href)) continue;
    seen.add(href);
    ranked.push({
      href,
      score: candidateScore(rel, attr(tag, "type"), attr(tag, "sizes"), href),
    });
  }

  ranked.sort((left, right) => right.score - left.score);

  try {
    const fallback = new URL("/favicon.ico", pageUrl).toString();
    if (!seen.has(fallback)) ranked.push({ href: fallback, score: 0 });
  } catch {
    // pageUrl was not a valid absolute URL; skip the origin fallback.
  }

  return ranked.map((item) => item.href);
}

export function faviconFallbackUrl(websiteUrl: string) {
  try {
    const withProtocol = /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`;
    const host = new URL(withProtocol).hostname.replace(/\.$/, "");
    if (!host) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  } catch {
    return null;
  }
}

export function looksLikeImageContentType(contentType: string, url: string) {
  const type = contentType.toLowerCase();
  if (type.startsWith("image/")) return true;
  if (type.includes("octet-stream") && /\.(ico|png|svg|webp|jpe?g)(?:$|\?)/i.test(url)) {
    return true;
  }
  return false;
}
