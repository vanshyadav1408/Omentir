import type { VisualKind } from "./visuals";

export type GuideTableData = {
  caption: string;
  headers: string[];
  rows: string[][];
};

export type GuideInsert = {
  afterIndex: number;
  visual?: VisualKind;
  caption?: string;
  table?: GuideTableData;
};

export type GuideEnrichment = {
  inserts: GuideInsert[];
  faq?: boolean;
};

export const GUIDE_MEDIA: Record<string, GuideEnrichment> = {
  "grok-bot-sales-outreach": {
    inserts: [
      {
        afterIndex: 0,
        visual: "hire-vs-do",
        caption: "Grok Bot can research and draft. You still take the meeting.",
      },
    ],
  },
  "grok-bot-cold-messages": {
    inserts: [
      {
        afterIndex: 0,
        visual: "inmail-invite-dm",
        caption: "Invite note, after-accept DM, InMail. Tell the Bot which box the draft is for.",
      },
    ],
  },
  "grok-bot-linkedin-automation": {
    inserts: [
      {
        afterIndex: 0,
        visual: "cloud-extension-api",
        caption: "Computer use on LinkedIn is the risk. MCP into Omentir is the send path.",
      },
    ],
  },
  "overnight-outbound-with-grok-bot": {
    inserts: [
      {
        afterIndex: 0,
        visual: "invite-wait-message",
        caption: "Overnight is a review list. Morning is when anything actually sends.",
      },
    ],
  },
};

export function guideMedia(slug: string): GuideEnrichment {
  return GUIDE_MEDIA[slug] ?? { inserts: [] };
}
