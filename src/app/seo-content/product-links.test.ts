import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { splitMarkdownLinks } from "@/lib/cms/markdown-links";
import { linkifySeoCopy, productHref } from "./product-links";

describe("Valley paid placement", () => {
  test("Valley homepage is joinvalley.co so the paid dofollow target cannot silently drift", () => {
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

  test("renders the agreed Valley comparison anchor once, dofollow, instead of auto-linking the word Valley", () => {
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
    expect(html.match(/href="https:\/\/www\.joinvalley\.co\/?"/g)?.length).toBe(1);
    expect(html.startsWith("<p>Valley is an <a ")).toBe(true);
  });
});
