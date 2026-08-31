export type MarkdownLinkPart =
  | { type: "text"; text: string }
  | { type: "link"; text: string; href: string };

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * CMS table cells store markdown links from the Sanity migration.
 * Split them so the renderer can turn the hrefs into real anchors
 * instead of showing the brackets as copy.
 */
export function splitMarkdownLinks(input: string): MarkdownLinkPart[] {
  const parts: MarkdownLinkPart[] = [];
  let last = 0;
  for (const match of input.matchAll(LINK)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: "text", text: input.slice(last, index) });
    parts.push({ type: "link", text: match[1], href: match[2] });
    last = index + match[0].length;
  }
  if (last < input.length) parts.push({ type: "text", text: input.slice(last) });
  return parts.length > 0 ? parts : [{ type: "text", text: input }];
}

/** Host-looking labels such as cursor.com. Product names stay "word". */
export function isHostLinkLabel(text: string) {
  return /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?$/i.test(text.trim());
}

/** omentir.com URLs stay on this origin so the tab does not leave the site. */
export function sameSitePath(href: string): string | null {
  if (href.startsWith("#")) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "omentir.com") return null;
    return `${url.pathname}${url.search}${url.hash}` || "/";
  } catch {
    return null;
  }
}
