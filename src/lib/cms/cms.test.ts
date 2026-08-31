import { describe, expect, test } from "bun:test";
import { isSeoPageLive } from "@/app/seo-content/types";
import { isBlogLive } from "./index";
import { mapBlogListItem, mapHelpDraft, mapSeoPage, withHelpRelated } from "./mappers";
import { isHostLinkLabel, splitMarkdownLinks } from "./markdown-links";
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
    expect(item?.bannerSrc).toBe("https://cdn.sanity.io/images/xatqbx3d/production/banner.jpg?auto=format");
    expect(item?.bannerAlt).toBe("Product screenshot");
  });

  test("maps a Sanity CDN og image onto SEO pages so heroes are not read from public/seo", () => {
    const page = mapSeoPage(
      {
        slug: "lead-finders",
        title: "Lead finders",
        description: "Find buyers.",
        summary: "ICP search.",
        publishedDate: "August 12, 2026",
        updatedDate: "August 12, 2026",
        sections: [{ id: "why", heading: "Why", paragraphs: ["Because search is the product."] }],
        ogUrl: "https://cdn.sanity.io/images/xatqbx3d/production/lead-finders.avif",
        ogAlt: "Lead finder illustration",
      },
      "features"
    );
    expect(page?.ogImage).toEqual({
      url: "https://cdn.sanity.io/images/xatqbx3d/production/lead-finders.avif?auto=format",
      width: 1536,
      height: 1024,
      alt: "Lead finder illustration",
    });
  });

  test("ignores a public-folder bannerSrc so hosted pages cannot keep serving /public after migrate", () => {
    const item = mapBlogListItem({
      slug: "introducing-omentir-v2",
      title: "Introducing Omentir v2",
      description: "v2 notes.",
      publishedDate: "August 12, 2026",
      bannerSrc: "/find-your-next-10-customers-banner.avif",
    });
    expect(item?.bannerSrc).toBe("");
  });

  test("asks Sanity CDN to pick a format so the page does not depend on Next decoding AVIF", async () => {
    const { sanityImageUrl } = await import("@/sanity/lib/image");
    expect(sanityImageUrl("https://cdn.sanity.io/images/xatqbx3d/production/banner.jpg")).toBe(
      "https://cdn.sanity.io/images/xatqbx3d/production/banner.jpg?auto=format"
    );
    expect(sanityImageUrl("/find-your-next-10-customers-banner.avif")).toBeUndefined();
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

  test("roundtrips a markdown image so body screenshots stay in the CMS instead of becoming a paragraph", () => {
    const markdown = "![API key screen](/agent-api-key-creation.avif)";
    const blocks = markdownToPortableText(markdown);
    expect(blocks[0]).toMatchObject({ _type: "image", src: "/agent-api-key-creation.avif" });
  });

  test("writes a Sanity CDN image to markdown so .md twins do not point at deleted public files", () => {
    const blocks = markdownToPortableText("![API key screen](https://cdn.sanity.io/images/xatqbx3d/production/key.avif)");
    expect(portableTextToMarkdown(blocks)).toContain(
      "![API key screen](https://cdn.sanity.io/images/xatqbx3d/production/key.avif?auto=format)"
    );
  });
});

describe("SEO crawl helpers", () => {
  test("keeps a CMS title when article metadata is passed so ALL_BLOGS cannot overwrite a Sanity edit", async () => {
    const { createPageMetadata } = await import("@/app/seo");
    const metadata = createPageMetadata({
      title: "Sanity CMS title",
      description: "Sanity description",
      path: "/blogs/introducing-omentir-v2",
      article: {
        publishedDate: "August 12, 2026",
        updatedDate: "August 12, 2026",
        category: "Updates",
      },
    });
    expect(metadata.title).toBe("Sanity CMS title");
    expect(metadata.description).toBe("Sanity description");
    expect(metadata.openGraph).toMatchObject({ type: "article" });
  });

  test("does not prefix a Sanity CDN banner with the site origin", async () => {
    const { absoluteAssetUrl } = await import("@/app/seo");
    expect(absoluteAssetUrl("https://cdn.sanity.io/images/xatqbx3d/production/banner.jpg")).toBe(
      "https://cdn.sanity.io/images/xatqbx3d/production/banner.jpg"
    );
    expect(absoluteAssetUrl("/find-your-next-10-customers-banner.avif")).toContain(
      "/find-your-next-10-customers-banner.avif"
    );
  });
});

describe("portable text heading ids", () => {
  test("reads nested React children so TOC jump links still match rendered h2 ids", async () => {
    const { headingId, headingIdFromBlock, tocFromBody } = await import("./portable-text-toc");
    const nested = [{ props: { children: [{ props: { children: "Defining the boundary" } }] } }];
    expect(headingId(nested)).toBe("defining-the-boundary");

    const blocks = markdownToPortableText("## Defining the boundary\n\nBody copy.");
    const heading = blocks.find((block) => block._type === "block" && block.style === "h2");
    expect(headingIdFromBlock(heading)).toBe("defining-the-boundary");
    expect(tocFromBody(blocks)[0]?.id).toBe("defining-the-boundary");
  });

  test("turns a markdown H1 into H2 so the page template keeps the only H1 for SEO", () => {
    const blocks = markdownToPortableText("# Page title\n\nLeft aligned body.");
    const heading = blocks.find((block) => block._type === "block" && "style" in block);
    expect(heading).toMatchObject({ style: "h2" });
    expect(blocks.some((block) => block._type === "block" && "style" in block && block.style === "h1")).toBe(
      false
    );
  });

  test("drops a migrated FAQ heading so the template does not render two FAQ h2s", async () => {
    const { withoutFaqHeadings, tocFromBody } = await import("./portable-text-toc");
    const blocks = markdownToPortableText(
      "## New pricing\n\nPro is $49.\n\n## Frequently asked questions\n\nWhat is v2?"
    );
    const body = withoutFaqHeadings(blocks);
    expect(tocFromBody(body).map((item) => item.label)).toEqual(["New pricing"]);
  });
});

describe("markdown table links", () => {
  test("keeps the words around a tool link so a job row still reads as a sentence", () => {
    expect(
      splitMarkdownLinks("[Cursor](https://cursor.com) or [Claude Code](https://claude.com/product/claude-code)")
    ).toEqual([
      { type: "link", text: "Cursor", href: "https://cursor.com" },
      { type: "text", text: " or " },
      { type: "link", text: "Claude Code", href: "https://claude.com/product/claude-code" },
    ]);
  });

  test("leaves unfinished brackets as copy so a broken cell does not swallow the rest of the row", () => {
    expect(splitMarkdownLinks("See [RankBull](https://rankbull.io) and [unfinished")).toEqual([
      { type: "text", text: "See " },
      { type: "link", text: "RankBull", href: "https://rankbull.io" },
      { type: "text", text: " and [unfinished" },
    ]);
  });

  test("treats host labels as host so cursor.com stays white while Cursor goes green", () => {
    expect(isHostLinkLabel("cursor.com")).toBe(true);
    expect(isHostLinkLabel("rankbull.io/tools")).toBe(true);
    expect(isHostLinkLabel("Cursor")).toBe(false);
    expect(isHostLinkLabel("Build the product")).toBe(false);
  });
});

describe("release date filtering", () => {
  test("fails closed when a CMS publication date is invalid so typos cannot enter indexes", () => {
    expect(isBlogLive({ publishedDate: "not-a-date" })).toBe(false);
    expect(isSeoPageLive({ publishedDate: "not-a-date" })).toBe(false);
  });
});
