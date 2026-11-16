// LinkedIn (Voyager) data -> the record shapes linkedin.ts already normalizes
// (the ones the old Unipile integration returned). Producing them keeps every
// downstream rule (budgets, identity matching, inbox assembly, outreach state)
// on one tested code path.
//
// Field names below match what linkedin.ts reads; see the LinkedIn* types there.

import {
  activityIdFromUrn,
  activityTimestamp,
  asArray,
  asObject,
  collectionElements,
  companyIdFromUrn,
  isoFromMillis,
  profileIdFromUrn,
  str,
  text,
  vectorImageUrl,
  VoyagerIndex,
  type VoyagerEntity,
  type VoyagerResponse,
} from "./voyager";
import { base64UrlEncode, ownChatId, ownInvitationId, ownMessageId } from "./ids";

type Rec = Record<string, unknown>;

export function profileUrlFor(publicIdentifier: string | undefined) {
  return publicIdentifier ? `https://www.linkedin.com/in/${publicIdentifier}` : undefined;
}

function cleanProfileUrl(value: unknown) {
  const url = str(value);
  if (!url) return undefined;
  try {
    const parsed = new URL(url, "https://www.linkedin.com");
    const match = parsed.pathname.match(/^\/(in|company)\/([^/]+)/);
    return match ? `https://www.linkedin.com/${match[1]}/${match[2]}` : undefined;
  } catch {
    return undefined;
  }
}

function fullName(first: unknown, last: unknown) {
  return [text(first), text(last)].filter(Boolean).join(" ") || undefined;
}

function yearMonth(value: unknown) {
  const date = asObject(value);
  const year = Number(date?.year);
  if (!Number.isFinite(year) || year <= 0) return undefined;
  const month = Number(date?.month);
  return Number.isFinite(month) && month > 0 ? `${year}-${String(month).padStart(2, "0")}` : String(year);
}

function dateRange(entity: Rec) {
  const range = asObject(entity.dateRange) || asObject(entity.timePeriod);
  const start = yearMonth(range?.start || range?.startDate);
  const end = yearMonth(range?.end || range?.endDate);
  return { start, end, current: Boolean(range && !range.end && !range.endDate) };
}

// ------------------------------------------------------------------ profile

// Entities like urn:li:fsd_profilePosition:(ACoXXX,123) belong to member ACoXXX.
// FullProfile responses can embed other people (e.g. recommenders), so every
// section is filtered to the requested member.
function ownedBy(memberId: string) {
  return (entity: VoyagerEntity) =>
    typeof entity.entityUrn === "string" && entity.entityUrn.includes(memberId);
}

function distanceFromRelationship(relationship: Rec | null | undefined) {
  const union =
    asObject(relationship?.memberRelationshipUnion) ||
    asObject(relationship?.memberRelationshipData) ||
    asObject(relationship);
  if (!union) return undefined;
  if (union.self) return "SELF";
  // Live responses point at the connection (`*connection`) instead of inlining it.
  if (union.connection || union["*connection"]) return "DISTANCE_1";
  return str(asObject(union.noConnection)?.memberDistance);
}

function networkDistance(profile: VoyagerEntity, index: VoyagerIndex) {
  return distanceFromRelationship(index.ref(profile, "memberRelationship") || asObject(profile.memberRelationship));
}

// A direct member-relationship read: "DISTANCE_1" when connected, otherwise
// LinkedIn's distance for that member.
export function mapMemberRelationship(response: VoyagerResponse) {
  return distanceFromRelationship(asObject(response.data));
}

export function mapProfileResponse(response: VoyagerResponse, identifier: string) {
  const index = new VoyagerIndex(response);
  const candidates = [
    ...collectionElements(response, index),
    ...index.ofType("identity.profile.Profile"),
  ].filter((entity) => profileIdFromUrn(entity.entityUrn));
  const wanted = identifier.toLowerCase();
  const profile =
    candidates.find(
      (entity) =>
        str(entity.publicIdentifier)?.toLowerCase() === wanted ||
        profileIdFromUrn(entity.entityUrn)?.toLowerCase() === wanted,
    ) || candidates[0];
  if (!profile) return null;

  const memberId = profileIdFromUrn(profile.entityUrn) as string;
  const owned = ownedBy(memberId);
  const geo = index.ref(profile, "geo") || index.ref(asObject(profile.geoLocation), "geo");
  const location = text(geo?.defaultLocalizedName) || text(profile.locationName);

  const positions = index.ofType("identity.profile.Position").filter(owned).map((entity) => {
    const range = dateRange(entity);
    return {
      position: text(entity.title),
      company: text(entity.companyName) || text(index.ref(entity, "company")?.name),
      location: text(entity.locationName),
      description: text(entity.description),
      start: range.start,
      end: range.end,
      current: range.current,
    };
  });
  // Current roles first, most recent first: profileCompany() takes the first
  // current entry as the person's company.
  positions.sort((a, b) => Number(b.current) - Number(a.current) || (b.start || "").localeCompare(a.start || ""));

  const distance = networkDistance(profile, index);
  return {
    id: memberId,
    provider_id: memberId,
    public_identifier: str(profile.publicIdentifier),
    profile_url: profileUrlFor(str(profile.publicIdentifier)),
    first_name: text(profile.firstName),
    last_name: text(profile.lastName),
    name: fullName(profile.firstName, profile.lastName),
    headline: text(profile.headline),
    location,
    summary: text(profile.summary),
    profile_picture_url: vectorImageUrl(profile.profilePicture),
    ...(distance ? { network_distance: distance, is_relationship: distance === "DISTANCE_1" } : {}),
    work_experience: positions,
    education: index.ofType("identity.profile.Education").filter(owned).map((entity) => {
      const range = dateRange(entity);
      return {
        school: text(entity.schoolName) || text(index.ref(entity, "school")?.name),
        degree: text(entity.degreeName),
        field_of_study: text(entity.fieldOfStudy),
        description: text(entity.description),
        start: range.start,
        end: range.end,
      };
    }),
    skills: index.ofType("identity.profile.Skill").filter(owned).map((entity) => ({ name: text(entity.name) })),
    certifications: index.ofType("identity.profile.Certification").filter(owned).map((entity) => {
      const range = dateRange(entity);
      return { name: text(entity.name), authority: text(entity.authority), start: range.start, end: range.end };
    }),
    projects: index.ofType("identity.profile.Project").filter(owned).map((entity) => {
      const range = dateRange(entity);
      return { name: text(entity.title), description: text(entity.description), url: str(entity.url), start: range.start, end: range.end };
    }),
    volunteering_experience: index.ofType("identity.profile.VolunteerExperience").filter(owned).map((entity) => ({
      role: text(entity.role),
      organization: text(entity.companyName),
      cause: str(entity.cause),
      description: text(entity.description),
    })),
    languages: index.ofType("identity.profile.Language").filter(owned).map((entity) => ({
      name: text(entity.name),
      proficiency: str(entity.proficiency),
    })),
  };
}

// /me answers with the account's MiniProfile.
export function mapMeResponse(response: VoyagerResponse) {
  const index = new VoyagerIndex(response);
  const data = asObject(response.data);
  const mini =
    index.get(data?.["*miniProfile"]) ||
    asObject(data?.miniProfile) ||
    index.ofType("identity.shared.MiniProfile")[0];
  if (!mini) return null;
  const memberId =
    profileIdFromUrn((mini as Rec).dashEntityUrn) || profileIdFromUrn((mini as Rec).entityUrn);
  if (!memberId) return null;
  const publicIdentifier = str((mini as Rec).publicIdentifier);
  return {
    id: memberId,
    provider_id: memberId,
    public_identifier: publicIdentifier,
    profile_url: profileUrlFor(publicIdentifier),
    first_name: text((mini as Rec).firstName),
    last_name: text((mini as Rec).lastName),
    name: fullName((mini as Rec).firstName, (mini as Rec).lastName),
    headline: text((mini as Rec).occupation),
    profile_picture_url: vectorImageUrl((mini as Rec).picture),
  };
}

// MiniProfile (comments, invitations) -> actor record.
function mapMiniProfile(mini: Rec | undefined) {
  if (!mini) return null;
  const memberId = profileIdFromUrn(mini.dashEntityUrn) || profileIdFromUrn(mini.entityUrn);
  const publicIdentifier = str(mini.publicIdentifier);
  if (!memberId && !publicIdentifier) return null;
  return {
    id: memberId,
    provider_id: memberId,
    public_identifier: publicIdentifier,
    profile_url: profileUrlFor(publicIdentifier),
    name: fullName(mini.firstName, mini.lastName),
    first_name: text(mini.firstName),
    last_name: text(mini.lastName),
    headline: text(mini.occupation),
    profile_picture_url: vectorImageUrl(mini.picture),
  };
}

// ------------------------------------------------------------------ search

// Search results arrive as clusters of items pointing at EntityResultViewModel
// entities. Walk clusters in order so ranking is preserved.
function searchResults(response: VoyagerResponse) {
  const index = new VoyagerIndex(response);
  const ordered: VoyagerEntity[] = [];
  const seen = new Set<string>();
  const push = (entity: VoyagerEntity | undefined) => {
    const urn = entity?.entityUrn;
    if (!entity || !urn || seen.has(urn)) return;
    seen.add(urn);
    ordered.push(entity);
  };
  for (const cluster of index.ofType("search.SearchClusterViewModel")) {
    for (const item of asArray(cluster.items)) {
      const wrapper = asObject(asObject(item)?.item);
      push(index.ref(wrapper, "entityResult"));
    }
  }
  for (const entity of index.ofType("search.EntityResultViewModel")) push(entity);
  return ordered;
}

export function searchTotal(response: VoyagerResponse) {
  const index = new VoyagerIndex(response);
  const data = asObject(asObject(response.data)?.data) || asObject(response.data);
  for (const value of Object.values(data || {})) {
    const total = Number(asObject(asObject(value)?.paging)?.total);
    if (Number.isFinite(total)) return total;
  }
  const meta = index.ofType("search.SearchClusterCollectionMetadata")[0];
  const total = Number(meta?.totalResultCount);
  return Number.isFinite(total) ? total : undefined;
}

// LinkedIn's "you've reached the monthly limit for profile searches" card,
// shown in place of most results once a free account is past its quota.
export function searchLimitReached(response: VoyagerResponse) {
  return new VoyagerIndex(response)
    .ofType("search.PromoCard")
    .some((card) => /monthly limit/i.test(`${text(card.title) || ""} ${text(card.subtitle) || ""}`));
}

function resultImage(entity: Rec) {
  for (const attribute of asArray(asObject(entity.image)?.attributes)) {
    const attr = asObject(attribute);
    const detail = asObject(attr?.detailData) || asObject(attr?.detailDataUnion);
    const url =
      vectorImageUrl(asObject(detail?.nonEntityProfilePicture)) ||
      vectorImageUrl(asObject(detail?.profilePicture)) ||
      vectorImageUrl(asObject(detail?.nonEntityCompanyLogo)) ||
      vectorImageUrl(asObject(detail?.companyLogo));
    if (url) return url;
  }
  return undefined;
}

export function mapPeopleSearch(response: VoyagerResponse) {
  return searchResults(response).flatMap((entity) => {
    const memberId = String(entity.entityUrn).match(/urn:li:fsd_profile:([^,)]+)/)?.[1];
    if (!memberId) return [];
    const profileUrl = cleanProfileUrl(entity.navigationUrl);
    const publicIdentifier = profileUrl?.split("/in/")[1];
    return [{
      id: memberId,
      provider_id: memberId,
      public_identifier: publicIdentifier && !publicIdentifier.startsWith("ACo") ? publicIdentifier : undefined,
      profile_url: profileUrl,
      name: text(entity.title),
      headline: text(entity.primarySubtitle),
      location: text(entity.secondarySubtitle),
      profile_picture_url: resultImage(entity),
      network_distance: str(asObject(entity.entityCustomTrackingInfo)?.memberDistance),
    }];
  });
}

export function mapCompanySearch(response: VoyagerResponse) {
  return searchResults(response).flatMap((entity) => {
    const companyId =
      String(entity.entityUrn).match(/urn:li:fsd_company:(\d+)/)?.[1] || companyIdFromUrn(entity.trackingUrn);
    if (!companyId) return [];
    return [{
      id: companyId,
      name: text(entity.title),
      profile_url: cleanProfileUrl(entity.navigationUrl),
    }];
  });
}

export function mapPostSearch(response: VoyagerResponse) {
  const fromUpdates = mapFeedUpdates(response);
  if (fromUpdates.length) return fromUpdates;
  return searchResults(response).flatMap((entity) => {
    const activityId = activityIdFromUrn(entity.entityUrn) || activityIdFromUrn(entity.trackingUrn);
    if (!activityId) return [];
    return [{
      id: activityId,
      social_id: `urn:li:activity:${activityId}`,
      text: text(entity.summary),
      share_url: `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}/`,
      parsed_datetime: activityTimestamp(activityId),
      author: { name: text(entity.title), headline: text(entity.primarySubtitle), profile_url: cleanProfileUrl(entity.actorNavigationUrl) },
    }];
  });
}


// Typeahead hit -> { id, title } (LinkedIn geo or company id).
export function mapTypeahead(response: VoyagerResponse) {
  const index = new VoyagerIndex(response);
  const data = asObject(response.data);
  const elements = [
    ...collectionElements(response, index),
    ...asArray(data?.elements).map(asObject).filter(Boolean),
    ...asArray(response.elements).map(asObject).filter(Boolean),
  ];
  const seen = new Set<string>();
  return elements.flatMap((element) => {
    const hit = asObject(element);
    if (!hit) return [];
    const urn =
      str(hit.targetUrn) ||
      str(hit.objectUrn) ||
      // urn:li:geo:90009496, urn:li:organization:1441
      str(hit.trackingUrn) ||
      JSON.stringify(hit.hitInfo || {}).match(/urn:li:[a-z_]+:\d+/i)?.[0];
    const id = urn?.match(/:(\d+)$/)?.[1];
    const title = text(hit.text) || text(hit.title);
    if (!id || !title || seen.has(id)) return [];
    seen.add(id);
    return [{ id, title }];
  });
}

// ------------------------------------------------------------------ company

export function mapCompanyResponse(response: VoyagerResponse) {
  const index = new VoyagerIndex(response);
  const company =
    collectionElements(response, index).find((entity) => companyIdFromUrn(entity.entityUrn)) ||
    // A by-id read answers with the company as `data`; `included` then holds
    // only similar companies, so it must not be consulted first.
    (companyIdFromUrn(asObject(response.data)?.entityUrn) ? (asObject(response.data) as VoyagerEntity) : undefined) ||
    index.ofType("organization.Company")[0];
  const id = companyIdFromUrn(company?.entityUrn);
  if (!company || !id) return null;
  const universalName = str(company.universalName);
  const industries = [
    ...index.refs(company, "companyIndustries"),
    ...asArray(company.industries).map((value) => ({ localizedName: value })),
  ]
    .map((industry) => text((industry as Rec).localizedName))
    .filter((value): value is string => Boolean(value));
  const range = asObject(company.staffCountRange);
  return {
    id,
    public_identifier: universalName,
    name: text(company.name),
    profile_url: universalName ? `https://www.linkedin.com/company/${universalName}` : undefined,
    industry: industries,
    employee_count: Number(company.staffCount) || undefined,
    employee_count_range: range
      ? { from: Number(range.start) || undefined, to: Number(range.end) || undefined }
      : undefined,
  };
}

// ------------------------------------------------------------------ feed

function actorProfile(actor: Rec | undefined, index: VoyagerIndex) {
  if (!actor) return undefined;
  const urn = str(actor.urn) || str(actor.backendUrn);
  const isCompany = Boolean(urn && /urn:li:(?:company|organization|fsd_company)/.test(urn));
  const navigation =
    str(asObject(asObject(actor.navigationContext))?.actionTarget) || str(actor.navigationUrl);
  const mini = index.get(actor["*miniProfile"]) || asObject(actor.miniProfile);
  const fromMini = mapMiniProfile(mini as Rec | undefined);
  return {
    ...(fromMini || {}),
    name: fromMini?.name || text(actor.name) || text(actor.title),
    headline: fromMini?.headline || text(actor.description) || text(actor.subtitle),
    profile_url: fromMini?.profile_url || cleanProfileUrl(navigation),
    ...(isCompany ? { is_company: true } : {}),
  };
}

export function mapFeedUpdates(response: VoyagerResponse) {
  const index = new VoyagerIndex(response);
  const updates = [
    ...collectionElements(response, index),
    ...index.ofType("feed.render.UpdateV2", "feed.Update"),
  ]
    // Company feeds list thin wrappers; the text and author live on the
    // update each one points at.
    .map((update) => index.get(update["*value"]) || update);
  const seen = new Set<string>();
  return updates.flatMap((update) => {
    // `updateMetadata` on feed reads, `metadata` on post-search results.
    const metadata = asObject(update.updateMetadata) || asObject(update.metadata);
    const activityId =
      activityIdFromUrn(metadata?.urn) ||
      activityIdFromUrn(metadata?.backendUrn) ||
      activityIdFromUrn(update.entityUrn) ||
      activityIdFromUrn(update.urn);
    if (!activityId || seen.has(activityId)) return [];
    seen.add(activityId);
    const socialDetail =
      asObject(update.socialDetail) ||
      index.ref(update, "socialDetail") ||
      index.ofType("feed.SocialDetail").find((item) => str(item.entityUrn)?.includes(activityId) || str(item.dashEntityUrn)?.includes(activityId));
    const socialThreadId = str(socialDetail?.threadId);
    const socialThreadUrn =
      (socialThreadId && /^(?:activity|ugcPost|share):\d+$/.test(socialThreadId) ? `urn:li:${socialThreadId}` : undefined) ||
      (str(socialDetail?.urn) && /^urn:li:(?:activity|ugcPost|share):\d+$/.test(str(socialDetail?.urn) || "") ? str(socialDetail?.urn) : undefined);
    const metadataShareUrn = str(metadata?.shareUrn);
    const threadUrn =
      socialThreadUrn ||
      (metadataShareUrn && /^urn:li:(?:ugcPost|share):\d+$/.test(metadataShareUrn) ? metadataShareUrn : undefined) ||
      `urn:li:activity:${activityId}`;
    const commentary = asObject(update.commentary) || index.ref(update, "commentary");
    const postText = text(asObject(commentary?.text)) || text(commentary?.text) || "";
    const actor = asObject(update.actor) || index.ref(update, "actor");
    return [{
      id: activityId,
      social_id: `urn:li:activity:${activityId}`,
      text: postText,
      share_url: `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}/`,
      parsed_datetime: activityTimestamp(activityId),
      author: actorProfile(actor as Rec | undefined, index),
      // Reactions are filed under socialDetail.threadId (or shareUrn when absent).
      thread_urn: threadUrn,
    }];
  });
}

// Comment commenter is a member or company actor, either keyed by its type
// name ({"com.linkedin.voyager.feed.MemberActor": ...}) or flat with a $type
// (what /feed/comments answers today), or a dash lockup
// ({ title, subtitle, navigationUrl, image }).
function commenterOf(comment: Rec, index: VoyagerIndex) {
  const commenter = asObject(comment.commenter) || index.ref(comment, "commenter");
  const type = str(commenter?.$type) || "";
  const member =
    asObject(commenter?.["com.linkedin.voyager.feed.MemberActor"]) ||
    (type.endsWith("feed.MemberActor") ? commenter : null);
  if (member) {
    const mini = index.get(member["*miniProfile"]) || asObject(member.miniProfile);
    return mapMiniProfile(mini as Rec | undefined);
  }
  if (commenter?.["com.linkedin.voyager.feed.CompanyActor"] || type.endsWith("feed.CompanyActor")) {
    return { is_company: true };
  }
  if (commenter) {
    const memberId = profileIdFromUrn(commenter.actorUrn) || profileIdFromUrn(asObject(commenter.actor)?.["*profileUrn"]);
    const profileUrl = cleanProfileUrl(commenter.navigationUrl);
    const isCompany = Boolean(profileUrl?.includes("/company/"));
    return {
      id: memberId,
      provider_id: memberId,
      name: text(commenter.title),
      headline: text(commenter.subtitle),
      profile_url: profileUrl,
      profile_picture_url: resultImage(commenter),
      ...(isCompany ? { is_company: true } : {}),
    };
  }
  return null;
}

export function mapComments(response: VoyagerResponse) {
  const index = new VoyagerIndex(response);
  const comments = [
    ...collectionElements(response, index),
    ...index.ofType("feed.Comment", "social.Comment"),
  ];
  const seen = new Set<string>();
  return comments.flatMap((comment) => {
    const id = str(comment.entityUrn) || str(comment.urn);
    if (!id || seen.has(id)) return [];
    seen.add(id);
    const author = commenterOf(comment, index);
    const body =
      text(asObject(comment.commentV2)) ||
      text(asObject(comment.commentary)) ||
      text(asArray(asObject(comment.comment)?.values).map((value) => text(asObject(value)?.value)).join(" ")) ||
      "";
    return [{
      id,
      text: body,
      url: str(comment.permalink),
      created_at: isoFromMillis(comment.createdTime || comment.createdAt),
      author_details: author ? { ...author } : undefined,
    }];
  });
}

export function mapReactions(response: VoyagerResponse) {
  const index = new VoyagerIndex(response);
  const reactions = [
    ...collectionElements(response, index),
    ...index.ofType("social.Reaction"),
  ].filter((entity) => typeof entity.$type !== "string" || entity.$type.endsWith("Reaction"));
  const seen = new Set<string>();
  return reactions.flatMap((reaction) => {
    const actorUnion = asObject(reaction.actorUnion);
    const actorObj = asObject(reaction.actor);
    const actorUrn =
      str(reaction.actorUrn) ||
      str(actorUnion?.profileUrn) ||
      str(actorUnion?.companyUrn) ||
      str(actorObj?.urn) ||
      str(actorObj?.["*profileUrn"]) ||
      str(reaction.preDashActorUrn);
    const lockup = asObject(reaction.reactorLockup) || index.ref(reaction, "reactorLockup");
    const key = `${actorUrn || text(lockup?.title)}:${str(reaction.reactionType)}`;
    if (!actorUrn && !text(lockup?.title)) return [];
    if (seen.has(key)) return [];
    seen.add(key);
    const memberId = profileIdFromUrn(actorUrn);
    const isCompany = Boolean(actorUrn && /company|organization/.test(actorUrn));
    const navUrl = cleanProfileUrl(lockup?.navigationUrl);
    const slug = navUrl?.split("/in/")[1];
    const publicIdentifier = slug && !slug.startsWith("ACo") ? slug : undefined;
    const profileUrl = publicIdentifier ? profileUrlFor(publicIdentifier) : isCompany ? navUrl : undefined;
    return [{
      id: key,
      reaction_type: str(reaction.reactionType) || "LIKE",
      author_details: {
        id: memberId,
        provider_id: memberId,
        ...(publicIdentifier ? { public_identifier: publicIdentifier } : {}),
        name: text(lockup?.title),
        headline: text(lockup?.subtitle),
        ...(profileUrl ? { profile_url: profileUrl } : {}),
        profile_picture_url: lockup ? resultImage(lockup) : undefined,
        ...(isCompany ? { is_company: true } : {}),
      },
    }];
  });
}

// ------------------------------------------------------------- relationships

export function mapSentInvitations(response: VoyagerResponse) {
  const index = new VoyagerIndex(response);
  const views = collectionElements(response, index);
  const invitations = views.length
    ? views.map((view) => index.ref(view, "invitation") || view)
    : index.ofType("relationships.invitation.Invitation", "relationships.Invitation");
  return invitations.flatMap((invitation) => {
    const invitationId = str(invitation.entityUrn)?.match(/:(\d+)$/)?.[1];
    const secret = str(invitation.sharedSecret);
    if (!invitationId || !secret) return [];
    const mini = index.ref(invitation, "toMember") || index.ref(invitation, "invitee");
    const person = mapMiniProfile(mini as Rec | undefined);
    return [{
      id: ownInvitationId(invitationId, secret),
      parsed_datetime: isoFromMillis(invitation.sentTime),
      invited_user_id: person?.provider_id,
      invited_user_public_id: person?.public_identifier,
      user: person
        ? { id: person.provider_id, provider_id: person.provider_id, public_identifier: person.public_identifier, profile_url: person.profile_url }
        : undefined,
    }];
  });
}

export function mapConnections(response: VoyagerResponse) {
  const index = new VoyagerIndex(response);
  const connections = collectionElements(response, index);
  return connections.flatMap((connection) => {
    const profile =
      index.ref(connection, "connectedMemberResolutionResult") || index.get(connection.connectedMember);
    const memberId = profileIdFromUrn(profile?.entityUrn) || profileIdFromUrn(connection.connectedMember);
    if (!memberId) return [];
    const publicIdentifier = str(profile?.publicIdentifier);
    return [{
      first_name: text(profile?.firstName),
      last_name: text(profile?.lastName),
      public_identifier: publicIdentifier,
      public_profile_url: profileUrlFor(publicIdentifier),
      member_id: memberId,
      provider_id: memberId,
    }];
  });
}

// --------------------------------------------------------------- messaging

// Messaging GraphQL answers inline JSON: data.<queryName>.elements[].
export function graphqlElements(response: unknown) {
  if (asArray(asObject(response)?.errors).length) throw new Error("LinkedIn returned an incomplete messaging response.");
  const data = asObject(asObject(response)?.data);
  for (const value of Object.values(data || {})) {
    const obj = asObject(value);
    if (obj && Array.isArray(obj.elements)) {
      return obj.elements.map(asObject).filter(Boolean) as Rec[];
    }
  }
  throw new Error("LinkedIn did not return a messaging collection.");
}

// The cursor for the next page of a messaging collection; absent on the last.
export function graphqlNextCursor(response: unknown) {
  const data = asObject(asObject(response)?.data);
  for (const value of Object.values(data || {})) {
    const cursor = str(asObject(asObject(value)?.metadata)?.nextCursor);
    if (cursor) return cursor;
  }
  return undefined;
}

export type MappedAttendee = {
  id: string;
  provider_id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  headline?: string;
  profile_url?: string;
  profile_picture_url?: string;
  is_self?: boolean;
};

export function mapParticipant(participant: Rec | undefined, selfMemberId: string): MappedAttendee | null {
  if (!participant) return null;
  const rawIdentity =
    str(participant.hostIdentityUrn) ||
    str(participant.entityUrn)?.replace(/^urn:li:msg_messagingParticipant:/, "");
  const memberId = profileIdFromUrn(rawIdentity);
  const companyId = memberId ? undefined : companyIdFromUrn(rawIdentity) || companyIdFromUrn(participant.backendUrn);
  const participantId = memberId || (companyId ? `company:${companyId}` : undefined);
  if (!participantId) return null;
  const type = asObject(participant.participantType);
  const member = asObject(type?.member);
  const organization = asObject(type?.organization);
  const name =
    fullName(member?.firstName, member?.lastName) || text(organization?.name) || text(asObject(type?.custom)?.name);
  const rawProfileUrl = cleanProfileUrl(member?.profileUrl) || cleanProfileUrl(organization?.pageUrl);
  const inSlug = rawProfileUrl?.split("/in/")[1];
  const profileUrl = inSlug?.startsWith("ACo") ? undefined : rawProfileUrl;
  return {
    id: participantId,
    provider_id: participantId,
    name,
    first_name: text(member?.firstName),
    last_name: text(member?.lastName),
    headline: text(member?.headline) || text(organization?.tagline),
    ...(profileUrl ? { profile_url: profileUrl } : {}),
    profile_picture_url: vectorImageUrl(member?.profilePicture) || vectorImageUrl(organization?.logo),
    ...(memberId === selfMemberId ? { is_self: true } : {}),
  };
}

function videoUrl(video: Rec | null) {
  const stream = asObject(asArray(video?.progressiveStreams)[0]);
  return str(asObject(asArray(stream?.streamingLocations)[0])?.url);
}

type MappedAttachment = { id: string; type: string; file_name?: string; url?: string; unavailable?: boolean };

function attachmentsOf(message: Rec) {
  return asArray(message.renderContent).flatMap((content, position): MappedAttachment[] => {
    const record = asObject(content);
    if (!record) return [];
    const file = asObject(record.file);
    const image = asObject(record.vectorImage);
    const audio = asObject(record.audio);
    const video = asObject(record.video);
    const postId = activityIdFromUrn(asObject(record.hostUrnData)?.hostUrn);
    if (postId) {
      const url = `https://www.linkedin.com/feed/update/urn:li:activity:${postId}`;
      return [{ id: base64UrlEncode(url), type: "linkedin_post", url }];
    }
    const url = str(file?.url) || vectorImageUrl(image) || str(audio?.url) || videoUrl(video);
    if (!url) {
      return record.unavailableContent || record.unavailable
        ? [{ id: `unavailable-${position}`, type: "file", unavailable: true }]
        : [];
    }
    return [{
      // The id is the media url itself (base64url): the attachment route
      // decodes it, host-checks it, and fetches it with the owner's session.
      id: base64UrlEncode(url),
      type: file ? "file" : image ? "img" : audio ? "audio" : "video",
      file_name: str(file?.name),
    }];
  });
}

export function mapMessage(
  message: Rec,
  input: { accountId: string; selfMemberId: string; conversationUrn: string },
) {
  const urn = str(message.entityUrn);
  if (!urn) return null;
  const sender = mapParticipant(asObject(message.sender) || undefined, input.selfMemberId);
  const recalled = str(message.messageBodyRenderFormat) === "RECALLED";
  return {
    id: ownMessageId(input.accountId, urn),
    chat_id: ownChatId(input.accountId, input.conversationUrn),
    account_id: input.accountId,
    text: recalled ? "" : text(message.body) || "",
    is_sender: sender?.provider_id === input.selfMemberId,
    ...(str(message.messageBodyRenderFormat) === "SYSTEM" ? { is_event: true } : {}),
    sender_id: sender?.provider_id,
    sender_name: sender?.name,
    sender: sender || undefined,
    timestamp: isoFromMillis(message.deliveredAt),
    ...(str(message.subject) ? { subject: str(message.subject) } : {}),
    attachments: recalled ? [] : attachmentsOf(message),
    reactions: asArray(message.reactionSummaries)
      .map((summary) => ({ value: str(asObject(summary)?.emoji) }))
      .filter((reaction) => reaction.value),
    ...(recalled ? { deleted: true } : {}),
    origin_token: str(message.originToken),
  };
}

export function mapConversation(conversation: Rec, input: { accountId: string; selfMemberId: string }) {
  const conversationUrn = str(conversation.entityUrn);
  if (!conversationUrn) return null;
  const attendees = asArray(conversation.conversationParticipants)
    .map((participant) => mapParticipant(asObject(participant) || undefined, input.selfMemberId))
    .filter((attendee): attendee is MappedAttendee => Boolean(attendee));
  const other = attendees.find((attendee) => !attendee.is_self);
  // Skip LinkedIn's self-only notes thread so it doesn't appear in the inbox
  // as an inbound conversation from the user to themselves.
  if (!conversation.groupChat && !other) return null;
  const messages = graphqlElementsOf(conversation.messages)
    .map((message) => mapMessage(message, { ...input, conversationUrn }))
    .filter((message): message is NonNullable<ReturnType<typeof mapMessage>> => Boolean(message));
  const lastActivity = Number(conversation.lastActivityAt) || 0;
  return {
    id: ownChatId(input.accountId, conversationUrn),
    provider_id: conversationUrn,
    account_id: input.accountId,
    attendee_provider_id: conversation.groupChat ? undefined : other?.provider_id,
    ...(conversation.groupChat && text(conversation.title) ? { name: text(conversation.title) } : {}),
    unread_count: Number(conversation.unreadCount) || 0,
    read: conversation.read === true,
    timestamp: isoFromMillis(lastActivity),
    last_message_at: isoFromMillis(lastActivity),
    attendees,
    messages,
    lastActivityAt: lastActivity,
    conversationUrn,
  };
}

function graphqlElementsOf(value: unknown) {
  return asArray(asObject(value)?.elements).map(asObject).filter(Boolean) as Rec[];
}
