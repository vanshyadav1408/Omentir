import { describe, expect, test } from "bun:test";
import { markdownToPortableText } from "./cms/markdown-to-portable-text";
import {
  blogPostToMarkdown,
  guidePageToMarkdown,
  renderPublicMarkdown,
  seoPageToMarkdown,
} from "./public-page-markdown";

describe("CMS markdown twins", () => {
  test("writes guide tables, steps and the short answer to the .md twin so agents get the same comparison as readers", () => {
    const markdown = guidePageToMarkdown({
      slug: "openai-dots-vs-zapier-for-sales",
      title: "OpenAI Dots vs Zapier",
      description: "Which one to use.",
      query: "dots vs zapier",
      kicker: "Comparison",
      cluster: "linkedin",
      publishedDate: "October 2, 2026",
      updatedDate: "October 2, 2026",
      keywords: [],
      answer: "Zapier for fixed steps, a Dot for judgment.",
      sections: [
        {
          heading: "Side by side",
          paragraphs: ["Different jobs."],
          table: {
            headers: ["OpenAI Dots", "Zapier"],
            rows: [{ dimension: "Reads a profile", cells: ["Yes", "No"] }],
          },
          steps: [{ title: "Connect", detail: "Add the app." }],
          thread: [{ speaker: "draft", text: "Saw your SDR post." }],
          callout: "Prohibit linkedin.com.",
        },
      ],
      faqItems: [],
    });
    expect(markdown).toContain("**Short answer:** Zapier for fixed steps, a Dot for judgment.");
    expect(markdown).toContain("| | OpenAI Dots | Zapier |");
    expect(markdown).toContain("| Reads a profile | Yes | No |");
    expect(markdown).toContain("1. **Connect.** Add the app.");
    expect(markdown).toContain("- **draft:** Saw your SDR post.");
    expect(markdown).toContain("> Prohibit linkedin.com.");
  });

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

  test("keeps the security page's mailto links whole so a security team can reach us from the .md twin", async () => {
    const markdown = await renderPublicMarkdown("/security");
    expect(markdown).toContain("## Your LinkedIn account");
    expect(markdown).toContain("### Do you store our LinkedIn password?");
    expect(markdown).toContain("[vansh@omentir.com](mailto:vansh@omentir.com)");
    expect(markdown).toContain("- **Your LinkedIn password:** Never reaches Omentir.");
    expect(markdown).toContain("| Unipile | Connects to LinkedIn. |");
  });
});
