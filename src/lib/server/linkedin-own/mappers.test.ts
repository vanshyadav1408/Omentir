import { expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
mock.module("../data", () => ({
  consumeAvatarViewBudget: async () => "ok",
  consumeProfileViewBudget: async () => true,
  listLinkedInAccounts: async () => [],
}));

// The mappers exist to feed linkedin.ts's existing normalizers. These tests run
// mapper output through the REAL normalizers, so a mapper that drifts from the
// shape they expect fails here instead of silently blanking leads in production.
const linkedin = await import("../linkedin");
const { firstDegreeFromLinkedInProfile, linkedInIdentityKeys } = await import("../../linkedin-identity");
const mappers = await import("./mappers");
const fx = await import("./test-fixtures");
const { parseOwnInvitationId, ownAccountIdForMember } = await import("./ids");

test("a profile read becomes a complete lead: name, company, location, avatar, context", () => {
  const profile = mappers.mapProfileResponse(fx.profileResponse(), "alice-example");
  expect(profile).not.toBeNull();
  const lead = linkedin.normalizeLinkedInActor(profile!);
  expect(lead).toMatchObject({
    providerProfileId: fx.ALICE,
    linkedInUrl: "https://www.linkedin.com/in/alice-example",
    name: "Alice Example",
    title: "Head of Growth at Acme Widgets",
    // The CURRENT role wins, not the first position LinkedIn happened to list.
    company: "Acme Widgets",
    location: "Berlin, Germany",
  });
  expect(lead?.avatarUrl).toBe("https://media.licdn.com/dms/image/alice/400_400/a.jpg");
  const context = linkedin.normalizeLinkedInProfileContext(profile!);
  expect(context?.skills).toEqual(["Outbound sales"]);
  // Another member's position embedded in the response must not leak in.
  expect(context?.experience.join(" ")).not.toContain("Intern");
});

test("network distance drives acceptance detection for invites", () => {
  const stranger = mappers.mapProfileResponse(fx.profileResponse("DISTANCE_2"), fx.ALICE)!;
  const connected = mappers.mapProfileResponse(fx.profileResponse("connection"), fx.ALICE)!;
  expect(firstDegreeFromLinkedInProfile(stranger)).toBe(false);
  expect(firstDegreeFromLinkedInProfile(connected)).toBe(true);
});

test("/me identifies the connected account by its member id", () => {
  const me = mappers.mapMeResponse(fx.meResponse);
  expect(me).toMatchObject({ provider_id: fx.SELF, public_identifier: "sam-owner", name: "Sam Owner" });
  expect(ownAccountIdForMember(me!.provider_id)).toBe(`own_${fx.SELF}`);
});

test("people search keeps LinkedIn's ranking and yields ids invites can use", () => {
  const people = mappers.mapPeopleSearch(fx.peopleSearchResponse);
  expect(people.map((person) => person.name)).toEqual(["Bob Sample", "Alice Example"]);
  const alice = linkedin.normalizeLinkedInActor(people[1])!;
  expect(alice.providerProfileId).toBe(fx.ALICE);
  expect(alice.linkedInUrl).toBe("https://www.linkedin.com/in/alice-example");
  // A result without a vanity url still dedupes against stored leads by id.
  expect(linkedin.profileSearchKeys(linkedin.normalizeLinkedInActor(people[0])!)).toContain(fx.BOB.toLowerCase());
  expect(mappers.searchTotal(fx.peopleSearchResponse)).toBe(2);
});

test("company lookups return the numeric id that company filters and posts need", () => {
  const company = mappers.mapCompanyResponse(fx.companyResponse);
  expect(company).toMatchObject({
    id: "4242",
    public_identifier: "acme-widgets",
    name: "Acme Widgets",
    industry: ["Software Development"],
    employee_count_range: { from: 51, to: 200 },
  });
});

test("posts carry a stable id, text, url and their real creation time", () => {
  const [post] = mappers.mapFeedUpdates(fx.feedResponse);
  expect(linkedin.getLinkedInPostId(post)).toBe(`urn:li:activity:${fx.POST_ID}`);
  expect(linkedin.getLinkedInPostText(post)).toBe("We are hiring SDRs.");
  expect(linkedin.getLinkedInPostUrl(post)).toBe(`https://www.linkedin.com/feed/update/urn:li:activity:${fx.POST_ID}/`);
  expect(linkedin.getLinkedInPostCreatedAtRaw(post)).toBe(fx.POST_TIME);
  expect(linkedin.normalizeLinkedInActor(post.author)?.linkedInUrl).toBe("https://www.linkedin.com/in/alice-example");
});

test("commenters become leads; company-page commenters are skipped", () => {
  const comments = mappers.mapComments(fx.commentsResponse);
  expect(comments).toHaveLength(2);
  const asEngagement = (item: (typeof comments)[number]) =>
    item.author_details && !("is_company" in item.author_details && item.author_details.is_company)
      ? linkedin.normalizeLinkedInActor(item.author_details as Parameters<typeof linkedin.normalizeLinkedInActor>[0])
      : null;
  expect(asEngagement(comments[0])).toMatchObject({ providerProfileId: fx.BOB, name: "Bob Sample", title: "CTO at Beta Labs" });
  expect(comments[0].text).toBe("Interested, how do you price this?");
  expect(comments[0].created_at).toBe("2026-09-02T10:00:00.000Z");
  expect(asEngagement(comments[1])).toBeNull();
});

test("reactors become leads with their reaction type", () => {
  const [reaction] = mappers.mapReactions(fx.reactionsResponse);
  expect(reaction.reaction_type).toBe("PRAISE");
  expect(linkedin.normalizeLinkedInActor(reaction.author_details)).toMatchObject({ providerProfileId: fx.BOB, name: "Bob Sample" });
});

test("sent invitations expose who is pending plus what withdraw needs", () => {
  const [invite] = mappers.mapSentInvitations(fx.sentInvitationsResponse);
  expect(parseOwnInvitationId(invite.id)).toEqual({ invitationId: "7001", sharedSecret: "s3cr3t" });
  expect(invite.parsed_datetime).toBe("2026-09-20T00:00:00.000Z");
  // The acceptance sweep matches pending invites by these identity keys.
  const keys = linkedInIdentityKeys({ providerProfileId: invite.invited_user_id, publicIdentifier: invite.invited_user_public_id });
  expect(keys).toContain(fx.ALICE.toLowerCase());
  expect(keys).toContain("alice-example");
});

test("recent connections identify accepted invites by id and vanity", () => {
  const [connection] = mappers.mapConnections(fx.connectionsResponse);
  expect(connection).toMatchObject({ provider_id: fx.BOB, public_identifier: "bob-sample" });
});

test("typeahead hits resolve to the ids search filters need", () => {
  const hits = mappers.mapTypeahead({
    data: { elements: [{ text: { text: "Germany" }, targetUrn: "urn:li:fs_geo:101282230" }, { text: { text: "No id" } }] },
  });
  expect(hits).toEqual([{ id: "101282230", title: "Germany" }]);
});

// ---- shapes LinkedIn answered with on 2026-11-11. Each of these was a live
// bug: the call succeeded and the result was silently wrong or empty.

test("a company read by id is that company, not a similar company listed beside it", () => {
  // Company posts and evidence are fetched by this id: the wrong company here
  // means discovering leads from somebody else's audience.
  expect(mappers.mapCompanyResponse(fx.companyByIdResponse)).toMatchObject({
    id: "4242",
    name: "Acme Widgets",
    public_identifier: "acme-widgets",
    industry: ["Software Development"],
    employee_count: 120,
  });
});

test("posts in a company feed keep their text and author", () => {
  // Buyer-intent scoring reads the post text; a wrapper mapped as the post
  // gives every company post an empty body.
  const [post] = mappers.mapFeedUpdates(fx.companyFeedResponse);
  expect(linkedin.getLinkedInPostText(post)).toBe("Acme Widgets raised a Series A.");
  expect(post.author).toMatchObject({ name: "Acme Widgets", is_company: true });
  expect(mappers.mapFeedUpdates(fx.companyFeedResponse)).toHaveLength(1);
});

test("keyword post search returns posts with their text, author and thread", () => {
  const [post] = mappers.mapPostSearch(fx.postSearchResponse);
  expect(linkedin.getLinkedInPostId(post)).toBe(`urn:li:activity:${fx.POST_ID}`);
  expect(linkedin.getLinkedInPostText(post)).toBe("Looking for a cold outreach tool.");
  expect(linkedin.normalizeLinkedInActor(post.author)?.linkedInUrl).toBe("https://www.linkedin.com/in/bob-sample");
  expect((post as { thread_urn?: string }).thread_urn).toBe("urn:li:share:7000000000000000002");
});

test("commenters in LinkedIn's flat actor encoding still become leads", () => {
  const [member, company] = mappers.mapComments(fx.flatCommentsResponse);
  expect(linkedin.normalizeLinkedInActor(member.author_details as Parameters<typeof linkedin.normalizeLinkedInActor>[0])).toMatchObject({
    providerProfileId: fx.BOB,
    name: "Bob Sample",
    title: "CTO at Beta Labs",
  });
  expect(company.author_details).toEqual({ is_company: true });
});

test("a reactor identified only by actorUnion still carries the id an invite needs", () => {
  const [reaction] = mappers.mapReactions(fx.actorUnionReactionsResponse);
  expect(linkedin.normalizeLinkedInActor(reaction.author_details)).toMatchObject({ providerProfileId: fx.BOB, name: "Bob Sample" });
});

test("live reaction responses ignore non-reaction entities, read detailDataUnion avatars, and drop ACo profile URLs", () => {
  const items = mappers.mapReactions({
    included: [
      { $type: "com.linkedin.voyager.dash.feed.SocialActivityCounts", entityUrn: "urn:li:fsd_socialActivityCounts:urn:li:activity:1" },
      { $type: "com.linkedin.voyager.dash.identity.profile.Profile", entityUrn: `urn:li:fsd_profile:${fx.SELF}` },
      {
        $type: "com.linkedin.voyager.dash.social.Reaction",
        reactionType: "LIKE",
        actorUnion: { profileUrn: `urn:li:fsd_profile:${fx.BOB}` },
        reactorLockup: {
          title: { text: "Bob Sample" },
          subtitle: { text: "VP Sales" },
          navigationUrl: `https://www.linkedin.com/in/${fx.BOB}`,
          image: {
            attributes: [
              {
                detailDataUnion: {
                  nonEntityProfilePicture: {
                    vectorImage: {
                      rootUrl: "https://media.licdn.com/dms/image/",
                      artifacts: [{ width: 400, fileIdentifyingUrlPathSegment: "bob.jpg" }],
                    },
                  },
                },
              },
            ],
          },
        },
      },
    ],
  });
  expect(items).toEqual([
    {
      id: `urn:li:fsd_profile:${fx.BOB}:LIKE`,
      reaction_type: "LIKE",
      author_details: {
        id: fx.BOB,
        provider_id: fx.BOB,
        name: "Bob Sample",
        headline: "VP Sales",
        profile_picture_url: "https://media.licdn.com/dms/image/bob.jpg",
      },
    },
  ]);
});

test("a member relationship read tells an accepted invite from a pending one", () => {
  expect(firstDegreeFromLinkedInProfile({ network_distance: mappers.mapMemberRelationship(fx.memberRelationshipResponse("connection")) })).toBe(true);
  expect(firstDegreeFromLinkedInProfile({ network_distance: mappers.mapMemberRelationship(fx.memberRelationshipResponse("DISTANCE_2")) })).toBe(false);
});

test("location and company lookups resolve ids from the hit's tracking urn", () => {
  expect(mappers.mapTypeahead(fx.typeaheadResponse)).toEqual([
    { id: "101282230", title: "Germany" },
    { id: "106967730", title: "Berlin, Germany" },
  ]);
});

test("a search result photo resolves when LinkedIn puts the whole url in the artifact", () => {
  const response = structuredClone(fx.peopleSearchResponse) as typeof fx.peopleSearchResponse;
  Object.assign(response.included[1], {
    image: { attributes: [{ detailData: { nonEntityProfilePicture: { vectorImage: { artifacts: [{ width: 100, fileIdentifyingUrlPathSegment: "https://media.licdn.com/dms/image/alice/100.jpg" }] } } } }] },
  });
  expect(mappers.mapPeopleSearch(response)[1].profile_picture_url).toBe("https://media.licdn.com/dms/image/alice/100.jpg");
});

test("LinkedIn's monthly search limit is recognised instead of passing as a thin result", () => {
  const limited = structuredClone(fx.peopleSearchResponse) as { included: Array<Record<string, unknown>> };
  limited.included.push({
    $type: "com.linkedin.voyager.dash.search.PromoCard",
    entityUrn: "urn:li:fsd_promoCard:1",
    subtitle: { text: "You've reached the monthly limit for profile searches." },
  });
  expect(mappers.searchLimitReached(limited)).toBe(true);
  expect(mappers.searchLimitReached(fx.peopleSearchResponse)).toBe(false);
});

test("inbox paging follows LinkedIn's cursor and ends when there is none", () => {
  expect(mappers.graphqlNextCursor(fx.graphql("messengerConversationsByCategoryQuery", [], "next-page"))).toBe("next-page");
  expect(mappers.graphqlNextCursor(fx.graphql("messengerConversationsByCategoryQuery", []))).toBeUndefined();
});

test("a conversation maps to a chat with the other person as attendee and stable message ids", () => {
  const accountId = ownAccountIdForMember(fx.SELF);
  const raw = fx.conversation("c1", fx.aliceParticipant, "2026-10-05T09:00:00Z", [
    fx.message("m2", fx.aliceParticipant, "Sounds good", "2026-10-05T09:00:00Z", {
      reactionSummaries: [{ emoji: "👍", count: 1 }],
      renderContent: [{ file: { url: "https://www.linkedin.com/dms/prv/file", name: "deck.pdf" } }],
    }),
    fx.message("m1", fx.selfParticipant, "Hi Alice", "2026-10-05T08:00:00Z"),
  ], { unreadCount: 1, read: false });
  const chat = mappers.mapConversation(raw, { accountId, selfMemberId: fx.SELF })!;
  expect(chat.attendee_provider_id).toBe(fx.ALICE);
  expect(chat.attendees.find((attendee) => attendee.is_self)?.provider_id).toBe(fx.SELF);
  expect(chat.unread_count).toBe(1);
  const [reply, mine] = chat.messages;
  expect(reply).toMatchObject({ is_sender: false, sender_id: fx.ALICE, sender_name: "Alice Example", text: "Sounds good" });
  expect(reply.reactions).toEqual([{ value: "👍" }]);
  expect(reply.attachments[0]).toMatchObject({ type: "file", file_name: "deck.pdf" });
  // No direct media url leaks to the browser; the attachment route proxies it.
  expect(JSON.stringify(reply.attachments)).not.toContain("https://");
  expect(mine.is_sender).toBe(true);
  expect(mine.id).toBe(mappers.mapMessage(fx.message("m1", fx.selfParticipant, "x", "2026-10-05T08:00:00Z"), {
    accountId,
    selfMemberId: fx.SELF,
    conversationUrn: fx.conversationUrn("c1"),
  })!.id);
});

test("a recalled message shows as deleted, never with its old text", () => {
  const accountId = ownAccountIdForMember(fx.SELF);
  const recalled = mappers.mapMessage(
    fx.message("m9", fx.aliceParticipant, "oops", "2026-10-05T09:00:00Z", { messageBodyRenderFormat: "RECALLED" }),
    { accountId, selfMemberId: fx.SELF, conversationUrn: fx.conversationUrn("c1") },
  )!;
  expect(recalled.deleted).toBe(true);
  expect(recalled.text).toBe("");
});

test("shared posts and system notices remain visible without being mistaken for personal outreach", () => {
  const context = { accountId: ownAccountIdForMember(fx.SELF), selfMemberId: fx.SELF, conversationUrn: fx.conversationUrn("shared") };
  const post = mappers.mapMessage(fx.message("post", fx.aliceParticipant, "", fx.POST_TIME, {
    renderContent: [{ hostUrnData: { type: "FEED_UPDATE", hostUrn: `urn:li:activity:${fx.POST_ID}` } }],
  }), context);
  expect(post?.attachments[0].url).toContain(fx.POST_ID);
  const notice = mappers.mapMessage(fx.message("notice", fx.selfParticipant, "Accepted", fx.POST_TIME, { messageBodyRenderFormat: "SYSTEM" }), context);
  expect(notice?.is_event).toBe(true);
});

test("an incomplete GraphQL response fails instead of authorizing outreach with apparently empty history", () => {
  expect(() => mappers.graphqlElements({ data: {}, errors: [{ message: "Query changed" }] })).toThrow();
  expect(() => mappers.graphqlElements({ unknown: [] })).toThrow();
});
