import { describe, expect, test } from "bun:test";
import { markdownToPortableText } from "./cms/markdown-to-portable-text";
import { blogPostToMarkdown, seoPageToMarkdown } from "./public-page-markdown";

describe("CMS markdown twins", () => {
  test("uses the Sanity blog title and body so a Studio edit is what agents read", () => {
    const markdown = blogPostToMarkdown({
      slug: "introducing-omentir-v2",
      title: "Sanity CMS title",
      description: "Sanity description",
      publishedDate: "August 12, 2026",
      updatedDate: "August 12, 2026",
      category: "Updates",
      readTime: "5 min read",
      bannerSrc: "/introducing-omentir-v2.avif",
      bannerAlt: "v2",
      keywords: ["omentir v2"],
      featuredInLlms: true,
      highIntent: false,
      body: markdownToPortableText("## New pricing\n\nPro is $49.\n\n## Frequently asked questions"),
      faqItems: [{ question: "What is v2?", answer: "The current product." }],
    });
    expect(markdown).toContain("# Sanity CMS title");
    expect(markdown).toContain("Sanity description");
    expect(markdown).toContain("## New pricing");
    expect(markdown).toContain("**What is v2?**");
    expect(markdown.match(/## Frequently asked questions/g)?.length).toBe(1);
  });

  test("uses the Sanity feature title and sections so the .md twin matches the HTML page", () => {
    const markdown = seoPageToMarkdown("/features", {
      slug: "lead-finders",
      title: "Sanity lead finders",
      description: "Sanity feature description",
      summary: "ICP search from Studio.",
      publishedDate: "August 12, 2026",
      updatedDate: "August 12, 2026",
      keywords: ["lead finders"],
      sections: [
        {
          id: "why",
          heading: "Why My Product matters",
          paragraphs: ["Discovery quality follows the ICP you typed in Studio."],
        },
      ],
      faqItems: [],
    });
    expect(markdown).toContain("# Sanity lead finders");
    expect(markdown).toContain("Sanity feature description");
    expect(markdown).toContain("Discovery quality follows the ICP you typed in Studio.");
  });
});
