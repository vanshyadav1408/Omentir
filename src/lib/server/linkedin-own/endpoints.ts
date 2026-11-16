// Every LinkedIn internal endpoint the own client calls, in one place.
//
// These are what linkedin.com's own web app calls. LinkedIn rotates GraphQL
// query ids and decoration versions without notice; when a call starts
// failing with 400/404/500, capture the current value from a logged-in
// browser (DevTools > Network, filter "voyager") and update it here. Nothing
// else in the client hard-codes a path, query id or decoration.
//
// Status: every read below was checked against a live session on 2026-11-11.
// The writes (createInvitation, withdrawInvitation, createMessage,
// uploadMedia) have not been exercised live yet.
//
// linkedin.com's own pages no longer call most of these (the site moved to
// /flagship-web/rsc-action), so DevTools only shows the messaging ones now.
// The rest still answer, but a replacement has to be found by probing.
//
// Rest.li 2.0 treats ":" as syntax: a literal colon inside a query value must
// be percent-encoded or LinkedIn answers 400.

import { restliEncode, restliList } from "./voyager";

export const VOYAGER_BASE = "https://www.linkedin.com/voyager/api";

export const ACCEPT_NORMALIZED = "application/vnd.linkedin.normalized+json+2.1";
export const ACCEPT_GRAPHQL = "application/graphql";

export const QUERY_IDS = {
  // Serves people, companies and posts. The older b0928897... id still answers
  // people and companies but returns post results as empty items.
  search: "voyagerSearchDashClusters.5ba32757c00b31aea747c8bebb92855c",
  // What linkedin.com/messaging sends when its conversation list scrolls.
  conversations: "messengerConversations.cee0648f17e09c88a360194008a806c5",
  messages: "messengerMessages.5846eeb71c981f11e0134cb6626cc314",
  messagesBefore: "messengerMessages.4088d03bc70c91c3fa68965cb42336de",
} as const;

export const DECORATIONS = {
  fullProfile: "com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-93",
  company: "com.linkedin.voyager.deco.organization.web.WebFullCompanyMain-12",
  reactions: "com.linkedin.voyager.dash.deco.social.ReactionsByTypeWithProfileActions-13",
  invitationCreate:
    "com.linkedin.voyager.dash.deco.relationships.InvitationCreationResultWithInvitee-3",
  connections: "com.linkedin.voyager.dash.deco.web.mynetwork.ConnectionListWithProfile-16",
  typeahead: "com.linkedin.voyager.dash.deco.search.typeahead.ReusableTypeaheadCollection-27",
} as const;

// Paths are relative to VOYAGER_BASE. Query strings are pre-built because
// Rest.li syntax (List(...), (key:value)) must not be re-encoded by
// URLSearchParams.
export const endpoints = {
  me: () => "/me",

  profile: (identifier: string) =>
    `/identity/dash/profiles?q=memberIdentity&memberIdentity=${restliEncode(identifier)}&decorationId=${DECORATIONS.fullProfile}`,

  // Connection state with one member: connected, or how far away they are.
  // (The old /identity/profiles/{id}/networkinfo answers 410 Gone.)
  memberRelationship: (memberId: string) =>
    `/voyagerRelationshipsDashMemberRelationships/${restliEncode(`urn:li:fsd_memberRelationship:${memberId}`)}`,

  search: (input: {
    keywords?: string;
    resultType: "PEOPLE" | "COMPANIES" | "CONTENT";
    filters: Array<{ key: string; values: string[] }>;
    start: number;
    count: number;
  }) => {
    const parameters = [
      ...input.filters.filter((filter) => filter.values.length),
      { key: "resultType", values: [input.resultType] },
    ]
      .map((filter) => `(key:${filter.key},value:${restliList(filter.values)})`)
      .join(",");
    const keywords = input.keywords?.trim() ? `keywords:${restliEncode(input.keywords.trim())},` : "";
    const variables =
      `(start:${input.start},origin:FACETED_SEARCH,query:(${keywords}flagshipSearchIntent:SEARCH_SRP,` +
      `queryParameters:List(${parameters}),includeFiltersInResponse:false))`;
    return `/graphql?variables=${variables}&queryId=${QUERY_IDS.search}`;
  },

  // The old /typeahead/hitsV2 answers 404. `query` is required even when empty.
  typeahead: (type: "GEO" | "COMPANY", keywords: string) =>
    `/voyagerSearchDashReusableTypeahead?decorationId=${DECORATIONS.typeahead}&keywords=${restliEncode(keywords)}&q=type&type=${type}&query=${
      type === "GEO"
        ? "(typeaheadFilterQuery:(geoSearchTypes:List(MARKET_AREA,COUNTRY_REGION,ADMIN_DIVISION_1,CITY)))"
        : "()"
    }`,

  companyByUniversalName: (universalName: string) =>
    `/organization/companies?decorationId=${DECORATIONS.company}&q=universalName&universalName=${restliEncode(universalName)}`,

  companyById: (companyId: string) =>
    `/organization/companies/${encodeURIComponent(companyId)}?decorationId=${DECORATIONS.company}`,

  profileUpdates: (memberUrn: string, count: number) =>
    `/identity/profileUpdatesV2?count=${count}&start=0&q=memberShareFeed&moduleKey=member-shares%3Aphone&includeLongTermHistory=true&profileUrn=${restliEncode(memberUrn)}`,

  companyUpdates: (universalName: string, count: number) =>
    `/feed/updates?count=${count}&start=0&q=companyFeedByUniversalName&moduleKey=member-share&companyUniversalName=${restliEncode(universalName)}`,

  post: (activityId: string) =>
    `/feed/updates/${encodeURIComponent(`urn:li:activity:${activityId}`)}`,

  // updateId is the post without its urn prefix: "activity:123" or "ugcPost:123".
  comments: (updateId: string, count: number) =>
    `/feed/comments?count=${count}&start=0&q=comments&sortOrder=RELEVANCE&updateId=${restliEncode(updateId)}`,

  // threadUrn is the post's share urn (urn:li:ugcPost:... or urn:li:share:...).
  // The activity urn is accepted too but always answers with zero reactions.
  reactions: (threadUrn: string, count: number) =>
    `/voyagerSocialDashReactions?decorationId=${DECORATIONS.reactions}&count=${count}&q=reactionType&start=0&threadUrn=${restliEncode(threadUrn)}`,

  createInvitation: () =>
    `/voyagerRelationshipsDashMemberRelationships?action=verifyQuotaAndCreateV2&decorationId=${DECORATIONS.invitationCreate}`,

  sentInvitations: (start: number, count: number) =>
    `/relationships/sentInvitationViewsV2?count=${count}&start=${start}&invitationType=CONNECTION&q=invitationType`,

  withdrawInvitation: (invitationId: string) =>
    `/relationships/invitations/${encodeURIComponent(invitationId)}?action=withdraw`,

  connections: (start: number, count: number) =>
    `/relationships/dash/connections?decorationId=${DECORATIONS.connections}&count=${count}&q=search&sortType=RECENTLY_ADDED&start=${start}`,

  // Newest first, 20 a page. The first page takes no cursor; each next page
  // takes the nextCursor the previous one returned. (`lastUpdatedBefore` is
  // accepted but ignored: it answers with the first page again.) INBOX is
  // every conversation in the Focused and Other tabs; linkedin.com itself asks
  // for PRIMARY_INBOX (Focused only), which would miss replies filed in Other.
  conversations: (mailboxUrn: string, nextCursor?: string) =>
    `/voyagerMessagingGraphQL/graphql?queryId=${QUERY_IDS.conversations}&variables=(query:(predicateUnions:List((conversationCategoryPredicate:(category:INBOX)))),count:20,mailboxUrn:${restliEncode(mailboxUrn)}${
      nextCursor ? `,nextCursor:${restliEncode(nextCursor)}` : ""
    })`,

  messages: (conversationUrn: string, deliveredBefore?: number) =>
    deliveredBefore
      ? `/voyagerMessagingGraphQL/graphql?queryId=${QUERY_IDS.messagesBefore}&variables=(deliveredAt:${deliveredBefore},conversationUrn:${restliEncode(conversationUrn)},countBefore:20,countAfter:0)`
      : `/voyagerMessagingGraphQL/graphql?queryId=${QUERY_IDS.messages}&variables=(conversationUrn:${restliEncode(conversationUrn)})`,

  createMessage: () => "/voyagerMessagingDashMessengerMessages?action=createMessage",
  uploadMedia: () => "/voyagerVideoDashMediaUploadMetadata?action=upload",

  sduiWithdrawInvitation: () =>
    "/flagship-web/rsc-action/actions/server-request?sduiid=com.linkedin.sdui.requests.mynetwork.addaWithdrawInvitation",

  ssrSearchPage: (input: {
    resultType: "PEOPLE" | "COMPANIES" | "CONTENT";
    keywords?: string;
    filters: Array<{ key: string; values: string[] }>;
    page: number;
  }) => {
    const segment =
      input.resultType === "PEOPLE"
        ? "people"
        : input.resultType === "COMPANIES"
          ? "companies"
          : "content";
    const params = new URLSearchParams();
    if (input.keywords?.trim()) params.set("keywords", input.keywords.trim());
    params.set("origin", "FACETED_SEARCH");
    for (const filter of input.filters) {
      if (filter.values.length) params.set(filter.key, JSON.stringify(filter.values));
    }
    if (input.page > 1) params.set("page", String(input.page));
    return `/search/results/${segment}/?${params.toString()}`;
  },
};

// LinkedIn people-search company-size filter codes.
export function companySizeCodes(range: { min: number; max: number }) {
  const buckets: Array<[string, number, number]> = [
    ["B", 1, 10],
    ["C", 11, 50],
    ["D", 51, 200],
    ["E", 201, 500],
    ["F", 501, 1000],
    ["G", 1001, 5000],
    ["H", 5001, 10000],
    ["I", 10001, Number.POSITIVE_INFINITY],
  ];
  const max = range.max > 0 ? range.max : Number.POSITIVE_INFINITY;
  return buckets
    .filter(([, from, to]) => from <= max && to >= Math.max(1, range.min))
    .map(([code]) => code);
}
