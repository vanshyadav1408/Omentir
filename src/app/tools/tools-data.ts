import type { SeoRelatedLink } from "../seo-content/types";

export type FreeTool = {
  slug: "linkedin-profile-rating" | "improve-linkedin-profile" | "find-leads";
  href:
    | "/tools/linkedin-profile-rating"
    | "/tools/improve-linkedin-profile"
    | "/tools/find-leads";
  navLabel: string;
  title: string;
  lede: string;
  description: string;
  summary: string;
  disclaimer: string;
  ctaTitle: string;
  ctaBody: string;
  keywords: string[];
  publishedDate: string;
  updatedDate: string;
  faqItems: ReadonlyArray<{ question: string; answer: string }>;
  howItWorks?: ReadonlyArray<{ title: string; body: string }>;
  proTips?: readonly string[];
  bodySections?: ReadonlyArray<{ heading: string; paragraphs: string[] }>;
  relatedLinks?: readonly SeoRelatedLink[];
};

export const TOOLS_INDEX = {
  title: "Free tools",
  lede: "Rate a LinkedIn profile, improve the copy, or find 10 leads. No account.",
  description:
    "Free tools to rate a LinkedIn profile, improve LinkedIn profile copy, and find 10 public leads. No login.",
  path: "/tools",
} as const;

const DATE = "August 28, 2026";

export const ALL_TOOLS: readonly FreeTool[] = [
  {
    slug: "linkedin-profile-rating",
    href: "/tools/linkedin-profile-rating",
    navLabel: "Profile rating",
    title: "LinkedIn profile rating",
    lede: "Paste a public LinkedIn URL. Get a score out of 100 and a plain read of how a buyer would see the page.",
    description:
      "Rate a public LinkedIn profile. Paste the URL. Get a score out of 100 for headline, About, experience, proof, and outbound fit. No login.",
    summary:
      "Paste a public LinkedIn URL. Get a score for headline, About, experience, proof, and outbound fit. No login.",
    disclaimer:
      "This is not LinkedIn SSI. We score the public page for that URL. Login-only profiles will not load.",
    ctaTitle: "After the profile is readable, run the outreach",
    ctaBody:
      "Omentir finds ICP-fit buyers, drafts connection notes, and keeps replies in one inbox. You still set the daily send limits.",
    keywords: [
      "LinkedIn profile rating",
      "rate my LinkedIn profile",
      "LinkedIn profile score",
      "free LinkedIn profile review",
      "LinkedIn headline score",
    ],
    publishedDate: "August 27, 2026",
    updatedDate: DATE,
    faqItems: [
      {
        question: "Do I need an Omentir account?",
        answer:
          "No. This page is public. Paste the URL and run the score without signing in.",
      },
      {
        question: "What URL do I paste?",
        answer:
          "A public linkedin.com/in URL. We look up that page. We do not sign into LinkedIn. Company pages and login-only profiles will not load.",
      },
      {
        question: "Is this LinkedIn SSI?",
        answer:
          "No. LinkedIn Social Selling Index is LinkedIn's own number. This score is Omentir's read of how the written profile lands for a buyer who clicked a connection request.",
      },
      {
        question: "How is this different from Improve LinkedIn profile?",
        answer:
          "This page scores the public copy. Improve LinkedIn profile writes replacement text you can paste. Same URL works in both.",
      },
      {
        question: "What happens to the URL?",
        answer:
          "We look up the public page and send that copy to the model that scores it. This page does not create an account.",
      },
    ],
    howItWorks: [
      {
        title: "Paste the URL",
        body: "Drop a public linkedin.com/in URL. That is the only input.",
      },
      {
        title: "Read the public page",
        body: "We look up the public page. This page does not sign into LinkedIn.",
      },
      {
        title: "Score the words",
        body: "You get a score out of 100, plus what to fix. The number is ours, not LinkedIn SSI.",
      },
    ],
    proTips: [
      "Use a public linkedin.com/in URL. Company pages will not work.",
      "Login-only profiles will not load.",
      "This is not LinkedIn SSI. A high score here does not move LinkedIn's number.",
      "Read the gaps, not just the overall. A weak headline still loses the click.",
    ],
    bodySections: [
      {
        heading: "What the score covers",
        paragraphs: [
          "The number is five reads stacked: headline, About, experience, proof, and outbound fit. Outbound fit means whether a stranger who got your invite would understand who you help. A polished resume can still score poorly if it reads like you are hiring, not selling.",
          "We only see the public page. Private sections, SSI, and Sales Navigator extras are out of scope. If the URL needs a login, the score will not run.",
        ],
      },
      {
        heading: "What to do with a weak score",
        paragraphs: [
          "Fix the headline first. It sits next to the invite. Then About, then the top experience bullets. If you want paste-ready text instead of a punch list, open Improve LinkedIn profile with the same URL.",
        ],
      },
    ],
    relatedLinks: [
      {
        label: "Improve LinkedIn profile",
        href: "/tools/improve-linkedin-profile",
        description: "Same URL. Replacement headline, About, and experience bullets.",
      },
      {
        label: "How do I optimize my LinkedIn profile for outbound?",
        href: "/help/how-to-optimize-linkedin-profile-for-outbound",
        description: "Photo, headline, and About before you raise invite volume.",
      },
      {
        label: "Find 10 leads",
        href: "/tools/find-leads",
        description: "Once the page is readable, sample 10 public profiles that look like buyers.",
      },
    ],
  },
  {
    slug: "improve-linkedin-profile",
    href: "/tools/improve-linkedin-profile",
    navLabel: "Improve LinkedIn profile",
    title: "Improve LinkedIn profile",
    lede: "Paste a public LinkedIn URL. Get a tighter headline, About rewrite, and experience bullets you can paste back into LinkedIn.",
    description:
      "Improve a LinkedIn profile without an account. Paste a public URL. Get a headline, About, and experience rewrite that keeps the facts on the page.",
    summary:
      "Paste a public LinkedIn URL. Get a rewrite that keeps the facts on the public page. No login.",
    disclaimer:
      "The rewrite keeps companies, dates, and claims from the public page. If a number is missing, the suggestion will not invent one. Login-only profiles will not load.",
    ctaTitle: "After the profile is readable, run the outreach",
    ctaBody:
      "Omentir finds ICP-fit buyers, drafts connection notes, and keeps replies in one inbox. You still set the daily send limits.",
    keywords: [
      "improve LinkedIn profile",
      "how to improve LinkedIn profile",
      "LinkedIn headline generator",
      "rewrite LinkedIn About",
      "free LinkedIn profile suggestions",
    ],
    publishedDate: "August 27, 2026",
    updatedDate: DATE,
    faqItems: [
      {
        question: "Do I need an Omentir account?",
        answer:
          "No. Paste a public LinkedIn URL and run the rewrite without signing in.",
      },
      {
        question: "What URL do I paste?",
        answer:
          "A public linkedin.com/in URL. We look up that page. We do not sign into LinkedIn. Company pages and login-only profiles will not load.",
      },
      {
        question: "Will this invent metrics or job titles?",
        answer:
          "It should not. The rewrite keeps companies, dates, and claims from the public page. If a number is missing, the suggestion will not invent one.",
      },
      {
        question: "How is this different from LinkedIn profile rating?",
        answer:
          "Rating names the gaps. This page writes replacement copy. Use rating if you want the score first. Use this if you want text to paste.",
      },
      {
        question: "Who is this written for?",
        answer:
          "People who use LinkedIn for outbound: founders, SDRs, and operators whose profile gets opened after a connection request. The copy is meant to read as a peer landing page, not a resume of quota.",
      },
      {
        question: "What happens to the URL?",
        answer:
          "We look up the public page and send that copy to the model that rewrites it. This page does not create an account.",
      },
    ],
    howItWorks: [
      {
        title: "Paste the URL",
        body: "Drop a public linkedin.com/in URL. That is the only input.",
      },
      {
        title: "Read the public page",
        body: "We look up the public page. This page does not sign into LinkedIn.",
      },
      {
        title: "Rewrite the copy",
        body: "You get a tighter headline, About, and experience bullets. Facts stay. Missing numbers stay missing.",
      },
    ],
    proTips: [
      "Use a public linkedin.com/in URL. Company pages will not work.",
      "Login-only profiles will not load.",
      "Copy the suggestion into LinkedIn yourself. This page does not write to LinkedIn.",
      "If a number is missing, leave it missing.",
    ],
    bodySections: [
      {
        heading: "What the rewrite changes",
        paragraphs: [
          "You get a headline, an About block, experience bullets, and a skills line when the public page has enough to work with. Companies, dates, and claims stay. If a number is not on the page, the suggestion will not invent one.",
          "You paste the text into LinkedIn yourself. This page does not write to LinkedIn and does not sign in.",
        ],
      },
      {
        heading: "Who this is for",
        paragraphs: [
          "People whose profile gets opened after a connection request. Founders, SDRs, and operators selling over LinkedIn. The copy should read as a peer landing page. If the page currently reads like a quota resume, that is the problem this rewrite is trying to fix.",
        ],
      },
    ],
    relatedLinks: [
      {
        label: "LinkedIn profile rating",
        href: "/tools/linkedin-profile-rating",
        description: "Score the same URL before you rewrite it.",
      },
      {
        label: "How do I optimize my LinkedIn profile for outbound?",
        href: "/help/how-to-optimize-linkedin-profile-for-outbound",
        description: "Photo, headline, and About before you raise invite volume.",
      },
      {
        label: "What should a LinkedIn headline say for sales outreach?",
        href: "/help/what-should-a-linkedin-headline-say-for-sales",
        description: "Buyer plus problem, short enough to fit next to the invite.",
      },
    ],
  },
  {
    slug: "find-leads",
    href: "/tools/find-leads",
    navLabel: "Find leads",
    title: "Find 10 leads",
    lede: "Describe what you sell and who buys it. We search public professional profiles and show 10 people.",
    description:
      "Find 10 public profiles that look like buyers. Paste what you sell. No account. This page does not sign into LinkedIn or send messages.",
    summary: "Paste a business description. Get 10 public profiles. No login.",
    disclaimer:
      "This page searches public professional profiles. It does not sign into LinkedIn or send messages. Titles go stale. Open a profile before you treat someone as a buyer.",
    ctaTitle: "Want them messaged from your LinkedIn?",
    ctaBody:
      "Omentir finds buyers every day from your connected account, drafts the notes, and sends at the pace you set. This free search only shows a sample.",
    keywords: [
      "find LinkedIn leads",
      "free lead finder",
      "find B2B leads",
      "public profile lead search",
      "no login lead generator",
    ],
    publishedDate: "August 27, 2026",
    updatedDate: DATE,
    howItWorks: [
      {
        title: "Read the description",
        body: "Paste what you sell and who buys it. We turn that into a buyer query: role, company type, location.",
      },
      {
        title: "Search public profiles",
        body: "That query hits Exa's index of public professional profiles. This page does not sign into LinkedIn.",
      },
      {
        title: "Keep 10 names",
        body: "We drop duplicates and anyone without a public profile URL. You get 10 names.",
      },
    ],
    proTips: [
      "Name the buyer title, not just the market. \"Practice owner\" beats \"healthcare\".",
      "Say what you sell in one sentence, or the search returns people who work at firms like yours.",
      "Add a country or city. Skip it and you get a mixed map.",
      "Company size helps. \"20 to 200 people\" is clearer than \"SMB\".",
      "Search one ICP at a time. Mixing founders and VPs gives you both, poorly.",
      "Open the profile before you treat them as a buyer. Titles go stale.",
      "If the list looks like competitors, rewrite the prompt toward buyers, not sellers.",
      "Ten names is a sample. If they are wrong, change the description and search again.",
    ],
    faqItems: [
      {
        question: "Do I need an account?",
        answer:
          "No. The search runs without a login. We cap how often one visitor can search so the bill stays under control.",
      },
      {
        question: "Where do the names come from?",
        answer:
          "Exa's people index of public professional profiles. That is not the same as Omentir's LinkedIn finder, which runs from your connected account and can send outreach.",
      },
      {
        question: "Can I message them from this page?",
        answer:
          "No. You get names, roles, and profile links. Messaging from your LinkedIn account happens after you sign up and connect the profile.",
      },
      {
        question: "Why only 10?",
        answer:
          "Ten is enough to see if the targeting is close. Daily lists, scoring, and sending need an Omentir account.",
      },
      {
        question: "Are these guaranteed buyers?",
        answer:
          "No. Public profiles go stale and a matching title is not a buying intent. Treat the list as a starting point.",
      },
    ],
    bodySections: [
      {
        heading: "What this search does",
        paragraphs: [
          "You describe the business. We search public professional profiles and return 10 people. It is a targeting check. It is not a daily list or a send queue.",
          "Omentir's paid finder runs from your connected LinkedIn account and can message at the pace you set. This page does not sign into LinkedIn. Titles on public profiles go stale. Open the link before you treat someone as a buyer.",
        ],
      },
    ],
    relatedLinks: [
      {
        label: "LinkedIn profile rating",
        href: "/tools/linkedin-profile-rating",
        description: "Score your own page before those 10 people open it.",
      },
      {
        label: "Improve LinkedIn profile",
        href: "/tools/improve-linkedin-profile",
        description: "Rewrite headline and About so the invite has a landing page.",
      },
      {
        label: "Grok Bot for lead generation",
        href: "/grok-bot-lead-generation",
        description: "Overnight scored lists through Omentir, not a cloud browser on LinkedIn.",
      },
    ],
  },
];

export function getTool(slug: FreeTool["slug"]) {
  return ALL_TOOLS.find((tool) => tool.slug === slug);
}
