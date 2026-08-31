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

/** Host-looking labels such as cursor.com stay white; product names go green. */
export function isHostLinkLabel(text: string) {
  return /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?$/i.test(text.trim());
}
