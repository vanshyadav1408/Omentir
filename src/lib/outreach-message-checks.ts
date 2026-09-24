// Deterministic checks for AI-drafted LinkedIn outreach. The writer model
// proposes several candidates, these rules drop the ones with a mechanical
// failure, and a judge model picks between the survivors. Anything code can
// decide lives here instead of in the prompt, so the prompt can spend its
// words on voice and judgment.

export type OutreachMessageKind = "first" | "follow_up" | "final" | "reply";

export type OutreachCheckContext = {
  kind: OutreachMessageKind;
  leadFirstName: string;
  leadHasReplied: boolean;
  // Demo-goal campaigns may offer a short call once the first message landed.
  allowCallAsk: boolean;
  // Pricing only after the lead asked about it.
  pricingAllowed: boolean;
  // The one link a reply may carry (the approved scheduling link).
  allowedLink?: string;
  // A reply that must carry the scheduling link fails without it.
  requireAllowedLink?: boolean;
  maxChars: number;
};

// Phrases that make a DM read as software or a sales template. Each one has
// shown up in real drafts; the label says what the recipient reads it as.
const ROBOTIC_PHRASES: Array<[RegExp, string]> = [
  [
    /\b(?:following up|circling back|bumping (?:this|my)|just checking in|touching base|did you (?:see|get a chance))\b/i,
    "follow-up cliche",
  ],
  [/\bhope (?:this|you're|you are|all is|that helps)\b/i, "email pleasantry"],
  [
    /\b(?:let me know|feel free|happy to help|would you like|don't hesitate|pick your brain)\b/i,
    "chatbot phrasing",
  ],
  [
    /\b(?:quick question|caught my eye|came across your profile|stumbled (?:up)?on|i noticed that|impressive|impressed)\b/i,
    "cold opener cliche",
  ],
  [
    /\b(?:game[- ]?changer|revolutioni[sz]\w*|streamlin\w*|leverag\w*|synerg\w*|cutting[- ]edge|seamless\w*|unlock\w*|supercharg\w*|next level|empower\w*|elevate|robust)\b/i,
    "marketing buzzword",
  ],
  [
    /\b(?:delve|landscape|pivotal|crucial|foster|vibrant|additionally|furthermore|moreover|in today's)\b/i,
    "AI vocabulary",
  ],
  [/\bwe help\b/i, "\"we help [audience] [result]\" template"],
  [/\b(?:at its core|here's the thing|real talk|let's be honest|honestly)\b/i, "fake candor"],
];

const CALL_ASK =
  /\b(?:demo|meeting|zoom|calendly|hop on|jump on|walk you through|show you around|a call|(?:quick|short|brief|15[- ]?min(?:ute)?|20[- ]?min(?:ute)?) (?:call|chat))\b/i;

const LINK = /https?:\/\/\S+|\bwww\.\S+|\b[a-z0-9-]+\.(?:com|io|ai|co|app|dev|net|org)\b/i;

const GREETING = /^(?:hi|hey|hello)\b/i;

// Asking a stranger what hurts reads as a discovery script.
const PAIN_PROBE =
  /\b(?:struggl\w*|headaches?|pain points?|frustrat\w*|biggest challenge|run into (?:issues|problems|mistakes|trouble))\b/i;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// The model writes "I am here" and "It is $59" even when told to use
// contractions, and uncontracted phrasing is one of the easiest bot tells to
// spot in a DM. Only unambiguous pairs are contracted.
const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\bI am\b/g, "I'm"],
  [/\bI will\b/g, "I'll"],
  [/\b([Ii])t is (?=\S)/g, "$1t's "],
  [/\b([Tt])hat is (?=\S)/g, "$1hat's "],
  [/\b([Dd])o not\b/g, "$1on't"],
  [/\b([Dd])oes not\b/g, "$1oesn't"],
  [/\b([Cc])annot\b/g, "$1an't"],
];

export function contractOutreachMessage(message: string) {
  return CONTRACTIONS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), message);
}

// Pricing detection is shared with the reply policy, so it is passed in rather
// than duplicated here.
export function outreachMessageViolations(
  message: string,
  context: OutreachCheckContext,
  containsPricingDetails: (message: string) => boolean,
): string[] {
  const text = message.trim();
  if (!text) return ["empty"];
  const violations: string[] = [];
  const cold = context.kind !== "reply" && !context.leadHasReplied;
  const questions = (text.match(/\?/g) || []).length;

  if (text.length > context.maxChars) violations.push(`over ${context.maxChars} characters`);

  // Addressing a stranger by first name reads as mail merge. Word-bounded so a
  // short name never matches inside an ordinary word ("Al" in "already").
  const name = context.leadFirstName.trim();
  if (name.length > 1 && new RegExp(`\\b${escapeRegExp(name)}\\b`, "i").test(text)) {
    violations.push("addresses the lead by name");
  }

  if (context.kind === "first") {
    if (!text.startsWith("Hi,")) violations.push("first message must open with \"Hi,\"");
    if (questions !== 1) violations.push("first message needs exactly one question");
  } else if (context.kind !== "reply" && GREETING.test(text)) {
    violations.push("greeting in the middle of a thread");
  }

  for (const [pattern, label] of ROBOTIC_PHRASES) {
    if (pattern.test(text)) violations.push(label);
  }

  const withoutAllowedLink = context.allowedLink ? text.split(context.allowedLink).join(" ") : text;
  if (LINK.test(withoutAllowedLink)) violations.push("unapproved link");
  if (context.requireAllowedLink && context.allowedLink && !text.includes(context.allowedLink)) {
    violations.push("missing scheduling link");
  }

  if (!context.pricingAllowed && containsPricingDetails(text)) violations.push("mentions pricing");

  if (cold) {
    // Nobody has answered yet: pressure and hype are what get a stranger ignored.
    if (text.includes("!")) violations.push("exclamation mark in a cold message");
    if (questions > 1) violations.push("more than one question");
    if (PAIN_PROBE.test(text)) violations.push("probes for pain");
    const callAskAllowed = context.allowCallAsk && context.kind !== "first";
    if (!callAskAllowed && CALL_ASK.test(text)) violations.push("asks for a call or demo");
  }

  return violations;
}
