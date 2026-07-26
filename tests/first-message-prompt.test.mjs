import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const geminiSource = await readFile(
  new URL("../src/lib/server/gemini.ts", import.meta.url),
  "utf8",
);

test("first outreach earns a genuine connection before introducing the product", () => {
  assert.match(
    geminiSource,
    /The only goal is to start a genuine conversation/,
  );
  assert.match(
    geminiSource,
    /Use exactly one specific detail from their own About section, post, experience, project, or education/,
  );
  assert.match(
    geminiSource,
    /Never mention the sender, Omentir, any product, service, offer, demo, meeting, outreach, lead generation, or commercial reason for writing/,
  );
  assert.match(
    geminiSource,
    /First message omitted its genuine question; retrying later/,
  );
  assert.match(
    geminiSource,
    /The lead has not replied. Do not mention the sender, sender's company, product, service, offer, benefits, features, demo, meeting, or any commercial reason for writing/,
  );
});
