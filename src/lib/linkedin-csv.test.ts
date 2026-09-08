import { describe, expect, test } from "bun:test";
import { decodeCsvBytes, parseLinkedInLeadCsv } from "./linkedin-csv";

function csv(lines: string[]) {
  return lines.join("\n");
}

describe("parseLinkedInLeadCsv", () => {
  test("keeps a LinkedIn list export working because those files already use a LinkedIn URL column", () => {
    const parsed = parseLinkedInLeadCsv(
      csv([
        "First Name,Last Name,Title,Company,Location,LinkedIn URL",
        "Jane,Doe,CEO,Acme,New York,https://www.linkedin.com/in/jane-doe",
        "John,Smith,CTO,Beta,Austin,https://linkedin.com/in/john-smith/",
      ]),
    );
    expect(parsed.skipped).toBe(0);
    expect(parsed.leads).toEqual([
      {
        linkedInUrl: "https://www.linkedin.com/in/jane-doe",
        name: "Jane Doe",
        title: "CEO",
        company: "Acme",
        location: "New York",
      },
      {
        linkedInUrl: "https://www.linkedin.com/in/john-smith",
        name: "John Smith",
        title: "CTO",
        company: "Beta",
        location: "Austin",
      },
    ]);
  });

  test("reads Apollo's Person Linkedin Url so a bought list does not need a renamed column", () => {
    const parsed = parseLinkedInLeadCsv(
      csv([
        "First Name,Last Name,Title,Company,Person Linkedin Url",
        "Ada,Lovelace,Founder,Analytical,https://www.linkedin.com/in/ada-lovelace",
      ]),
    );
    expect(parsed.leads[0]).toMatchObject({
      linkedInUrl: "https://www.linkedin.com/in/ada-lovelace",
      name: "Ada Lovelace",
      title: "Founder",
      company: "Analytical",
    });
  });

  test("accepts a generic URL column because people paste LinkedIn connections and spreadsheet lists that way", () => {
    const parsed = parseLinkedInLeadCsv(
      csv([
        "URL,Name,Job Title,Account Name",
        "https://www.linkedin.com/in/pat-lee,Pat Lee,VP Sales,Northwind",
      ]),
    );
    expect(parsed.leads[0]).toMatchObject({
      linkedInUrl: "https://www.linkedin.com/in/pat-lee",
      name: "Pat Lee",
      title: "VP Sales",
      company: "Northwind",
    });
  });

  test("imports a headerless column of profile URLs so a dumped list still launches outreach", () => {
    const parsed = parseLinkedInLeadCsv(
      csv([
        "https://www.linkedin.com/in/only-url",
        "www.linkedin.com/in/second-url",
      ]),
    );
    expect(parsed.leads.map((lead) => lead.linkedInUrl)).toEqual([
      "https://www.linkedin.com/in/only-url",
      "https://www.linkedin.com/in/second-url",
    ]);
    expect(parsed.leads[0]?.name).toBe("LinkedIn member");
  });

  test("imports a single headerless profile URL because a one-line paste is still a valid list", () => {
    const parsed = parseLinkedInLeadCsv("https://www.linkedin.com/in/solo-url");
    expect(parsed.leads).toHaveLength(1);
    expect(parsed.leads[0]?.linkedInUrl).toBe("https://www.linkedin.com/in/solo-url");
  });

  test("skips the notes row some tools put above the header so the real columns are still found", () => {
    const parsed = parseLinkedInLeadCsv(
      csv([
        "Notes: exported from a lead list on 2026-09-01",
        "Profile URL,Full Name,Headline",
        "https://www.linkedin.com/in/sam-ortiz,Sam Ortiz,Head of Growth",
      ]),
    );
    expect(parsed.leads).toHaveLength(1);
    expect(parsed.leads[0]).toMatchObject({
      linkedInUrl: "https://www.linkedin.com/in/sam-ortiz",
      name: "Sam Ortiz",
      title: "Head of Growth",
    });
  });

  test("skips empty cells and company pages instead of rejecting a usable list for one bad row", () => {
    const parsed = parseLinkedInLeadCsv(
      csv([
        "LinkedIn URL,Name",
        ",Blank row",
        "https://www.linkedin.com/company/acme,Acme Inc",
        "https://www.linkedin.com/in/good-lead,Good Lead",
        "https://www.linkedin.com/sales/lead/ACwAAA,Sales Nav",
      ]),
    );
    expect(parsed.leads).toEqual([
      {
        linkedInUrl: "https://www.linkedin.com/in/good-lead",
        name: "Good Lead",
        title: "",
        company: "",
        location: "",
      },
    ]);
    expect(parsed.skipped).toBe(3);
  });

  test("prefers a person LinkedIn column when a company LinkedIn column is also present", () => {
    const parsed = parseLinkedInLeadCsv(
      csv([
        "Company LinkedIn URL,Person Linkedin Url,Name",
        "https://www.linkedin.com/company/acme,https://www.linkedin.com/in/person,Person",
      ]),
    );
    expect(parsed.leads[0]?.linkedInUrl).toBe("https://www.linkedin.com/in/person");
  });

  test("reads European semicolon CSVs because Excel there does not use commas", () => {
    const parsed = parseLinkedInLeadCsv(
      csv([
        "LinkedIn URL;Name;Title",
        "https://www.linkedin.com/in/eu-lead;Eve;CFO",
      ]),
    );
    expect(parsed.leads[0]).toMatchObject({
      linkedInUrl: "https://www.linkedin.com/in/eu-lead",
      name: "Eve",
      title: "CFO",
    });
  });

  test("keeps commas inside quoted titles so a VP, Sales row is one title not an extra column", () => {
    const parsed = parseLinkedInLeadCsv(
      'LinkedIn URL,Name,Title\nhttps://www.linkedin.com/in/quoted,"Quoted Person","VP, Sales"',
    );
    expect(parsed.leads[0]?.title).toBe("VP, Sales");
  });

  test("dedupes the same profile with tracking query params so one person is not imported twice", () => {
    const parsed = parseLinkedInLeadCsv(
      csv([
        "LinkedIn URL",
        "https://www.linkedin.com/in/same-person?trk=people",
        "https://uk.linkedin.com/in/same-person/",
      ]),
    );
    expect(parsed.leads).toHaveLength(1);
    expect(parsed.leads[0]?.linkedInUrl).toBe("https://www.linkedin.com/in/same-person");
  });

  test("accepts classic /pub/ profile URLs that still show up on older lists", () => {
    const parsed = parseLinkedInLeadCsv(
      "LinkedIn URL\nhttps://www.linkedin.com/pub/old-member/1/234/567",
    );
    expect(parsed.leads[0]?.linkedInUrl).toBe(
      "https://www.linkedin.com/pub/old-member/1/234/567",
    );
  });

  test("fails when every row is a company or Sales Navigator link so we do not launch an empty campaign", () => {
    expect(() =>
      parseLinkedInLeadCsv(
        csv([
          "LinkedIn URL,Name",
          "https://www.linkedin.com/company/acme,Acme",
          "https://www.linkedin.com/sales/people/ACwAAA,Nav",
        ]),
      ),
    ).toThrow(/linkedin\.com\/in/);
  });

  test("fails without a profile URL column so a contacts-only sheet cannot pretend to import", () => {
    expect(() =>
      parseLinkedInLeadCsv("Name,Email\nJane,jane@acme.com"),
    ).toThrow(/LinkedIn URL/);
  });

  test("rejects more than 500 unique profiles because outreach setup caps a CSV at 500", () => {
    const rows = ["LinkedIn URL"];
    for (let index = 0; index < 501; index += 1) {
      rows.push(`https://www.linkedin.com/in/lead-${index}`);
    }
    expect(() => parseLinkedInLeadCsv(rows.join("\n"))).toThrow(/500 unique leads/);
  });
});

describe("decodeCsvBytes", () => {
  test("reads a UTF-16 LE Excel save so a Windows CSV is not parsed as garbage", () => {
    const text = "LinkedIn URL,Name\nhttps://www.linkedin.com/in/utf16,Utf";
    const bytes = new Uint8Array(2 + text.length * 2);
    bytes[0] = 0xff;
    bytes[1] = 0xfe;
    for (let index = 0; index < text.length; index += 1) {
      const code = text.charCodeAt(index);
      bytes[2 + index * 2] = code & 0xff;
      bytes[3 + index * 2] = code >> 8;
    }
    const parsed = parseLinkedInLeadCsv(decodeCsvBytes(bytes));
    expect(parsed.leads[0]?.name).toBe("Utf");
  });
});
