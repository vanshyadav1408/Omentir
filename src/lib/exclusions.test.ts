import { describe, expect, test } from "bun:test";
import {
  BLOCKABLE_COUNTRIES,
  buildExclusionKeys,
  companyExclusionKey,
  isLeadExcluded,
  parseCountryExclusion,
  parseExclusionInput,
} from "./exclusions";

describe("blacklist matching", () => {
  // The blacklist exists so a customer, competitor or partner is never
  // contacted. A miss means outreach goes to someone the user said not to
  // touch, so the match has to survive how LinkedIn writes names and links.
  test("a profile link blocks that person however the link was copied", () => {
    const keys = buildExclusionKeys(parseExclusionInput("https://www.linkedin.com/in/Jane-Doe/?utm=x"));
    expect(isLeadExcluded({ linkedInUrl: "https://linkedin.com/in/jane-doe" }, keys)).toBe(true);
    expect(isLeadExcluded({ linkedInUrl: "https://www.linkedin.com/in/john-doe" }, keys)).toBe(false);
  });

  test("a company name blocks everyone at it, ignoring legal suffixes and case", () => {
    const keys = buildExclusionKeys(parseExclusionInput("Acme, Inc.\nglobex"));
    expect(isLeadExcluded({ company: "ACME" }, keys)).toBe(true);
    expect(isLeadExcluded({ company: "Globex GmbH" }, keys)).toBe(true);
    expect(isLeadExcluded({ company: "Acme Robotics" }, keys)).toBe(false);
    expect(isLeadExcluded({ company: "" }, keys)).toBe(false);
  });

  test("a LinkedIn company link matches the company name on profiles", () => {
    const [entry] = parseExclusionInput("https://www.linkedin.com/company/initech-llc/");
    expect(entry).toMatchObject({ kind: "company", key: companyExclusionKey("Initech") });
  });

  test("links that are neither a person nor a company are dropped, not saved as company names", () => {
    expect(parseExclusionInput("https://example.com/about\nhttps://www.linkedin.com/feed/")).toEqual([]);
  });

  test("duplicates collapse", () => {
    expect(parseExclusionInput("Acme\nacme inc\n ACME ")).toHaveLength(1);
  });

  test("a bare legal suffix stays itself instead of becoming empty", () => {
    expect(companyExclusionKey("Inc")).toBe("inc");
  });
});

describe("blocked countries", () => {
  // Blocking a country is a promise that nobody there is contacted. LinkedIn
  // often leaves the country out ("Mumbai", "Greater Seattle Area"), so the
  // match has to place the location first. Blocking on a guess would quietly
  // throw away real leads, so a location we cannot place stays unblocked.
  const keys = buildExclusionKeys([parseCountryExclusion("India")!]);

  test("blocks a lead whose location names the country or only one of its cities", () => {
    expect(isLeadExcluded({ location: "Bengaluru, Karnataka, India" }, keys)).toBe(true);
    expect(isLeadExcluded({ location: "Mumbai" }, keys)).toBe(true);
  });

  test("leaves people in other countries alone, even where the name looks alike", () => {
    expect(isLeadExcluded({ location: "Indianapolis, Indiana, United States" }, keys)).toBe(false);
    expect(isLeadExcluded({ location: "London, England, United Kingdom" }, keys)).toBe(false);
  });

  test("a blank or unplaceable location is not blocked", () => {
    expect(isLeadExcluded({ location: "" }, keys)).toBe(false);
    expect(isLeadExcluded({ location: "Remote" }, keys)).toBe(false);
    expect(isLeadExcluded({}, keys)).toBe(false);
  });

  test("a country block does not switch off the person and company blocks", () => {
    const mixed = buildExclusionKeys([parseCountryExclusion("India")!, ...parseExclusionInput("Acme")]);
    expect(isLeadExcluded({ company: "Acme Inc", location: "Berlin, Germany" }, mixed)).toBe(true);
    expect(isLeadExcluded({ company: "Globex", location: "Berlin, Germany" }, mixed)).toBe(false);
  });

  test("only a country we can recognise on a profile can be blocked", () => {
    expect(parseCountryExclusion("Atlantis")).toBeNull();
    expect(parseCountryExclusion(" united states ")).toEqual({
      kind: "country",
      value: "United States",
      key: "united states",
    });
  });

  test("every country Settings offers can be saved and then matches itself", () => {
    for (const country of BLOCKABLE_COUNTRIES) {
      const entry = parseCountryExclusion(country);
      expect(entry).not.toBeNull();
      expect(isLeadExcluded({ location: country }, buildExclusionKeys([entry!]))).toBe(true);
    }
  });
});
