import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { splitMarkdownLinks } from "@/lib/cms/markdown-links";
import { linkifySeoCopy, linkifyProducts, ProductHomeLink, productHref } from "./product-links";

describe("outbound product links", () => {
  test("Valley homepage is joinvalley.co so the paid placement target cannot silently drift", () => {
    expect(productHref("Valley")).toBe("https://www.joinvalley.co");
  });

  test("comparison copy can store the agreed Valley anchor as markdown", () => {
    expect(
      splitMarkdownLinks(
        "Valley is an [AI-powered LinkedIn outreach platform](https://www.joinvalley.co/) that starts from that signal"
      )
    ).toEqual([
      { type: "text", text: "Valley is an " },
      {
        type: "link",
        text: "AI-powered LinkedIn outreach platform",
        href: "https://www.joinvalley.co/",
      },
      { type: "text", text: " that starts from that signal" },
    ]);
  });

  test("the paid comparison anchor is dofollow, as sold, and keeps its agreed text and destination", () => {
    const html = renderToStaticMarkup(
      createElement(
        "p",
        null,
        linkifySeoCopy(
          "Valley is an [AI-powered LinkedIn outreach platform](https://www.joinvalley.co/) that starts from that signal"
        )
      )
    );
    expect(html).toContain(">AI-powered LinkedIn outreach platform</a>");
    expect(html).toContain('href="https://www.joinvalley.co/"');
    expect(html).toContain('rel="noopener"');
    expect(html).not.toContain("nofollow");
    expect(html).not.toContain("sponsored");
    expect(html.match(/href="https:\/\/www\.joinvalley\.co\/?"/g)?.length).toBe(1);
    expect(html.startsWith("<p>Valley is an <a ")).toBe(true);
  });

  test("product links in prose and table headers are dofollow, Valley included", () => {
    const automatic = renderToStaticMarkup(createElement("p", null, linkifyProducts("Valley")));
    const header = renderToStaticMarkup(createElement(ProductHomeLink, { name: "Valley" }));
    const editorial = renderToStaticMarkup(createElement(ProductHomeLink, { name: "Apollo" }));
    for (const html of [automatic, header, editorial]) {
      expect(html).toContain('rel="noopener"');
      expect(html).not.toMatch(/nofollow|sponsored/);
    }
  });

  test("a product named many times in one block is linked once; the rest is plain text", () => {
    const html = renderToStaticMarkup(
      createElement("p", null, linkifyProducts("Apollo has data. Apollo also has sequences. Use Apollo."))
    );
    expect(html.match(/<a /g)?.length).toBe(1);
    expect(html.match(/Apollo/g)?.length).toBe(3);
  });
});
