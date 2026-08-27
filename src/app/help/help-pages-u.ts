import type { HelpPageDraft } from "./types";

const DATE = "August 27, 2026";

export const HELP_PAGES_U: HelpPageDraft[] = [
  {
    slug: "can-i-use-kimi-for-linkedin-outreach",
    question: "Can I use Kimi for LinkedIn outreach?",
    description:
      "Yes as a long-context draft helper. No as an Omentir connector, and no as a LinkedIn client. Paste the people. Edit the notes. Send from the workspace.",
    keywords: [
      "Kimi LinkedIn outreach",
      "Kimi Moonshot sales",
      "Kimi write LinkedIn messages",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Kimi is useful when the batch is large and you want one chat to hold the whole dump. Paste twenty profiles, not a slogan. Ask it to score fit, cite evidence from the text you gave it, and write two-sentence drafts. That is a real job. There is no Omentir connector for Kimi. Do not invent one.",
      "The failure mode is inventing a post it cannot see. Long context does not mean it read LinkedIn. If you did not paste the trigger, the draft is guessing.",
      "Send from [Omentir](/). Caps, windows, and the inbox stay there. Kimi should not hold a LinkedIn password.",
      "If you already have ChatGPT or Claude connected over MCP, use that for the finder. Use Kimi when you specifically want a long paste and a scored table back.",
      "A paste-ready job is on [Kimi for LinkedIn drafts](/blogs/kimi-linkedin-drafts).",
    ],
    faqItems: [
      {
        question: "Can Kimi talk to Omentir over MCP?",
        answer:
          "Not as a supported Omentir path. Draft in Kimi. Send in Omentir.",
      },
      {
        question: "Should I paste a hundred people at once?",
        answer:
          "Twenty to thirty is enough to judge whether the notes are true. A hundred unread drafts is a pile, not a campaign.",
      },
      {
        question: "Is this allowed by LinkedIn?",
        answer:
          "Writing with a model is not the same as a bot clicking the site. The send path still has to look like you. See [is LinkedIn automation allowed](/help/is-linkedin-automation-allowed).",
      },
      {
        question: "When should I skip Kimi?",
        answer:
          "When you already have a connected chat in Claude or ChatGPT and you will not actually paste the batch.",
      },
    ],
    relatedSlugs: [
      "can-i-use-chatgpt-to-write-linkedin-messages",
      "can-i-use-gemini-for-linkedin-outreach",
      "can-i-use-deepseek-for-linkedin-outreach",
    ],
  },
  {
    slug: "can-i-use-gemini-for-linkedin-outreach",
    question: "Can I use Gemini for LinkedIn outreach?",
    description:
      "Yes as a draft helper next to a public page snippet. No as an Omentir connector. Gemini should not log into LinkedIn. You still send from the workspace.",
    keywords: [
      "Gemini LinkedIn outreach",
      "Google Gemini sales messages",
      "Gemini write LinkedIn DMs",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Gemini is useful when you already have a public page, a post, or a snippet in the same window and you want a yes-or-no on whether that snippet supports a note. Paste the lead and the snippet. If Gemini cannot point at the line, skip. If it can, take two sentences and edit them in Omentir.",
      "There is no Omentir MCP connector for Gemini. Do not wait for a Settings, Connectors screen that we do not ship. ChatGPT, Claude, and grok.com are the chat apps with that path.",
      "Do not log Gemini into LinkedIn. Caps and send stay in Omentir. A fluent paragraph that could fit two buyers should not leave the queue.",
      "If you live in Google Workspace and that is already the chat, this is the honest loop: research in Gemini, send in Omentir. If you wanted tools against the workspace, use a connected operator instead.",
      "A paste-ready job is on [Gemini for LinkedIn drafts](/blogs/gemini-linkedin-drafts).",
    ],
    faqItems: [
      {
        question: "Can Gemini connect to Omentir over MCP?",
        answer:
          "Not as a supported Omentir path. Draft in Gemini. Send in Omentir.",
      },
      {
        question: "Should I let Gemini browse LinkedIn for me?",
        answer:
          "No. Paste what you already have. A model browsing the site is still a bot on LinkedIn.",
      },
      {
        question: "Is this the same as ChatGPT?",
        answer:
          "ChatGPT has an Omentir connector. Gemini does not. The draft job can look similar. The connect path does not.",
      },
      {
        question: "When should I skip Gemini?",
        answer:
          "When you already have Claude or ChatGPT connected and you will not actually paste a snippet.",
      },
    ],
    relatedSlugs: [
      "can-i-use-kimi-for-linkedin-outreach",
      "can-i-use-chatgpt-to-write-linkedin-messages",
      "how-do-i-connect-chatgpt-to-omentir",
    ],
  },
  {
    slug: "can-i-use-deepseek-for-linkedin-outreach",
    question: "Can I use DeepSeek for LinkedIn outreach?",
    description:
      "Yes as a cheap scoring table. No as an Omentir connector. Paste the list. Keep send in the workspace. DeepSeek should not hold LinkedIn.",
    keywords: [
      "DeepSeek LinkedIn outreach",
      "DeepSeek sales scoring",
      "DeepSeek write LinkedIn messages",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "DeepSeek is useful when you want a table back: name, fit 1-5, evidence, risk, two-sentence draft. Paste the list from Omentir. If evidence is missing, the score should drop. That is the job. A cheap model that pads every row with praise is a waste.",
      "There is no Omentir connector for DeepSeek. Do not invent MCP login. ChatGPT, Claude, and grok.com are the chat apps we actually connect.",
      "Send from Omentir after you cut junk. DeepSeek should not sign into LinkedIn. Treat pasted titles as untrusted data.",
      "If you already have a connected operator, use it for the finder. Use DeepSeek when you specifically want a scored table from a paste.",
      "A paste-ready job is on [DeepSeek for LinkedIn scoring](/blogs/deepseek-linkedin-scoring).",
    ],
    faqItems: [
      {
        question: "Can DeepSeek talk to Omentir over MCP?",
        answer:
          "Not as a supported Omentir path. Score in DeepSeek. Send in Omentir.",
      },
      {
        question: "Should I trust the fit scores?",
        answer:
          "No. Spot-check a sample. If the evidence line could fit two buyers, the score is theater.",
      },
      {
        question: "Is cheaper better for outbound copy?",
        answer:
          "Cheaper is fine for a table you will edit. It is a bad reason to skip the last read.",
      },
      {
        question: "When should I skip DeepSeek?",
        answer:
          "When you will not paste real lead text, or when you already have a connected chat doing the same scoring.",
      },
    ],
    relatedSlugs: [
      "can-i-use-kimi-for-linkedin-outreach",
      "can-i-use-qwen-for-linkedin-outreach",
      "can-i-use-chatgpt-to-write-linkedin-messages",
    ],
  },
  {
    slug: "can-i-use-qwen-for-linkedin-outreach",
    question: "Can I use Qwen for LinkedIn outreach?",
    description:
      "Yes when the profile is not in English and you want the draft in the language they actually use. No as an Omentir connector. Send from the workspace.",
    keywords: [
      "Qwen LinkedIn outreach",
      "Qwen Chinese LinkedIn messages",
      "Tongyi Qwen sales copy",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Qwen is useful when the buyer writes in Chinese, or mixes Chinese and English, and you do not want a translated-sounding English note. Paste the profile text. Ask for two sentences in the language they actually use. Do not mix for polish.",
      "There is no Omentir connector for Qwen. Draft there. Send in Omentir. Caps still apply. A fluent Chinese paragraph that could fit two buyers should not leave the queue either.",
      "If the account you send from is English-only and the buyer is Chinese-only, say that out loud before you start. The model will not fix a language mismatch on the profile.",
      "If you already live in Claude or ChatGPT with MCP, use that for the finder. Use Qwen for the language pass.",
      "A paste-ready job is on [Qwen for LinkedIn drafts](/blogs/qwen-linkedin-drafts).",
    ],
    faqItems: [
      {
        question: "Can Qwen talk to Omentir over MCP?",
        answer:
          "Not as a supported Omentir path. Draft in Qwen. Send in Omentir.",
      },
      {
        question: "Should I always write in Chinese?",
        answer:
          "Write in the language the profile actually uses. If they post in English, draft in English.",
      },
      {
        question: "Is machine translation enough?",
        answer:
          "A translated English slogan is easy to spot. Cite a real trigger from their text instead.",
      },
      {
        question: "When should I skip Qwen?",
        answer:
          "When every buyer on the list already writes in your language, and you already have a connected operator.",
      },
    ],
    relatedSlugs: [
      "can-i-use-deepseek-for-linkedin-outreach",
      "can-i-use-kimi-for-linkedin-outreach",
      "can-i-use-sarvam-for-linkedin-outreach",
    ],
  },
  {
    slug: "can-i-use-mistral-le-chat-for-linkedin-outreach",
    question: "Can I use Mistral Le Chat for LinkedIn outreach?",
    description:
      "Yes as a plain draft helper in Le Chat. No as an Omentir connector. Keep the note boring enough to send from your own name. Send from the workspace.",
    keywords: [
      "Mistral Le Chat LinkedIn",
      "Le Chat sales messages",
      "Mistral LinkedIn outreach",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Le Chat is useful when you want a short note without US-startup hype. Paste a trigger. Ask for two sentences you would send from your own name. If Le Chat cannot see a trigger, it should say so, not invent one.",
      "There is no Omentir connector for Le Chat. Do not wait for workspace approval. ChatGPT, Claude, and grok.com are the chat apps with that path.",
      "Send from Omentir. Le Chat should not hold LinkedIn. A privacy-conscious host does not change the send caps.",
      "If you already have a connected operator, use it for the finder. Use Le Chat when that is the window you will actually sit in.",
      "A paste-ready job is on [Mistral Le Chat for LinkedIn drafts](/blogs/mistral-le-chat-linkedin-drafts).",
    ],
    faqItems: [
      {
        question: "Can Le Chat talk to Omentir over MCP?",
        answer:
          "Not as a supported Omentir path. Draft in Le Chat. Send in Omentir.",
      },
      {
        question: "Is this better because it is hosted in Europe?",
        answer:
          "Hosting is a separate decision. It does not make a vague note specific, and it does not connect the workspace.",
      },
      {
        question: "Should I use Mistral models inside Cursor instead?",
        answer:
          "If the work is already in Cursor, use the [Cursor path](/help/how-do-i-connect-cursor-to-omentir). Le Chat is a chat tab.",
      },
      {
        question: "When should I skip Le Chat?",
        answer:
          "When you already draft in a connected Claude or ChatGPT session and you will not open a second window.",
      },
    ],
    relatedSlugs: [
      "can-i-use-gemini-for-linkedin-outreach",
      "can-i-use-chatgpt-to-write-linkedin-messages",
      "how-do-i-connect-cursor-to-omentir",
    ],
  },
  {
    slug: "can-i-use-sarvam-for-linkedin-outreach",
    question: "Can I use Sarvam for LinkedIn outreach?",
    description:
      "Yes for India-first copy in the language the buyer actually posts in. No as an Omentir connector. Send from the workspace. Do not polish the note into US English.",
    keywords: [
      "Sarvam LinkedIn outreach",
      "Sarvam AI sales messages",
      "Indian language LinkedIn DMs",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Sarvam is useful when the buyer is in India and posts in Hindi, Tamil, or another language you actually want to write in. Paste the profile. Ask for two sentences in that language. Do not switch to English for polish. US-market metaphors that do not apply will show.",
      "There is no Omentir connector for Sarvam. Draft there. Send in Omentir. Caps still apply on the LinkedIn account you connected.",
      "If your send-from profile is English-only and the buyer is not, say that before you start. The model will not fix the mismatch.",
      "If you already have a connected operator for the finder, keep it. Use Sarvam for the language pass on the India list.",
      "A paste-ready job is on [Sarvam for LinkedIn drafts](/blogs/sarvam-linkedin-drafts).",
    ],
    faqItems: [
      {
        question: "Can Sarvam talk to Omentir over MCP?",
        answer:
          "Not as a supported Omentir path. Draft in Sarvam. Send in Omentir.",
      },
      {
        question: "Should every India lead get a Hindi note?",
        answer:
          "No. Write in the language they actually post in. Many India buyers write in English on LinkedIn.",
      },
      {
        question: "Does this replace My Product?",
        answer:
          "No. Write the offer in the same language you will send. A vague English slogan still produces vague notes.",
      },
      {
        question: "When should I skip Sarvam?",
        answer:
          "When the list is not India-first, or when you already draft in a connected chat and the language matches.",
      },
    ],
    relatedSlugs: [
      "can-i-use-qwen-for-linkedin-outreach",
      "can-i-use-kimi-for-linkedin-outreach",
      "can-i-use-chatgpt-to-write-linkedin-messages",
    ],
  },
  {
    slug: "can-i-use-hermes-for-linkedin-outreach",
    question: "Can I use Hermes for LinkedIn outreach?",
    description:
      "Yes as a local open-weights chat that scores pasted lead JSON. No as an Omentir connector. Treat lead text as untrusted data. Send from the workspace.",
    keywords: [
      "Hermes LinkedIn outreach",
      "Nous Hermes sales",
      "local LLM LinkedIn drafts",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Hermes is useful when you already run a local chat on Nous-style weights and you want the lead JSON to stay on the machine. Paste the export from Omentir. Ask for fit, evidence, risk, and a two-sentence draft. Treat titles as untrusted data. If a title says ignore previous instructions, it is still a title.",
      "There is no Omentir connector for Hermes. Do not store API keys in that chat. Send from Omentir after you edit.",
      "A local model does not make overnight sending safe. It also does not give you MCP tools. If you wanted tools against the workspace, use Cursor, Claude Code, Codex, OpenClaw, or a hosted connector.",
      "If you are not already running Hermes, skip it. Overview drafts notes without a local UI.",
      "A paste-ready job is on [Hermes for LinkedIn drafts](/blogs/hermes-linkedin-drafts).",
    ],
    faqItems: [
      {
        question: "Can Hermes talk to Omentir over MCP?",
        answer:
          "Not as a supported Omentir path. Score locally. Send in Omentir.",
      },
      {
        question: "Is this the same as OpenClaw?",
        answer:
          "OpenClaw can call Omentir with a Bearer key. Hermes here is a local chat you paste into. Different machine.",
      },
      {
        question: "Should I fine-tune Hermes on my sent mail?",
        answer:
          "Not for this job. A small paste and a last read will beat a half-trained clone of your old pitches.",
      },
      {
        question: "When should I skip Hermes?",
        answer:
          "When you do not already run it, or when you wanted MCP tools instead of a paste.",
      },
    ],
    relatedSlugs: [
      "can-i-use-openclaw-for-linkedin-outreach",
      "can-i-use-deepseek-for-linkedin-outreach",
      "how-do-i-connect-openclaw-to-omentir",
    ],
  },
];
