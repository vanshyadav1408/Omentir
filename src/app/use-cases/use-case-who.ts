export type UseCaseWho = {
  who: string;
};

const WHO: Record<string, UseCaseWho> = {
  "replace-first-sdr": {
    who: "Founders and tiny teams delaying a first sales hire",
  },
  "book-linkedin-demos": {
    who: "Anyone with LinkedIn replies that die before a calendar link",
  },
  "prospect-commenters": {
    who: "Teams who want commenters on competitor posts, not a scraped employee list",
  },
  "outbound-for-founders": {
    who: "Founders who still take the calls",
  },
  "open-source-ai-sdr": {
    who: "Buyers who will read the repo or self-host",
  },
  "grok-bot-outbound": {
    who: "People who already have Grok Bot and want LinkedIn sales without a cloud browser driving the account",
  },
};

export function whoForUseCase(slug: string): UseCaseWho {
  const row = WHO[slug];
  if (!row) {
    throw new Error(`Missing use-case who row for ${slug}`);
  }
  return row;
}
