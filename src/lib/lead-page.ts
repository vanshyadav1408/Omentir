// One page of the Leads table, cut on the server. The rules are the ones the
// Leads page used to apply in the browser to the whole workspace list, so the
// table shows the same rows in the same order:
// - only leads that still belong to a live group (deleting a group deletes its
//   leads; this also hides legacy orphans with empty groupIds),
// - an optional group tab,
// - a case-insensitive substring search on name, company and title,
// - highest fit score first, ties keep the list's own order.

import type { Group, LeadPreview } from "@/lib/server/types";

export const ALL_LEADS_GROUP = "all";
export const LEAD_PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_LEAD_PAGE_SIZE = 100;

export type LeadPageQuery = {
  groupId: string;
  search: string;
  page: number;
  perPage: number;
};

export type LeadPage = {
  leads: LeadPreview[];
  /** Matching leads across every page. */
  total: number;
  /** The page actually returned: a page past the end clamps to the last one. */
  page: number;
  perPage: number;
  groupId: string;
  search: string;
  /** leadPageQueryString of the request, so a view can tell which query it is showing. */
  key: string;
};

export const DEFAULT_LEAD_PAGE_QUERY: LeadPageQuery = {
  groupId: ALL_LEADS_GROUP,
  search: "",
  page: 1,
  perPage: DEFAULT_LEAD_PAGE_SIZE,
};

export const EMPTY_LEAD_PAGE: LeadPage = {
  leads: [],
  total: 0,
  page: 1,
  perPage: DEFAULT_LEAD_PAGE_SIZE,
  groupId: ALL_LEADS_GROUP,
  search: "",
  key: "",
};

function normalizeLeadPageQuery(query: Partial<LeadPageQuery>): LeadPageQuery {
  const perPage = LEAD_PAGE_SIZES.includes(query.perPage as (typeof LEAD_PAGE_SIZES)[number])
    ? (query.perPage as number)
    : DEFAULT_LEAD_PAGE_SIZE;
  const page = Number.isFinite(query.page) && (query.page as number) >= 1
    ? Math.floor(query.page as number)
    : 1;
  return {
    groupId: query.groupId?.trim() || ALL_LEADS_GROUP,
    search: query.search?.trim() || "",
    page,
    perPage,
  };
}

/**
 * Query string for a page request. The default view (first page of All
 * contacts, 100 rows, no search) is "", so its resource name stays the plain
 * "leadPage" that the early fetch, the warmer and IndexedDB use.
 */
export function leadPageQueryString(query: Partial<LeadPageQuery>) {
  const normalized = normalizeLeadPageQuery(query);
  const params = new URLSearchParams();
  if (normalized.groupId !== ALL_LEADS_GROUP) params.set("group", normalized.groupId);
  if (normalized.search) params.set("q", normalized.search);
  if (normalized.page !== 1) params.set("page", String(normalized.page));
  if (normalized.perPage !== DEFAULT_LEAD_PAGE_SIZE) params.set("per", String(normalized.perPage));
  return params.toString();
}

export function parseLeadPageQuery(queryString: string): LeadPageQuery {
  const params = new URLSearchParams(queryString);
  return normalizeLeadPageQuery({
    groupId: params.get("group") || undefined,
    search: params.get("q") || undefined,
    page: Number(params.get("page") || 1),
    perPage: Number(params.get("per") || DEFAULT_LEAD_PAGE_SIZE),
  });
}

export function pageLeads(
  leads: LeadPreview[],
  groups: Array<Pick<Group, "id">>,
  query: Partial<LeadPageQuery>,
): LeadPage {
  const normalized = normalizeLeadPageQuery(query);
  const liveGroupIds = new Set(groups.map((group) => group.id));
  const q = normalized.search.toLowerCase();
  const matching = leads.filter((lead) => {
    const groupIds = lead.groupIds || [];
    if (!groupIds.some((id) => liveGroupIds.has(id))) return false;
    if (normalized.groupId !== ALL_LEADS_GROUP && !groupIds.includes(normalized.groupId)) {
      return false;
    }
    if (!q) return true;
    return (
      (lead.name || "").toLowerCase().includes(q) ||
      (lead.company || "").toLowerCase().includes(q) ||
      (lead.title || "").toLowerCase().includes(q)
    );
  });
  // Array.prototype.sort is stable, so equal scores keep the list's order.
  matching.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));

  const total = matching.length;
  const totalPages = Math.max(1, Math.ceil(total / normalized.perPage));
  const page = Math.min(normalized.page, totalPages);
  const start = (page - 1) * normalized.perPage;
  return {
    leads: matching.slice(start, start + normalized.perPage),
    total,
    page,
    perPage: normalized.perPage,
    groupId: normalized.groupId,
    search: normalized.search,
    key: leadPageQueryString(normalized),
  };
}
