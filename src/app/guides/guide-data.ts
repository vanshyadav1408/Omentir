import { CHAT_OPERATOR_GUIDES } from "./chat-operator-guides";
import { CLAUDE_CODE_GUIDES } from "./claude-code-guides";
import { CODEX_GUIDES } from "./codex-guides";
import { CURSOR_GUIDES } from "./cursor-guides";
import { GROK_BOT_GUIDES } from "./grok-bot-guides";
import type { GuidePage } from "./types";

export const ALL_GUIDES: GuidePage[] = [
  ...GROK_BOT_GUIDES,
  ...CLAUDE_CODE_GUIDES,
  ...CURSOR_GUIDES,
  ...CODEX_GUIDES,
  ...CHAT_OPERATOR_GUIDES,
];

export function getGuidePage(slug: string) {
  return ALL_GUIDES.find((page) => page.slug === slug);
}
