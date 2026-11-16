import { describe, expect, test } from "bun:test";
import type { LeadPreview } from "@/lib/server/types";
import {
  leadPageQueryString,
  pageLeads,
  parseLeadPageQuery,
} from "./lead-page";

function lead(overrides: Partial<LeadPreview> & { id: string }): LeadPreview {
  return {
    groupIds: ["g1"],
    linkedInUrl: "",
    name: overrides.id,
    title: "",
    company: "",
    location: "",
    fitScore: 50,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  } as LeadPreview;
}

const groups = [{ id: "g1" }, { id: "g2" }];

describe("Leads page rows", () => {
  test("leave out leads whose groups are all gone, including legacy orphans", () => {
    const page = pageLeads(
      [
        lead({ id: "live" }),
        lead({ id: "deleted-group", groupIds: ["gone"] }),
        lead({ id: "orphan", groupIds: [] }),
      ],
      groups,
      {},
    );
    expect(page.leads.map((item) => item.id)).toEqual(["live"]);
    expect(page.total).toBe(1);
  });

  test("a group tab shows only that group's leads", () => {
    const page = pageLeads(
      [lead({ id: "one" }), lead({ id: "two", groupIds: ["g2"] }), lead({ id: "both", groupIds: ["g1", "g2"] })],
      groups,
      { groupId: "g2" },
    );
    expect(page.leads.map((item) => item.id)).toEqual(["two", "both"]);
  });

  test("search is a case-insensitive substring on name, company or title", () => {
    const leads = [
      lead({ id: "by-name", name: "Priya Raman" }),
      lead({ id: "by-company", company: "Ramanujan Labs" }),
      lead({ id: "by-title", title: "Head of RAMAN spectroscopy" }),
      lead({ id: "no-match", name: "Bo", location: "Raman Street" }),
    ];
    const page = pageLeads(leads, groups, { search: "  raman " });
    expect(page.leads.map((item) => item.id)).toEqual(["by-name", "by-company", "by-title"]);
    expect(page.search).toBe("raman");
  });

  test("best fit first, equal scores keep the workspace list order", () => {
    const page = pageLeads(
      [
        lead({ id: "a", fitScore: 60 }),
        lead({ id: "b", fitScore: 90 }),
        lead({ id: "c", fitScore: 60 }),
        lead({ id: "unscored", fitScore: undefined as unknown as number }),
      ],
      groups,
      {},
    );
    expect(page.leads.map((item) => item.id)).toEqual(["b", "a", "c", "unscored"]);
  });

  test("pages slice the sorted list and report the total across pages", () => {
    const leads = Array.from({ length: 60 }, (_, index) => lead({ id: `l${index}`, fitScore: 100 - index }));
    const page = pageLeads(leads, groups, { page: 3, perPage: 25 });
    expect(page.leads.map((item) => item.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => `l${50 + index}`),
    );
    expect(page).toMatchObject({ total: 60, page: 3, perPage: 25 });
  });

  test("a page past the end comes back as the last page, as the old client did", () => {
    const leads = Array.from({ length: 30 }, (_, index) => lead({ id: `l${index}` }));
    const page = pageLeads(leads, groups, { page: 9, perPage: 25 });
    expect(page.page).toBe(2);
    expect(page.leads).toHaveLength(5);
  });

  test("no matches is page 1 of 0, not an error", () => {
    const page = pageLeads([lead({ id: "a" })], groups, { search: "zzz", page: 4 });
    expect(page).toMatchObject({ total: 0, page: 1, leads: [] });
  });
});

describe("Leads page query strings", () => {
  test("the default view is an empty query, so its resource name stays plain for the early fetch and IndexedDB", () => {
    expect(leadPageQueryString({})).toBe("");
    expect(leadPageQueryString({ groupId: "all", search: " ", page: 1, perPage: 100 })).toBe("");
  });

  test("commas in a search are encoded, because resource names are split on commas", () => {
    const query = leadPageQueryString({ search: "acme, inc" });
    expect(query).not.toContain(",");
    expect(parseLeadPageQuery(query).search).toBe("acme, inc");
  });

  test("round-trips every field and rejects page sizes the UI does not offer", () => {
    const query = leadPageQueryString({ groupId: "g2", search: "cto", page: 3, perPage: 50 });
    expect(parseLeadPageQuery(query)).toEqual({ groupId: "g2", search: "cto", page: 3, perPage: 50 });
    expect(parseLeadPageQuery("per=5000&page=-2")).toEqual({
      groupId: "all",
      search: "",
      page: 1,
      perPage: 100,
    });
  });

  test("the page echoes its query key so the view can tell a stale page from the one it asked for", () => {
    const page = pageLeads([lead({ id: "a" })], groups, { groupId: "g1", search: "a" });
    expect(page.key).toBe(leadPageQueryString({ groupId: "g1", search: "a" }));
  });
});
