import { describe, expect, test } from "bun:test";
import type { PortableTextBlock } from "@portabletext/types";
import { dedupeOutboundLinks } from "./dedupe-outbound-links";

function paragraph(key: string, spans: Array<{ text: string; href?: string }>): PortableTextBlock {
  const markDefs = spans
    .map((span, index) => (span.href ? { _key: `${key}-l${index}`, _type: "link", href: span.href } : null))
    .filter((def): def is { _key: string; _type: string; href: string } => def !== null);
  return {
    _type: "block",
    _key: key,
    style: "normal",
    markDefs,
    children: spans.map((span, index) => ({
      _type: "span",
      _key: `${key}-s${index}`,
      text: span.text,
      marks: span.href ? [`${key}-l${index}`] : [],
    })),
  } as PortableTextBlock;
}

function linkedHrefs(blocks: PortableTextBlock[]): string[] {
  const hrefs: string[] = [];
  for (const block of blocks) {
    const defs = new Map((block.markDefs ?? []).map((def) => [def._key, def.href as string]));
    for (const child of block.children as Array<{ marks?: string[] }>) {
      for (const mark of child.marks ?? []) if (defs.has(mark)) hrefs.push(defs.get(mark)!);
    }
  }
  return hrefs;
}

describe("one outbound link per site per blog post", () => {
  test("a competitor named all through a post is linked only at its first mention, so we stop leaking link equity to it", () => {
    const post = [
      paragraph("a", [{ text: "Apollo", href: "https://www.apollo.io" }, { text: " has a big database." }]),
      paragraph("b", [{ text: "Apollo pricing", href: "https://apollo.io/pricing" }]),
      paragraph("c", [{ text: "Clay", href: "https://www.clay.com" }, { text: " and " }, { text: "Apollo", href: "https://www.apollo.io/" }]),
    ];
    const result = dedupeOutboundLinks(post);
    expect(linkedHrefs(result)).toEqual(["https://www.apollo.io", "https://www.clay.com"]);
    // The words stay; only the link is removed.
    expect((result[1].children as Array<{ text: string }>)[0].text).toBe("Apollo pricing");
  });

  test("internal links are not limited, because they pass equity to our own pages", () => {
    const post = [
      paragraph("a", [{ text: "pricing", href: "/pricing" }]),
      paragraph("b", [{ text: "pricing again", href: "https://omentir.com/pricing" }]),
    ];
    expect(linkedHrefs(dedupeOutboundLinks(post))).toHaveLength(2);
  });

  test("Valley also gets one link, and it is the contracted anchor even when a plain mention comes first", () => {
    const post = [
      paragraph("a", [{ text: "Valley", href: "https://www.joinvalley.co" }]),
      paragraph("b", [{ text: "AI-powered LinkedIn outreach platform", href: "https://www.joinvalley.co/" }]),
      paragraph("c", [{ text: "Valley", href: "https://www.joinvalley.co" }]),
    ];
    const result = dedupeOutboundLinks(post);
    expect(linkedHrefs(result)).toEqual(["https://www.joinvalley.co/"]);
    expect(result[1].markDefs).toHaveLength(1);
  });

  test("markdown links inside tables count toward the same one-link budget", () => {
    const post = [
      paragraph("a", [{ text: "Lusha", href: "https://www.lusha.com" }]),
      {
        _type: "contentTable",
        _key: "t",
        headers: ["Tool", "[Cognism](https://www.cognism.com)"],
        rows: [{ cells: ["[Lusha](https://www.lusha.com)", "[Cognism](https://cognism.com)"] }],
      } as unknown as PortableTextBlock,
    ];
    const table = dedupeOutboundLinks(post)[1] as unknown as { headers: string[]; rows: Array<{ cells: string[] }> };
    expect(table.headers).toEqual(["Tool", "[Cognism](https://www.cognism.com)"]);
    expect(table.rows[0].cells).toEqual(["Lusha", "Cognism"]);
  });
});
