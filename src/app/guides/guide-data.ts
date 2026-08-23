import { GROK_BOT_GUIDES } from "./grok-bot-guides";
import type { GuidePage } from "./types";

export const ALL_GUIDES: GuidePage[] = GROK_BOT_GUIDES;

export function getGuidePage(slug: string) {
  return ALL_GUIDES.find((page) => page.slug === slug);
}
