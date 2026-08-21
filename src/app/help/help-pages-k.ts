import type { HelpPageDraft } from "./types";

const DATE = "August 19, 2026";

export const HELP_PAGES_K: HelpPageDraft[] = [
  {
    slug: "what-is-social-selling",
    question: "What is social selling?",
    description:
      "Social selling is using networks like LinkedIn to find buyers, start conversations, and stay visible, instead of only cold-calling a list. It is not a license to spam DMs.",
    keywords: [
      "what is social selling",
      "social selling on LinkedIn",
      "social selling vs outbound",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "LinkedIn popularized social selling as brand, finding people, engaging with posts, and building relationships. SSI is their score for those habits. The useful version is simpler: show up where buyers already are, say something specific, then ask for a conversation.",
      "It is still outbound when you go first. Calling it social does not make a pitch in the invite polite. The people who do this well comment, listen, and send fewer notes.",
      "It is not a replacement for a CRM, a demo, or a product that works. A high SSI with no meetings is a hobby.",
      "If your company banned LinkedIn because \"social selling\" meant 200 identical DMs, they were reacting to spam. Do the version with a cap and a reason.",
      "Omentir sits on the outbound side of this: find ICP-fit people, send as you, handle replies. It will not post thought leadership for you. That part is still you.",
    ],
    faqItems: [
      {
        question: "Is social selling just content?",
        answer:
          "Content can support it. DMs without any public presence still work. Content without DMs is a brand bet.",
      },
      {
        question: "Do I need SSI to social sell?",
        answer:
          "No. SSI is a mirror. See [what is LinkedIn SSI](/help/what-is-linkedin-ssi).",
      },
      {
        question: "Is this the same as social media marketing?",
        answer:
          "Marketing is usually broadcast. Social selling is 1:1 with a name. Different jobs, same app.",
      },
      {
        question: "Can SDRs do this, or only founders?",
        answer:
          "Anyone with a real profile can. SDRs need a tighter cap because the market sees more of them.",
      },
    ],
    relatedSlugs: [
      "what-is-linkedin-ssi",
      "how-to-comment-on-linkedin-before-outreach",
      "how-to-personalize-linkedin-outreach",
    ],
  },
  {
    slug: "what-is-sql-vs-mql",
    question: "What is an SQL vs an MQL in B2B outbound?",
    description:
      "An MQL is a marketing-qualified lead. An SQL is sales-qualified. Outbound LinkedIn replies are usually neither until a human says they fit and want a next step.",
    keywords: [
      "SQL vs MQL",
      "sales qualified lead outbound",
      "MQL LinkedIn",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "MQL usually means marketing thinks they are worth sales time: a form, a score, a webinar. SQL usually means sales accepted them as a real opportunity to work. Companies fight about the handoff because the words are vague.",
      "A LinkedIn accept is not an MQL. A \"tell me more\" is closer. A booked meeting with fit is closer to SQL. Write your own definitions in one sentence each or the CRM will lie.",
      "Outbound teams often skip MQL entirely. The same person found the lead, talked, and booked. That is fine. Do not invent a marketing stage for a two-person company.",
      "When you add an SDR, the fight starts: they want credit for every reply, AEs want only people who can buy. Solve it with a written SQL bar (ICP plus need plus a next step), not with more stages.",
      "If a tool auto-marks every positive sentiment as SQL, turn that off. Sentiment is not budget.",
    ],
    faqItems: [
      {
        question: "Where does a demo sit?",
        answer:
          "Often after SQL, sometimes as the SQL event. Pick one and keep it still.",
      },
      {
        question: "Is a referral an MQL?",
        answer:
          "Treat it as a warm inbound with a shorter path. Do not make them fill the MQL form as punishment.",
      },
      {
        question: "Should LinkedIn leads go to marketing automation?",
        answer:
          "Only if they opted into email. A DM reply is not a newsletter signup.",
      },
      {
        question: "What is an SAL?",
        answer:
          "Sales accepted lead, a middle stage some teams use. If you do not have a dispute, you do not need it.",
      },
    ],
    relatedSlugs: [
      "how-to-qualify-a-linkedin-lead",
      "what-is-bant-in-b2b-sales",
      "what-is-a-good-outbound-meeting-booked-rate",
    ],
  },
  {
    slug: "what-is-a-good-cold-email-subject-line",
    question: "What is a good cold email subject line?",
    description:
      "Specific and boring beats clever. Name the trigger or the topic. Mystery and \"Quick question\" train filters and humans to skip you.",
    keywords: [
      "good cold email subject line",
      "cold email subject line examples",
      "best subject lines 2026",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "The subject should still be true after they open. Clickbait that turns into a product dump is how you get deleted and complained on.",
      "Working patterns: a hire, a tool they use, a one-line observation, their company plus a problem. \"Acme + AE ramp\" is enough. \"URGENT partnership\" is not.",
      "Length: a few words. Mobile truncates. Front-load the meaning. Lowercase is optional. Personalization tokens that break (\"Hi {{FirstName}}\") are worse than no token.",
      "Test two subjects on the same list definition. Opens are noisy in 2026 because of privacy protection. Use replies as the real score.",
      "If you cannot write a subject without the product name, you are advertising. Ads can work. They are not what people mean by cold email that gets a conversation.",
    ],
    faqItems: [
      {
        question: "Should I use Re: or Fwd:?",
        answer:
          "No. Fake reply threads are a known trick and a trust hit when they notice.",
      },
      {
        question: "Do emojis help?",
        answer:
          "They can look like retail promo mail. Skip them for B2B first touch.",
      },
      {
        question: "Is the company name in the subject enough personalization?",
        answer:
          "It is hygiene. Pair it with a real first line. See [cold email first line](/help/how-to-write-a-cold-email-first-line).",
      },
      {
        question: "Can I use the same subject as the InMail?",
        answer:
          "You can if it is still true. Do not send both the same morning with the same subject. That is a surround.",
      },
    ],
    relatedSlugs: [
      "how-to-write-a-cold-email-first-line",
      "what-is-a-good-cold-email-open-rate",
      "how-long-should-a-cold-email-be",
    ],
  },
  {
    slug: "do-i-need-spf-dkim-dmarc-for-cold-email",
    question: "Do I need SPF, DKIM, and DMARC for cold email?",
    description:
      "Yes. Mailbox providers expect authentication. Sending without them is how you land in spam before the copy gets a chance.",
    keywords: [
      "SPF DKIM DMARC cold email",
      "email authentication outbound",
      "set up DMARC for cold email",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "SPF says which servers may send for the domain. DKIM signs the message. DMARC tells receivers what to do when those fail. This is baseline for any domain that sends mail, not a growth hack.",
      "Set them up on the sending domain before warmup. A tool that \"just works\" without DNS is sending from someone else's reputation, or it will break.",
      "Start DMARC in monitoring (p=none) until you know what is sending as you, then tighten. Do not jump to reject on a domain you do not understand. You can kill customer mail too if it is the same domain.",
      "Alignment matters. If the visible From domain and the authenticated domain disagree, filters get suspicious. Keep them in the same family.",
      "Authentication will not save a dirty list or a complaint spike. It is necessary, not sufficient. See [why mail goes to spam](/help/why-are-my-cold-emails-going-to-spam).",
    ],
    faqItems: [
      {
        question: "Can I send from Gmail without this?",
        answer:
          "Personal Gmail is not a cold outbound system. Workspace domains still need the records. Do not blast from a free Gmail.",
      },
      {
        question: "How long until DNS works?",
        answer:
          "Minutes to a day. Send a test to yourself and check the headers. Do not start a 5,000-person campaign on hope.",
      },
      {
        question: "Does LinkedIn need SPF?",
        answer:
          "LinkedIn DMs are not email. Different channel. If your sequence hops to email, that hop needs DNS.",
      },
      {
        question: "Who should set this up?",
        answer:
          "Whoever owns the domain DNS. If that is not you, write the records down and sit with them. Guessing TXT records is how sites break.",
      },
    ],
    relatedSlugs: [
      "should-i-use-a-separate-domain-for-cold-email",
      "how-long-to-warm-up-a-cold-email-domain",
      "why-are-my-cold-emails-going-to-spam",
    ],
  },
  {
    slug: "how-long-to-warm-up-a-cold-email-domain",
    question: "How long should I warm up a cold email domain?",
    description:
      "Plan on two to four weeks of rising, real-looking volume before a campaign. A new domain that sends like an old server on day one buys a spam folder.",
    keywords: [
      "cold email domain warmup",
      "how long to warm up email domain",
      "new domain warmup outbound",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "New domains have no reputation. Warmup is sending small amounts of mail that gets opened and replied to, then raising the cap. Tools can help. They cannot invent a five-year-old domain.",
      "Two weeks is a minimum for many teams. Four is safer if the domain is brand new or the brand is unknown. Copying someone else's 3-day warmup is how you share their bad luck.",
      "Do not warmup and blast the same week at 200 a day. The warmup graph should look like a slope, not a cliff.",
      "Keep bounces near zero during warmup. One dirty list can poison the domain before the campaign \"starts.\"",
      "If the domain already sends customer mail, do not warmup cold on it. Use a sibling domain. See [separate domain](/help/should-i-use-a-separate-domain-for-cold-email).",
    ],
    faqItems: [
      {
        question: "Can I skip warmup on Google Workspace?",
        answer:
          "You can skip it. You will learn why people do not. Providers still watch new sending patterns.",
      },
      {
        question: "Does LinkedIn warmup replace email warmup?",
        answer:
          "No. Different reputations. Warm the LinkedIn seat and the domain as separate jobs.",
      },
      {
        question: "What if I bought an aged domain?",
        answer:
          "Aged can help or hurt if it has a spam history. Check it. Age is not innocence.",
      },
      {
        question: "When do I know warmup is done?",
        answer:
          "When seed inboxes land in primary, bounce is low, and you can raise volume a little without a placement crash. Then still raise slowly.",
      },
    ],
    relatedSlugs: [
      "how-many-cold-emails-can-i-send-per-day",
      "do-i-need-spf-dkim-dmarc-for-cold-email",
      "how-to-warm-up-a-linkedin-account-for-outreach",
    ],
  },
  {
    slug: "what-is-a-good-cold-email-bounce-rate",
    question: "What is a good cold email bounce rate?",
    description:
      "Keep hard bounces under about 2 percent. Higher usually means bad data. Providers treat bounce spikes as a reason to distrust the domain.",
    keywords: [
      "good cold email bounce rate",
      "acceptable bounce rate outbound",
      "high bounce rate cold email",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A hard bounce means the address does not exist or will not take mail. Soft bounces are temporary. Count hard bounces against list quality. Vendor benches often show average campaigns well above 2 percent. That average is not a target. It is a warning that a lot of lists are dirty.",
      "Verify before send. Remove role accounts if they bounce. Stop the campaign if bounce jumps. Sending through a spike \"to finish the list\" is how the domain dies for a month.",
      "Catch-all domains can look delivered and still be junk. Verification plus small tests beat a waterfall that marks everything valid.",
      "Bounces are not replies. Do not celebrate a 0 percent bounce on a list that also has 0 percent replies if you only sent to 12 friends.",
      "If a new source of leads always arrives with high bounce, fire the source. See [email verification](/help/what-is-email-verification).",
    ],
    faqItems: [
      {
        question: "Is 5 percent bounce OK because Woodpecker's average is 5?",
        answer:
          "Averages include messy accounts. Stay under 2 percent if you want a domain next quarter.",
      },
      {
        question: "Do out-of-office messages count as bounces?",
        answer:
          "They should not. They are replies. Configure the tool so it does not punish you for OOO.",
      },
      {
        question: "Should I retry hard bounces?",
        answer:
          "No. Retrying a dead address is how you look like a bot to the provider.",
      },
      {
        question: "Does LinkedIn have bounce rates?",
        answer:
          "Not the same way. Ignores and IDK are the cousin metrics. Different system.",
      },
    ],
    relatedSlugs: [
      "what-is-email-verification",
      "why-are-my-cold-emails-going-to-spam",
      "how-to-find-work-emails-from-linkedin",
    ],
  },
  {
    slug: "should-i-use-a-separate-domain-for-cold-email",
    question: "Should I use a separate domain for cold email?",
    description:
      "Usually yes if you also send customer mail from the root domain. A complaint spike on founder@company.com can hurt the mail your customers need.",
    keywords: [
      "separate domain for cold email",
      "secondary domain outbound",
      "cold email domain vs primary",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Primary domain: invoices, product, password resets. Cold domain: a lookalike you control (getcompany.com, trycompany.com) with matching branding in the signature so you are not hiding.",
      "You still authenticate it, warm it, and tell the truth in the From name. A random domain that does not match the website is a phishing look. Buy something a human can map to you.",
      "Redirect the sibling to the main site. Put the real company in the signature. If someone asks, you are sending from a mail domain so product email stays clean. That is an honest sentence.",
      "Do not use 40 random domains as a rotating laundromat. Providers and buyers have seen that. A couple of well-warmed domains beat a farm.",
      "If you send 20 highly targeted emails a week from the founder address and you accept the risk, some people still do that. It is a choice. It is not free of consequences.",
    ],
    faqItems: [
      {
        question: "Will a sibling domain hurt deliverability?",
        answer:
          "Unknown siblings start at zero reputation. Warm them. They protect the root. That is the trade.",
      },
      {
        question: "Should the From name still be me?",
        answer:
          "Yes. People reply to people. The domain is plumbing.",
      },
      {
        question: "Is a Google Workspace alias enough?",
        answer:
          "An alias on the same domain still uses the same reputation. That does not isolate customer mail.",
      },
      {
        question: "Does this help with GDPR?",
        answer:
          "No. Domain choice is deliverability. Lawful basis is a different job.",
      },
    ],
    relatedSlugs: [
      "how-long-to-warm-up-a-cold-email-domain",
      "how-many-inboxes-for-cold-email",
      "do-i-need-spf-dkim-dmarc-for-cold-email",
    ],
  },
  {
    slug: "how-many-inboxes-for-cold-email",
    question: "How many inboxes do I need for cold email?",
    description:
      "Start with one well-warmed inbox. Add more when you hit a safe per-inbox cap, not to hide a spam problem. Each inbox is a reputation to babysit.",
    keywords: [
      "how many inboxes for cold email",
      "multiple inboxes outbound",
      "inbox rotation cold email",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Volume scales with inboxes, not with a slider on one mailbox. If one inbox can send a few dozen cold mails a day once warm, two inboxes are how you get more, not 400 from the first.",
      "Each inbox needs authentication, a real person identity, and monitoring. Ten inboxes you ignore will fail in a cluster.",
      "Rotation that sends the same pitch from Alex, then Alex's twin, then a third name at the same company, looks like a farm to buyers. Use real people.",
      "Do not add inboxes to dodge a complaint problem. Fix the list. New inboxes on a poisoned campaign just spread the poison.",
      "LinkedIn does not replace inboxes. If you cannot operate email infrastructure, stay on LinkedIn or hire someone who can. Omentir will not be your mailer.",
    ],
    faqItems: [
      {
        question: "Can two people share one inbox?",
        answer:
          "They can. Replies get messy. Prefer one human per From address.",
      },
      {
        question: "Is a catch-all inbox a good idea?",
        answer:
          "For receiving, sometimes. For sending cold, you still want a clean From. Catch-all as a send identity is a mess.",
      },
      {
        question: "How fast can I add the second inbox?",
        answer:
          "After the first is stable: placement, bounce, complaints. Then warm the second. Parallel brand-new inboxes on day one is a cluster of risk.",
      },
      {
        question: "Do I need a separate domain per inbox?",
        answer:
          "Not always. Multiple mailboxes on one warmed sending domain is common. Watch total domain volume, not only per inbox.",
      },
    ],
    relatedSlugs: [
      "how-many-cold-emails-can-i-send-per-day",
      "should-i-use-a-separate-domain-for-cold-email",
      "what-is-a-spam-complaint-rate",
    ],
  },
  {
    slug: "is-cold-email-still-working",
    question: "Is cold email still working in 2026?",
    description:
      "Yes, at lower reply rates, with better data and shorter copy. The blast version is sicker than it was. Tight lists still book meetings.",
    keywords: [
      "is cold email dead",
      "does cold email still work 2026",
      "cold email still effective",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "People ask this every year because their last campaign died in spam. That is often infrastructure or a purchased list, not the death of email. Humans still read mail.",
      "Average reply rates are lower than the golden-age blog posts. Filters are tighter. Privacy protection made opens fake. The teams that still win send fewer, better, authenticated messages to verified addresses.",
      "If your motion is 50,000 emails a week of \"hope this finds you well,\" 2026 is a bad year. If your motion is 40 people who hired the role you sell into, email still works, and LinkedIn still works beside it.",
      "\"Dead\" is usually a seller who will not change targeting. The channel is crowded, not closed.",
      "Use both if you can operate both. Use LinkedIn if you cannot run domains. Lying to yourself that email is dead because warmup is annoying is still a choice.",
    ],
    faqItems: [
      {
        question: "Did Google kill it?",
        answer:
          "Google and Microsoft raised the bar. Authenticated, low-complaint mail still arrives. Unauthenticated blasts do not.",
      },
      {
        question: "Is LinkedIn the replacement?",
        answer:
          "It is a complement with a cap. It cannot cover a whole TAM at email's volume.",
      },
      {
        question: "Will AI writing save cold email?",
        answer:
          "Not if every vendor sounds the same. AI without a trigger is more sameness.",
      },
      {
        question: "Should I pause email and only call?",
        answer:
          "Only if you have numbers and a team that can dial. Most small teams still need an async channel.",
      },
    ],
    relatedSlugs: [
      "what-is-a-good-cold-email-reply-rate",
      "linkedin-vs-cold-email-for-b2b-outreach",
      "why-are-my-cold-emails-going-to-spam",
    ],
  },
  {
    slug: "how-to-write-a-cold-email-first-line",
    question: "How do I write a cold email first line?",
    description:
      "Open with a fact about them they would recognize, not a compliment about \"your impressive work.\" The first line decides if the rest gets read.",
    keywords: [
      "cold email first line",
      "cold email opening line",
      "how to start a cold email",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "The first line should only fit that person or that tiny segment. A hire, a post, a product page change, a tool in their stack. \"I came across your website\" fits everyone. Delete it.",
      "Compliments are suspicious in cold mail. If you did not read the thing, they can tell. If you did, quote a concrete detail, not \"loved your insights.\"",
      "After the first line, one sentence of relevance and a question. That is the whole email for a lot of good campaigns.",
      "Merge tags are not a first line. {{company}} is a hole you fill. The thought still has to be true.",
      "If you have no fact, wait or use a role-based problem you can defend (\"teams hiring three AEs often stall on ramp\"). Role-based is weaker than a trigger and stronger than a fake compliment.",
    ],
    faqItems: [
      {
        question: "Should the first line repeat the subject?",
        answer:
          "Not verbatim. The subject got the open. The first line should advance.",
      },
      {
        question: "Is a question a good first line?",
        answer:
          "Yes if they can answer it without a meeting. \"Got a minute?\" is not a question. It is a trap.",
      },
      {
        question: "Can I mention I saw them on LinkedIn?",
        answer:
          "Only if you did something specific there. \"Saw you on LinkedIn\" is empty. \"Saw the hiring post for two AEs\" is a first line.",
      },
      {
        question: "How long is too long?",
        answer:
          "If the first line wraps twice on a phone, it is two sentences. Split it.",
      },
    ],
    relatedSlugs: [
      "what-is-a-good-cold-email-subject-line",
      "should-i-personalize-every-cold-email",
      "how-to-personalize-linkedin-outreach",
    ],
  },
];
