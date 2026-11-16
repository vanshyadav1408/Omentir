// Synthetic LinkedIn (Voyager) responses for tests, shaped after the web
// client's traffic. Every person and company here is invented: this repo is
// public, so captured real responses must never be committed.

export const SELF = "ACoAAself0001";
export const ALICE = "ACoAAalice001";
export const BOB = "ACoAAbob00001";

const image = (seed: string) => ({
  rootUrl: `https://media.licdn.com/dms/image/${seed}/`,
  artifacts: [
    { width: 100, fileIdentifyingUrlPathSegment: "100_100/a.jpg" },
    { width: 400, fileIdentifyingUrlPathSegment: "400_400/a.jpg" },
  ],
});

export function activityIdAt(iso: string) {
  return (BigInt(Date.parse(iso)) << BigInt(22)).toString();
}

export const profileResponse = (distance: "connection" | "DISTANCE_2" = "DISTANCE_2") => ({
  data: { "*elements": [`urn:li:fsd_profile:${ALICE}`] },
  included: [
    {
      $type: "com.linkedin.voyager.dash.identity.profile.Profile",
      entityUrn: `urn:li:fsd_profile:${ALICE}`,
      publicIdentifier: "alice-example",
      firstName: "Alice",
      lastName: "Example",
      headline: "Head of Growth at Acme Widgets",
      summary: "Builds outbound teams.",
      geoLocation: { "*geo": "urn:li:fsd_geo:101" },
      profilePicture: { displayImageReference: { vectorImage: image("alice") } },
      "*memberRelationship": `urn:li:fsd_memberRelationship:${ALICE}`,
    },
    { entityUrn: "urn:li:fsd_geo:101", defaultLocalizedName: "Berlin, Germany" },
    {
      entityUrn: `urn:li:fsd_memberRelationship:${ALICE}`,
      memberRelationshipUnion:
        distance === "connection" ? { connection: { createdAt: 1 } } : { noConnection: { memberDistance: "DISTANCE_2" } },
    },
    {
      $type: "com.linkedin.voyager.dash.identity.profile.Position",
      entityUrn: `urn:li:fsd_profilePosition:(${ALICE},2)`,
      title: "Sales Rep",
      companyName: "Old Co",
      dateRange: { start: { year: 2018, month: 1 }, end: { year: 2020, month: 6 } },
    },
    {
      $type: "com.linkedin.voyager.dash.identity.profile.Position",
      entityUrn: `urn:li:fsd_profilePosition:(${ALICE},1)`,
      title: "Head of Growth",
      companyName: "Acme Widgets",
      dateRange: { start: { year: 2021, month: 3 } },
    },
    // A recommender's position: must not leak into Alice's profile.
    {
      $type: "com.linkedin.voyager.dash.identity.profile.Position",
      entityUrn: `urn:li:fsd_profilePosition:(${BOB},9)`,
      title: "Intern",
      companyName: "Other Co",
    },
    {
      $type: "com.linkedin.voyager.dash.identity.profile.Skill",
      entityUrn: `urn:li:fsd_skill:(${ALICE},1)`,
      name: "Outbound sales",
    },
  ],
});

export const meResponse = {
  data: { "*miniProfile": `urn:li:fs_miniProfile:${SELF}`, plainId: 1 },
  included: [
    {
      $type: "com.linkedin.voyager.identity.shared.MiniProfile",
      entityUrn: `urn:li:fs_miniProfile:${SELF}`,
      dashEntityUrn: `urn:li:fsd_profile:${SELF}`,
      publicIdentifier: "sam-owner",
      firstName: "Sam",
      lastName: "Owner",
      occupation: "Founder",
      picture: image("sam"),
    },
  ],
};

export const peopleSearchResponse = {
  data: { data: { searchDashClustersByAll: { "*elements": ["urn:li:cluster:1"], paging: { total: 2, start: 0, count: 10 } } } },
  included: [
    {
      $type: "com.linkedin.voyager.dash.search.SearchClusterViewModel",
      entityUrn: "urn:li:cluster:1",
      items: [
        { item: { "*entityResult": `urn:li:fsd_entityResultViewModel:(urn:li:fsd_profile:${BOB},SEARCH_SRP,DEFAULT)` } },
        { item: { "*entityResult": `urn:li:fsd_entityResultViewModel:(urn:li:fsd_profile:${ALICE},SEARCH_SRP,DEFAULT)` } },
      ],
    },
    {
      $type: "com.linkedin.voyager.dash.search.EntityResultViewModel",
      entityUrn: `urn:li:fsd_entityResultViewModel:(urn:li:fsd_profile:${ALICE},SEARCH_SRP,DEFAULT)`,
      title: { text: "Alice Example" },
      primarySubtitle: { text: "Head of Growth at Acme Widgets" },
      secondarySubtitle: { text: "Berlin" },
      navigationUrl: `https://www.linkedin.com/in/alice-example?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3A${ALICE}`,
    },
    {
      $type: "com.linkedin.voyager.dash.search.EntityResultViewModel",
      entityUrn: `urn:li:fsd_entityResultViewModel:(urn:li:fsd_profile:${BOB},SEARCH_SRP,DEFAULT)`,
      title: { text: "Bob Sample" },
      primarySubtitle: { text: "CTO" },
      navigationUrl: `https://www.linkedin.com/in/${BOB}`,
    },
  ],
};

export const companyResponse = {
  data: { "*elements": ["urn:li:fs_normalized_company:4242"] },
  included: [
    {
      $type: "com.linkedin.voyager.organization.Company",
      entityUrn: "urn:li:fs_normalized_company:4242",
      name: "Acme Widgets",
      universalName: "acme-widgets",
      staffCount: 120,
      staffCountRange: { start: 51, end: 200 },
      "*companyIndustries": ["urn:li:fs_industry:4"],
    },
    { entityUrn: "urn:li:fs_industry:4", localizedName: "Software Development" },
  ],
};

export const POST_TIME = "2026-09-01T08:30:00.000Z";
export const POST_ID = activityIdAt(POST_TIME);

export const feedResponse = {
  data: { "*elements": [`urn:li:fs_updateV2:(urn:li:activity:${POST_ID},MEMBER_SHARES,EMPTY,DEFAULT,false)`] },
  included: [
    {
      $type: "com.linkedin.voyager.feed.render.UpdateV2",
      entityUrn: `urn:li:fs_updateV2:(urn:li:activity:${POST_ID},MEMBER_SHARES,EMPTY,DEFAULT,false)`,
      updateMetadata: { urn: `urn:li:activity:${POST_ID}`, shareUrn: "urn:li:ugcPost:7000000000000000001" },
      commentary: { text: { text: "We are hiring SDRs." } },
      actor: {
        name: { text: "Alice Example" },
        description: { text: "Head of Growth" },
        urn: "urn:li:member:111",
        navigationContext: { actionTarget: "https://www.linkedin.com/in/alice-example?trk=feed" },
      },
    },
  ],
};

export const commentsResponse = {
  data: { "*elements": ["urn:li:fs_objectComment:(1,activity:9)", "urn:li:fs_objectComment:(2,activity:9)"] },
  included: [
    {
      $type: "com.linkedin.voyager.feed.Comment",
      entityUrn: "urn:li:fs_objectComment:(1,activity:9)",
      commentV2: { text: "Interested, how do you price this?" },
      createdTime: Date.parse("2026-09-02T10:00:00Z"),
      permalink: "https://www.linkedin.com/feed/update/urn:li:activity:9?commentUrn=1",
      commenter: { "com.linkedin.voyager.feed.MemberActor": { "*miniProfile": `urn:li:fs_miniProfile:${BOB}` } },
    },
    {
      $type: "com.linkedin.voyager.feed.Comment",
      entityUrn: "urn:li:fs_objectComment:(2,activity:9)",
      commentV2: { text: "Congrats from the company page" },
      commenter: { "com.linkedin.voyager.feed.CompanyActor": { "*miniCompany": "urn:li:fs_miniCompany:4242" } },
    },
    {
      $type: "com.linkedin.voyager.identity.shared.MiniProfile",
      entityUrn: `urn:li:fs_miniProfile:${BOB}`,
      publicIdentifier: "bob-sample",
      firstName: "Bob",
      lastName: "Sample",
      occupation: "CTO at Beta Labs",
    },
  ],
};

export const reactionsResponse = {
  data: { "*elements": ["urn:li:fsd_reaction:1"] },
  included: [
    {
      $type: "com.linkedin.voyager.dash.social.Reaction",
      entityUrn: "urn:li:fsd_reaction:1",
      reactionType: "PRAISE",
      actorUrn: `urn:li:fsd_profile:${BOB}`,
      reactorLockup: {
        title: { text: "Bob Sample" },
        subtitle: { text: "CTO at Beta Labs" },
        navigationUrl: "https://www.linkedin.com/in/bob-sample",
      },
    },
  ],
};

export const sentInvitationsResponse = {
  data: { "*elements": ["urn:li:fs_relSentInvitationView:1"] },
  included: [
    { entityUrn: "urn:li:fs_relSentInvitationView:1", "*invitation": "urn:li:fs_relInvitation:7001" },
    {
      $type: "com.linkedin.voyager.relationships.invitation.Invitation",
      entityUrn: "urn:li:fs_relInvitation:7001",
      sharedSecret: "s3cr3t",
      sentTime: Date.parse("2026-09-20T00:00:00Z"),
      "*toMember": `urn:li:fs_miniProfile:${ALICE}`,
    },
    {
      $type: "com.linkedin.voyager.identity.shared.MiniProfile",
      entityUrn: `urn:li:fs_miniProfile:${ALICE}`,
      publicIdentifier: "alice-example",
      firstName: "Alice",
      lastName: "Example",
    },
  ],
};

export const connectionsResponse = {
  data: { "*elements": ["urn:li:fsd_connection:1"] },
  included: [
    {
      $type: "com.linkedin.voyager.dash.relationships.Connection",
      entityUrn: "urn:li:fsd_connection:1",
      createdAt: Date.parse("2026-10-01T00:00:00Z"),
      "*connectedMemberResolutionResult": `urn:li:fsd_profile:${BOB}`,
    },
    {
      $type: "com.linkedin.voyager.dash.identity.profile.Profile",
      entityUrn: `urn:li:fsd_profile:${BOB}`,
      publicIdentifier: "bob-sample",
      firstName: "Bob",
      lastName: "Sample",
    },
  ],
};

// ---------------------------------------------------------------- messaging

export const conversationUrn = (id: string) => `urn:li:msg_conversation:(urn:li:fsd_profile:${SELF},2-${id})`;
export const messageUrn = (id: string) => `urn:li:msg_message:(urn:li:fsd_profile:${SELF},2-${id})`;

export const participant = (memberId: string, first: string, last: string) => ({
  hostIdentityUrn: `urn:li:fsd_profile:${memberId}`,
  entityUrn: `urn:li:msg_messagingParticipant:urn:li:fsd_profile:${memberId}`,
  participantType: {
    member: {
      firstName: { text: first },
      lastName: { text: last },
      headline: { text: `${first}'s headline` },
      profileUrl: `https://www.linkedin.com/in/${memberId}`,
      profilePicture: image(first.toLowerCase()),
    },
  },
});

export const selfParticipant = participant(SELF, "Sam", "Owner");
export const aliceParticipant = participant(ALICE, "Alice", "Example");
export const bobParticipant = participant(BOB, "Bob", "Sample");

export function message(id: string, sender: ReturnType<typeof participant>, text: string, at: string, extra: Record<string, unknown> = {}) {
  return {
    entityUrn: messageUrn(id),
    deliveredAt: Date.parse(at),
    body: { text, attributes: [] },
    sender,
    renderContent: [],
    ...extra,
  };
}

export function conversation(
  id: string,
  other: ReturnType<typeof participant>,
  lastActivityAt: string,
  messages: ReturnType<typeof message>[],
  extra: Record<string, unknown> = {},
) {
  return {
    entityUrn: conversationUrn(id),
    lastActivityAt: Date.parse(lastActivityAt),
    unreadCount: 0,
    read: true,
    groupChat: false,
    conversationParticipants: [selfParticipant, other],
    messages: { elements: messages },
    ...extra,
  };
}

export const graphql = (queryName: string, elements: unknown[], nextCursor?: string) => ({
  data: { [queryName]: { elements, metadata: nextCursor ? { nextCursor } : {} } },
});

// ------------------------------------------------- shapes seen on live reads
// The fixtures above follow the older documented shapes. These follow what
// LinkedIn answered on 2026-11-11, where the two differ.

export const THREAD_URN = "urn:li:ugcPost:7000000000000000001";

// A company read by id: the company is `data`, and `included` lists other
// ("similar") companies first.
export const companyByIdResponse = {
  data: {
    $type: "com.linkedin.voyager.organization.Company",
    entityUrn: "urn:li:fs_normalized_company:4242",
    name: "Acme Widgets",
    universalName: "acme-widgets",
    staffCount: 120,
    staffCountRange: { start: 51, end: 200 },
    "*companyIndustries": ["urn:li:fs_industry:4"],
  },
  included: [
    {
      $type: "com.linkedin.voyager.organization.Company",
      entityUrn: "urn:li:fs_normalized_company:9999",
      name: "Similar Rival Inc",
      universalName: "similar-rival",
    },
    { entityUrn: "urn:li:fs_industry:4", localizedName: "Software Development" },
  ],
};

// A company feed: thin wrappers that point at the update carrying the text.
export const companyFeedResponse = {
  data: { "*elements": [`urn:li:fs_feedUpdate:(V2&COMPANY_FEED,urn:li:activity:${POST_ID})`] },
  included: [
    {
      $type: "com.linkedin.voyager.feed.Update",
      entityUrn: `urn:li:fs_feedUpdate:(V2&COMPANY_FEED,urn:li:activity:${POST_ID})`,
      urn: `urn:li:activity:${POST_ID}`,
      "*value": `urn:li:fs_updateV2:(urn:li:activity:${POST_ID},COMPANY_FEED,EMPTY,DEFAULT,false)`,
    },
    {
      $type: "com.linkedin.voyager.feed.render.UpdateV2",
      entityUrn: `urn:li:fs_updateV2:(urn:li:activity:${POST_ID},COMPANY_FEED,EMPTY,DEFAULT,false)`,
      updateMetadata: { urn: `urn:li:activity:${POST_ID}`, shareUrn: THREAD_URN },
      commentary: { text: { text: "Acme Widgets raised a Series A." } },
      actor: {
        name: { text: "Acme Widgets" },
        urn: "urn:li:company:4242",
        navigationContext: { actionTarget: "https://www.linkedin.com/company/acme-widgets/" },
      },
    },
  ],
};

// Keyword post search: dash updates with `metadata` instead of `updateMetadata`.
export const postSearchResponse = {
  data: { data: { searchDashClustersByAll: { paging: { total: 1, start: 0, count: 10 } } } },
  included: [
    {
      $type: "com.linkedin.voyager.dash.feed.Update",
      entityUrn: `urn:li:fsd_update:(urn:li:activity:${POST_ID},BLENDED_SEARCH_FEED,EMPTY,DEFAULT,false)`,
      metadata: { backendUrn: `urn:li:activity:${POST_ID}`, shareUrn: "urn:li:share:7000000000000000002" },
      commentary: { text: { text: "Looking for a cold outreach tool." } },
      actor: {
        name: { text: "Bob Sample" },
        description: { text: "CTO at Beta Labs" },
        backendUrn: "urn:li:member:222",
        navigationContext: { actionTarget: "https://www.linkedin.com/in/bob-sample?miniProfileUrn=x" },
      },
    },
  ],
};

// /feed/comments: the commenter is flat with a $type, not keyed by type name.
export const flatCommentsResponse = {
  data: { "*elements": ["urn:li:fs_objectComment:(1,ugcPost:9)", "urn:li:fs_objectComment:(2,ugcPost:9)"] },
  included: [
    {
      $type: "com.linkedin.voyager.feed.Comment",
      entityUrn: "urn:li:fs_objectComment:(1,ugcPost:9)",
      commentV2: { text: "How does this compare to doing it by hand?" },
      createdTime: Date.parse("2026-09-02T10:00:00Z"),
      commenter: {
        $type: "com.linkedin.voyager.feed.MemberActor",
        urn: "urn:li:member:222",
        "*miniProfile": `urn:li:fs_miniProfile:${BOB}`,
      },
    },
    {
      $type: "com.linkedin.voyager.feed.Comment",
      entityUrn: "urn:li:fs_objectComment:(2,ugcPost:9)",
      commentV2: { text: "Great launch" },
      commenter: { $type: "com.linkedin.voyager.feed.CompanyActor", "*miniCompany": "urn:li:fs_miniCompany:4242" },
    },
    {
      $type: "com.linkedin.voyager.identity.shared.MiniProfile",
      entityUrn: `urn:li:fs_miniProfile:${BOB}`,
      publicIdentifier: "bob-sample",
      firstName: "Bob",
      lastName: "Sample",
      occupation: "CTO at Beta Labs",
    },
  ],
};

// Reactions: the reactor's id is only in actorUnion.
export const actorUnionReactionsResponse = {
  data: { "*elements": [`urn:li:fsd_reaction:(urn:li:fsd_profile:${BOB},${THREAD_URN},0)`] },
  included: [
    {
      $type: "com.linkedin.voyager.dash.social.Reaction",
      entityUrn: `urn:li:fsd_reaction:(urn:li:fsd_profile:${BOB},${THREAD_URN},0)`,
      reactionType: "INTEREST",
      actorUnion: { profileUrn: `urn:li:fsd_profile:${BOB}` },
      reactorLockup: {
        title: { text: "Bob Sample" },
        subtitle: { text: "CTO at Beta Labs" },
        navigationUrl: "https://www.linkedin.com/in/bob-sample",
      },
    },
  ],
};

export const memberRelationshipResponse = (state: "connection" | "DISTANCE_2") => ({
  data: {
    entityUrn: `urn:li:fsd_memberRelationship:${ALICE}`,
    memberRelationshipUnion:
      state === "connection"
        ? { "*connection": `urn:li:fsd_connection:${ALICE}` }
        : { noConnection: { memberDistance: "DISTANCE_2", invitationUnion: { noInvitation: {} } } },
  },
  included: [],
});

export const typeaheadResponse = {
  data: {
    elements: [
      { title: { text: "Germany" }, trackingUrn: "urn:li:geo:101282230", target: { "*geo": "urn:li:fsd_geo:101282230" } },
      { title: { text: "Berlin, Germany" }, trackingUrn: "urn:li:geo:106967730", target: { "*geo": "urn:li:fsd_geo:106967730" } },
    ],
  },
  included: [],
};

// A profile read as it arrives today: no relationship attached.
export const profileWithoutRelationshipResponse = () => {
  const response = profileResponse();
  return {
    ...response,
    included: response.included
      .filter((entity) => !("memberRelationshipUnion" in entity))
      .map((entity) => {
        const { "*memberRelationship": dropped, ...rest } = entity as Record<string, unknown>;
        void dropped;
        return rest;
      }),
  };
};
