import { expect, test } from "bun:test";
import { decodeEntities } from "./tsx-to-markdown";

test("an escaped entity in page copy stays literal text, so '&amp;lt;' never turns into a real '<' in the markdown twin", () => {
  expect(decodeEntities("&amp;lt;script&amp;gt;")).toBe("&lt;script&gt;");
  expect(decodeEntities("Q&amp;A &lt;b&gt; &quot;hi&quot; it&#39;s")).toBe(`Q&A <b> "hi" it's`);
});
