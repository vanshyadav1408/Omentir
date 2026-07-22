import assert from "node:assert/strict";
import test from "node:test";
import { parseLinkedInLeadCsv } from "../src/lib/linkedin-csv.ts";

test("CSV outreach import accepts common headers, quoted fields, and removes duplicates", () => {
  const leads = parseLinkedInLeadCsv([
    "LinkedIn URL,First Name,Last Name,Title,Company,Location",
    'https://linkedin.com/in/jane-doe,Jane,Doe,"VP, Sales",Acme,London',
    "https://www.linkedin.com/in/jane-doe/,Jane,Doe,VP Sales,Acme,London",
  ].join("\n"));

  assert.equal(leads.length, 1);
  assert.deepEqual(leads[0], {
    linkedInUrl: "https://www.linkedin.com/in/jane-doe",
    name: "Jane Doe",
    title: "VP, Sales",
    company: "Acme",
    location: "London",
  });
});

test("CSV outreach import rejects company pages because outreach targets people", () => {
  assert.throws(
    () => parseLinkedInLeadCsv("LinkedIn URL\nhttps://linkedin.com/company/acme"),
    /person profile URL/,
  );
});
