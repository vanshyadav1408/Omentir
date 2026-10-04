import type { PortableTextBlock } from "@portabletext/types";
import { isPaidAnchor } from "@/lib/paid-placement";
import { sameSitePath } from "./markdown-links";

const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Same site with or without www counts as one destination. */
function outboundKey(href: string): string | null {
  if (sameSitePath(href)) return null;
  try {
    return new URL(href).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function spanText(block: PortableTextBlock, mark: string): string {
  return (block.children as Array<{ text?: string; marks?: string[] }>)
    .filter((child) => child.marks?.includes(mark))
    .map((child) => child.text ?? "")
    .join("");
}

function linkDefs(block: PortableTextBlock): Array<{ key: string; href: string; text: string }> {
  if (block._type !== "block" || !Array.isArray(block.markDefs) || !Array.isArray(block.children)) {
    return [];
  }
  return block.markDefs
    .filter((def) => def._type === "link" && typeof def.href === "string")
    .map((def) => ({ key: def._key, href: def.href as string, text: spanText(block, def._key) }));
}

/**
 * Posts link the same product over and over (one post linked 11x.ai 24
 * times). Keep one link to each outside site, the first in reading order,
 * and leave every other mention as plain text. If the post carries the
 * contracted paid anchor, that anchor is the site's one link instead.
 * Internal links are untouched.
 */
export function dedupeOutboundLinks(blocks: PortableTextBlock[]): PortableTextBlock[] {
  const linked = new Set<string>();
  for (const block of blocks) {
    for (const def of linkDefs(block)) {
      const key = outboundKey(def.href);
      if (key && isPaidAnchor(def.href, def.text)) linked.add(key);
    }
  }

  function keep(href: string, text: string): boolean {
    const key = outboundKey(href);
    if (!key || isPaidAnchor(href, text)) return true;
    if (linked.has(key)) return false;
    linked.add(key);
    return true;
  }

  function dedupeMarkdown(text: string): string {
    return text.replace(MARKDOWN_LINK, (whole, label: string, href: string) =>
      keep(href, label) ? whole : label
    );
  }

  return blocks.map((block) => {
    const value = block as unknown as Record<string, unknown>;

    if (value._type === "contentTable") {
      const headers = Array.isArray(value.headers) ? (value.headers as string[]) : [];
      const rows = Array.isArray(value.rows) ? (value.rows as Array<{ cells?: string[] }>) : [];
      return {
        ...block,
        headers: headers.map((header) => (typeof header === "string" ? dedupeMarkdown(header) : header)),
        rows: rows.map((row) => ({
          ...row,
          cells: (row.cells ?? []).map((cell) => (typeof cell === "string" ? dedupeMarkdown(cell) : cell)),
        })),
      } as PortableTextBlock;
    }

    const defs = new Map(linkDefs(block).map((def) => [def.key, def]));
    if (defs.size === 0) return block;

    // Decide per mark definition, in reading order, so a link split across
    // several spans stays whole.
    const dropped = new Set<string>();
    const decided = new Set<string>();
    for (const child of block.children as Array<{ marks?: string[] }>) {
      for (const mark of child.marks ?? []) {
        const def = defs.get(mark);
        if (!def || decided.has(mark)) continue;
        decided.add(mark);
        if (!keep(def.href, def.text)) dropped.add(mark);
      }
    }
    if (dropped.size === 0) return block;

    return {
      ...block,
      markDefs: (block.markDefs ?? []).filter((def) => !dropped.has(def._key)),
      children: block.children.map((child) => {
        const marks = (child as { marks?: string[] }).marks;
        if (!marks) return child;
        return { ...child, marks: marks.filter((mark) => !dropped.has(mark)) };
      }),
    };
  });
}
