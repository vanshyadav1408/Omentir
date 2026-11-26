// Sender rotation: one campaign sending from several LinkedIn accounts. Each
// lead is given one sender when enrolled and keeps it for the whole sequence,
// so the invite and every message come from the same person.

type CampaignSenders = { linkedInAccountId?: string; senderAccountIds?: string[] };

// The accounts a campaign sends from. A campaign without rotation sends from
// its one linkedInAccountId (or the workspace default when that is unset).
export function campaignSenderIds(campaign: CampaignSenders) {
  const ids = campaign.senderAccountIds?.filter(Boolean) ?? [];
  if (ids.length) return [...new Set(ids)];
  return campaign.linkedInAccountId ? [campaign.linkedInAccountId] : [];
}

export function rotatesSenders(campaign: CampaignSenders) {
  return campaignSenderIds(campaign).length > 1;
}

// Enrollments made before rotation carry no sender and stay on the account
// their campaign always used.
export function enrollmentSenderId(
  campaign: CampaignSenders,
  enrollment: { linkedInAccountId?: string },
) {
  return enrollment.linkedInAccountId || campaign.linkedInAccountId;
}

// Hands `count` new leads to senders, each to whichever sender has the fewest
// leads so far, ties in list order. An account added later to a running
// campaign catches up first instead of everyone splitting evenly from then on.
export function assignSenders(
  count: number,
  senderIds: string[],
  existingCounts: Record<string, number> = {},
) {
  if (!senderIds.length) return [] as string[];
  const load = new Map(senderIds.map((id) => [id, existingCounts[id] ?? 0]));
  const assigned: string[] = [];
  for (let index = 0; index < count; index += 1) {
    let pick = senderIds[0];
    for (const id of senderIds) {
      if ((load.get(id) ?? 0) < (load.get(pick) ?? 0)) pick = id;
    }
    assigned.push(pick);
    load.set(pick, (load.get(pick) ?? 0) + 1);
  }
  return assigned;
}
