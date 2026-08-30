import { describe, expect, test } from "bun:test";
import { mapBlogListItem, mapHelpDraft, mapSeoPage, withHelpRelated } from "./mappers";
import { markdownToPortableText } from "./markdown-to-portable-text";
import { portableTextToMarkdown } from "./portable-text-markdown";

describe("CMS mappers", () => {
  test("drops a feature page that has no sections because empty SEO pages are doorway spam", () => {
    const page = mapSeoPage(
      {
        slug: "lead-finders",
        title: "Lead finders",
        description: "Find buyers.",
        summary: "ICP search.",
        publishedDate: "August 12, 2026",
        updatedDate: "August 12, 2026",
        sections: [],
      },
      "features"
    );
    expect(page).toBeNull();
  });

  test("keeps family-specific connect facts on an integration so the directory does not invent a matrix row", () => {
    const page = mapSeoPage(
      {
        slug: "claude",
        title: "Claude",
        description: "Connect Claude.",
        summary: "Chat operator.",
        publishedDate: "August 12, 2026",
        updatedDate: "August 12, 2026",
        sections: [{ id: "why", heading: "Why", paragraphs: ["Because the workspace is inspectable."] }],
        connect: { surface: "MCP", auth: "Workspace approval", bestFor: "Chat operator" },
      },
      "integrations"
    );
    expect(page?.connect).toEqual({
      surface: "MCP",
      auth: "Workspace approval",
      bestFor: "Chat operator",
    });
  });

  test("resolves help related slugs from the catalog so a missing neighbor cannot ship a broken link", () => {
    const pages = withHelpRelated(
      [
        mapHelpDraft({
          slug: "a",
          question: "Question A?",
          description: "A",
          cluster: "limits",
          publishedDate: "August 19, 2026",
          paragraphs: ["Answer A"],
          faqItems: [],
          relatedSlugs: ["b", "missing"],
        })!,
        mapHelpDraft({
          slug: "b",
          question: "Question B?",
          description: "B",
          cluster: "limits",
          publishedDate: "August 19, 2026",
          paragraphs: ["Answer B"],
          faqItems: [],
          relatedSlugs: [],
        })!,
      ]
    );
    expect(pages[0]?.related).toEqual([{ label: "Question B?", href: "/help/b" }]);
  });

  test("prefers a Sanity CDN banner so an uploaded image replaces the local fallback path", () => {
    const item = mapBlogListItem({
      slug: "introducing-omentir-v2",
      title: "Introducing Omentir v2",
      description: "v2 notes.",
      publishedDate: "August 12, 2026",
      bannerSrc: "/introducing-omentir-v2.avif",
      bannerUrl: "https://cdn.sanity.io/images/xatqbx3d/production/banner.jpg",
      bannerHotspotAlt: "Product screenshot",
    });
    expect(item?.bannerSrc).toBe("https://cdn.sanity.io/images/xatqbx3d/production/banner.jpg");
    expect(item?.bannerAlt).toBe("Product screenshot");
  });
});

describe("blog portable text roundtrip", () => {
  test("keeps a heading and a link so migrated posts still have jump targets and internal links", () => {
    const markdown = "## Defining the boundary\n\nRead [account safety](/features/linkedin-account-safety).";
    const blocks = markdownToPortableText(markdown);
    const back = portableTextToMarkdown(blocks);
    expect(back).toContain("## Defining the boundary");
    expect(back).toContain("[account safety](/features/linkedin-account-safety)");
  });
});

describe("blog source extraction", () => {
  test("turns a real post into portable text with headings so the CMS renderer keeps jump targets", async () => {
    const { blogFromSource } = await import("./blog-from-source");
    const extracted = blogFromSource("introducing-omentir-v2");
    expect(extracted).toBeTruthy();
    expect(extracted!.body.length).toBeGreaterThan(3);
    const headings = extracted!.body.filter((block) => block._type === "block" && block.style === "h2");
    expect(headings.length).toBeGreaterThan(0);
    expect(extracted!.faqItems.length).toBeGreaterThan(0);
  });
});
