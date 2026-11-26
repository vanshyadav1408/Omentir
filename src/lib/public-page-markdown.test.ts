import { describe, expect, test } from "bun:test";
import { markdownToPortableText } from "./cms/markdown-to-portable-text";
import {
  blogPostToMarkdown,
  guidePageToMarkdown,
  renderPublicMarkdown,
  seoPageToMarkdown,
} from "./public-page-markdown";

describe("Homepage markdown twin", () => {
  test("opens with the headline a visitor sees and nothing else, because assistants quote the first line as what Omentir is", async () => {
    const markdown = await renderPublicMarkdown("/");
    const h1 = markdown?.split("\n")[0] ?? "";
    // Pinned to the hero in home-story.tsx. If the headline moves or changes,
    // this fails instead of the twin silently titling itself with a fallback.
    expect(h1).toBe("# Omentir will find you customers or you pay nothing.");
    // The title once ran on into page.tsx source (the metadata keywords and
    // the FAQ array) because the match was not bounded to the headline.
    expect(h1).not.toMatch(/[{}[\];"]/);
    expect(markdown).not.toContain("keywords:");
    expect(markdown).not.toContain("const faqItems");
  });
});

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
    expect(markdown).toContain("[vansh@omentir.com](mailto:vansh@omentir.com)");
    // Reviewers check claims against the code, so the source links must survive.
    expect(markdown).toContain(
      "[session-crypto.ts](https://github.com/vanshyadav1408/Omentir/blob/main/src/lib/server/linkedin-own/session-crypto.ts)"
    );
    expect(markdown).toContain("Byteful supplies the IP address each LinkedIn account connects through.");
  });

  test("numbers legal sections in the .md twin the same way the page does, so a review can cite section numbers", async () => {
    const security = await renderPublicMarkdown("/security");
    expect(security).toContain("## 1. Your LinkedIn password");
    const guarantee = await renderPublicMarkdown("/minimum-booking-guarantee");
    expect(guarantee).toContain("## 1. Overview");
    expect(guarantee).toContain("## 10. Relationship to other terms");
    const safety = await renderPublicMarkdown("/linkedin-account-safety");
    expect(safety).toContain("## 2. Your own IP address");
  });
});
