import type { HelpPageDraft } from "./types";

const DATE = "August 19, 2026";

export const HELP_PAGES_L: HelpPageDraft[] = [
  {
    slug: "should-i-personalize-every-cold-email",
    question: "Should I personalize every cold email?",
    description:
      "Personalize the first line when you have a real fact. Do not fake uniqueness with a model and a merge tag. Segment-level copy is honest at scale.",
    keywords: [
      "personalize every cold email",
      "cold email personalization at scale",
      "is personalization worth it email",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A true first line is worth the minutes on accounts that can pay. A fake first line is worse than a clean role-based email, because it gets caught.",
      "Batch by trigger. Fifty companies that hired SDRs this month can share a body. That is personalization of the segment, which is what actually scales.",
      "First name plus company is not personalization. It is mail merge. Everyone has it. Spend the effort on the observation.",
      "If your ACV is low, you cannot research everyone. Tight ICP plus a true role problem beats 10,000 \"unique\" paragraphs.",
      "The same rule as LinkedIn: if you cannot say why this person today, do not send today.",
    ],
    faqItems: [
      {
        question: "Does AI make 100% personalization possible?",
        answer:
          "It makes 100% unique-looking text possible. Unique-looking and true are different. Spot-check.",
      },
      {
        question: "Should the whole email be unique?",
        answer:
          "No. Unique first line, stable body, clear ask. Unique everything is how facts drift.",
      },
      {
        question: "What if I have no trigger?",
        answer:
          "Role-based or skip. Do not invent a post they did not write.",
      },
      {
        question: "Is personalization required under GDPR?",
        answer:
          "GDPR cares about lawful basis and minimization, not whether you flattered them. Relevance can support legitimate interest. Fake relevance does not.",
      },
    ],
    relatedSlugs: [
      "how-to-write-a-cold-email-first-line",
      "how-to-personalize-linkedin-outreach",
      "what-buying-signals-to-use-before-linkedin-outreach",
    ],
  },
  {
    slug: "what-is-email-verification",
    question: "What is email verification and why does it matter?",
    description:
      "Verification checks whether an address can receive mail before you send. It cuts bounces, which protects the domain. It does not make the person want your product.",
    keywords: [
      "what is email verification",
      "email verification outbound",
      "verify emails before cold email",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A verifier asks the receiving server, in a careful way, whether the mailbox exists. Results come back valid, invalid, catch-all, or unknown. Invalid should never be sent. Catch-all is a gamble.",
      "Sending to dead addresses creates hard bounces. Bounce spikes tell Gmail and Microsoft you are a sloppy sender. Verification is cheaper than a burned domain.",
      "Verification is not consent. A valid mailbox can still complain. It is not enrichment of job title. It is plumbing.",
      "Re-verify old lists. People leave jobs. Last year's valid file is this year's bounce farm.",
      "If the verifier marks everything valid and you still bounce, the verifier is the problem. Stop using it.",
    ],
    faqItems: [
      {
        question: "Does verification email the person?",
        answer:
          "Good verifiers try not to. Some noisy methods can still produce a ping. Pick vendors that care about that.",
      },
      {
        question: "Should I send to catch-alls?",
        answer:
          "In small tests, maybe. As a default, no. They hide invalids.",
      },
      {
        question: "Is a LinkedIn InMail a substitute for verification?",
        answer:
          "InMail does not use their email. Different path. If you later email them, verify that address too.",
      },
      {
        question: "How fresh should verification be?",
        answer:
          "Days to a few weeks, not a year. Verify close to send time.",
      },
    ],
    relatedSlugs: [
      "what-is-a-good-cold-email-bounce-rate",
      "how-to-find-work-emails-from-linkedin",
      "why-are-my-cold-emails-going-to-spam",
    ],
  },
  {
    slug: "can-i-cold-email-gmail-addresses",
    question: "Can I cold email Gmail addresses?",
    description:
      "You can. Personal Gmail is harsher on unknown senders and easier for people to spam-button. Prefer work email for B2B when you have it.",
    keywords: [
      "cold email Gmail addresses",
      "should I email personal Gmail B2B",
      "Gmail cold outreach",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Gmail personal inboxes are where people live. They also have a big red Report spam button and no procurement context. B2B cold usually belongs at work.",
      "If the only address you have is Gmail, you may still send a short, relevant note. Expect more ignores and a higher complaint risk. Keep volume extra low.",
      "Never harvest personal emails off LinkedIn with a scraper to fill Gmail. That stacks platform risk and mailbox risk.",
      "Google's sender rules still apply when you send to Gmail: authentication, low complaints, easy unsubscribe for commercial mail. They apply even harder in practice because that is Google's own inbox.",
      "If they reply from Gmail and want to keep talking there, fine. Start on work mail when you can.",
    ],
    faqItems: [
      {
        question: "What about Google Workspace at a company.com?",
        answer:
          "That is work mail on Google's stack. Different from @gmail.com. Treat it as a company address.",
      },
      {
        question: "Is Outlook.com the same story?",
        answer:
          "Consumer Outlook is similar: personal inbox, easy junk button. Prefer work domains.",
      },
      {
        question: "Can I ask for their work email in a LinkedIn DM?",
        answer:
          "Yes, after they show interest. \"What's best for a calendar invite?\" is enough.",
      },
      {
        question: "Does CAN-SPAM change for Gmail?",
        answer:
          "The statute does not care which host. The recipient still gets an opt-out. Google extra cares about complaints.",
      },
    ],
    relatedSlugs: [
      "how-to-find-work-emails-from-linkedin",
      "what-is-a-spam-complaint-rate",
      "is-cold-outreach-legal-gdpr-can-spam",
    ],
  },
  {
    slug: "how-to-handle-cold-email-unsubscribes",
    question: "How do I handle cold email unsubscribes?",
    description:
      "Remove them fast, from every list, and do not email them again. CAN-SPAM expects a working opt-out. Arguing in a reply is how complaints happen.",
    keywords: [
      "cold email unsubscribe",
      "honor unsubscribe CAN-SPAM",
      "opt out cold email",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Every commercial cold email should have a way to stop: a link or a clear reply instruction. When they use it, suppress them in the sequencer the same day, not after the weekend campaign finishes.",
      "Suppression has to follow the person across campaigns and inboxes. A new sequence that \"rediscovered\" them is the classic failure.",
      "Do not require a login, a survey, or a phone call to unsubscribe. That is how you earn spam clicks instead.",
      "A LinkedIn \"please stop\" is the same job. Pause email too. Channels share a human.",
      "Keep a log. If someone claims they opted out and you kept sending, you want to be able to show the date. This is boring and it is the job.",
    ],
    faqItems: [
      {
        question: "Can I send one confirmation email?",
        answer:
          "A single \"you're unsubscribed\" is common. A five-email \"are you sure\" is not.",
      },
      {
        question: "What if they unsubscribe from one product but might want another?",
        answer:
          "When in doubt, stop. You can ask legal how to segment. Do not freelance a new pitch.",
      },
      {
        question: "Do I remove them from LinkedIn as well?",
        answer:
          "Stop messaging. You do not have to disconnect unless they ask. Do not keep a cadence running.",
      },
      {
        question: "Is a physical address required in the email?",
        answer:
          "CAN-SPAM wants a valid physical postal address in commercial email. Include it. A PO box you actually get mail at is a common pattern. Ask counsel for your case.",
      },
    ],
    relatedSlugs: [
      "is-cold-outreach-legal-gdpr-can-spam",
      "is-casl-stricter-than-can-spam",
      "what-is-a-spam-complaint-rate",
    ],
  },
  {
    slug: "what-is-a-spam-complaint-rate",
    question: "What is a spam complaint rate for cold email?",
    description:
      "Complaints are people hitting Report spam. Keep them extremely low, well under half a percent, ideally under 0.1 percent. A spike can park the domain.",
    keywords: [
      "spam complaint rate cold email",
      "acceptable spam rate Gmail",
      "email spam complaints outbound",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Mailbox providers publish complaint thresholds. Google's sender guidelines have talked about staying under 0.3 percent and aiming lower. Cold programs should treat 0.1 percent as a \"stop and look\" line. You will not like what happens above that.",
      "Complaints come from surprise, volume, no unsubscribe, and mail they think is phishing. A sibling domain that looks random will get more of the last one.",
      "Unsubscribes are better than spam clicks. Make opt-out obvious so they do not use the red button.",
      "If complaints spike, pause. Do not \"finish the campaign.\" Fix list, copy, and From identity before you send again.",
      "LinkedIn spam marks are a cousin. Different system, same lesson: when people tell the platform you are junk, the platform listens.",
    ],
    faqItems: [
      {
        question: "How do I even see complaint rate?",
        answer:
          "Google Postmaster Tools, Microsoft SNDS, and your ESP. If you cannot see it, you are flying blind.",
      },
      {
        question: "Does a forwarded email count?",
        answer:
          "The original recipient's complaint counts. Forwards are messy. Do not depend on that trivia.",
      },
      {
        question: "Can I email them to ask why they complained?",
        answer:
          "No. They already voted. Stay suppressed.",
      },
      {
        question: "Is 0 percent realistic?",
        answer:
          "On tiny, warm lists, yes. At scale you will get some. The goal is near-zero, not a story about how complaints mean engagement.",
      },
    ],
    relatedSlugs: [
      "why-are-my-cold-emails-going-to-spam",
      "how-to-handle-cold-email-unsubscribes",
      "how-many-cold-emails-can-i-send-per-day",
    ],
  },
  {
    slug: "should-cold-emails-include-images",
    question: "Should cold emails include images?",
    description:
      "Skip images on first touch. They trip filters, look like marketing, and often get blocked. Plain text with one link is enough.",
    keywords: [
      "cold email images",
      "should cold emails have logos",
      "plain text vs HTML cold email",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Image-heavy HTML is how 2014 newsletters looked. Filters still treat big pictures, tracking pixels, and three buttons as promo. A cold first touch should look like a person wrote it in a normal client.",
      "A small text signature is fine. A hero banner is not. Animated GIFs are not.",
      "If you need a screenshot, send it after they ask, or host it behind a normal URL. Do not embed a tracking pixel farm.",
      "HTML can still be simple: one font, one link, no layout tables from 2008. Many good cold programs send near-plain text.",
      "Follow-ups can stay text too. You are not a magazine.",
    ],
    faqItems: [
      {
        question: "What about a tiny headshot in the signature?",
        answer:
          "Optional. If the client blocks images, the mail should still make sense. Put the meaning in text.",
      },
      {
        question: "Do open-tracking pixels count as images?",
        answer:
          "Yes, technically. They also inflate fake opens. Some teams turn them off and watch replies instead.",
      },
      {
        question: "Can I send a PDF?",
        answer:
          "Not in email one. Attachments from strangers look like malware. Link after they ask.",
      },
      {
        question: "Is a logo in the header OK?",
        answer:
          "It makes you look like a campaign. First touch can skip the brand kit.",
      },
    ],
    relatedSlugs: [
      "how-long-should-a-cold-email-be",
      "why-are-my-cold-emails-going-to-spam",
      "how-to-handle-send-me-more-information",
    ],
  },
  {
    slug: "how-to-write-a-cold-email-breakup",
    question: "How do I write a cold email breakup?",
    description:
      "One short, calm last note that you will stop. No guilt. No fake expiration. Then stop, including LinkedIn if they were on both.",
    keywords: [
      "cold email breakup",
      "last follow up email",
      "breakup email template outbound",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "After a few value-adding follow-ups, send a close: you will not keep emailing, they can reply if timing changes. That message often gets the only honest reply of the thread.",
      "Skip \"I guess you hate growing the business.\" Skip \"this thread will explode.\" Adults do not need theater.",
      "Do not attach a six-page case study to the breakup. You are leaving, not pitching harder.",
      "Honor it. If the sequencer sends two more \"quick nudges,\" you lied. Pause all steps.",
      "If they were also on a LinkedIn cadence, pause that too. A breakup is per human, not per channel. See the [LinkedIn breakup](/help/how-to-write-a-linkedin-breakup-message) for the same tone.",
    ],
    faqItems: [
      {
        question: "Should the subject change?",
        answer:
          "A new short subject can help it get seen (\"Closing the loop\"). Fake Re: threads are still a bad idea.",
      },
      {
        question: "How many emails before the breakup?",
        answer:
          "Often the fourth total send. See [how many follow-ups](/help/how-many-cold-email-follow-ups-should-i-send).",
      },
      {
        question: "Can I ask for a referral in the breakup?",
        answer:
          "You can add one line. Do not make the whole letter a referral ask. They have not even talked to you.",
      },
      {
        question: "What if they reply a month later?",
        answer:
          "Answer like a person. Do not restart the old five-step as if nothing happened.",
      },
    ],
    relatedSlugs: [
      "how-to-write-a-linkedin-breakup-message",
      "how-many-cold-email-follow-ups-should-i-send",
      "how-to-follow-up-on-linkedin-without-being-spammy",
    ],
  },
  {
    slug: "what-is-a-good-cold-email-open-rate",
    question: "What is a good cold email open rate?",
    description:
      "People still quote 40 to 60 percent as healthy. Treat opens as a spam alarm, not a success metric. Privacy features inflate the number.",
    keywords: [
      "good cold email open rate",
      "cold email open rate 2026",
      "what open rate means outbound",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Open rate used to mean they saw the subject and loaded images. Apple Mail Privacy Protection and similar features prefetch pixels, so opens can look great while humans ignore you.",
      "If opens collapse under ~30 percent on a warmed domain, check spam folders with seeds. That is still a useful alarm. If opens are 80 percent and replies are 0, believe replies.",
      "Do not A/B test subjects on opens alone in 2026. Use replies, or you will pick the subject that robots prefetch.",
      "A high open rate on a tiny internal test is not a benchmark. Compare campaigns with similar list quality.",
      "LinkedIn does not give a clean open on DMs. Do not mix the two charts. See [reply rate](/help/what-is-a-good-cold-email-reply-rate).",
    ],
    faqItems: [
      {
        question: "Should I turn off open tracking?",
        answer:
          "Many teams do, to look less like a campaign and to stop worshipping a fake number. Watch replies and meetings.",
      },
      {
        question: "Does a preview pane count as an open?",
        answer:
          "Sometimes, depending on the client and the pixel. Another reason not to trust the metric.",
      },
      {
        question: "Can I still use opens to time a follow-up?",
        answer:
          "Risky. You may follow up on a privacy bot. Time follow-ups on a calendar, not on a pixel.",
      },
      {
        question: "What if opens are high in Gmail and low in Outlook?",
        answer:
          "Placement and prefetch differ by host. Check seeds in both. Do not rewrite copy for a pixel gap until placement is confirmed.",
      },
    ],
    relatedSlugs: [
      "what-is-a-good-cold-email-reply-rate",
      "what-is-a-good-cold-email-subject-line",
      "why-are-my-cold-emails-going-to-spam",
    ],
  },
  {
    slug: "is-casl-stricter-than-can-spam",
    question: "Is CASL stricter than CAN-SPAM?",
    description:
      "Yes in spirit. Canada's anti-spam law leans toward consent for commercial electronic messages. CAN-SPAM is more about opt-out and honest headers. If you email Canada, do not copy a US-only playbook.",
    keywords: [
      "CASL vs CAN-SPAM",
      "Canada cold email law",
      "does CASL apply to LinkedIn",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "CAN-SPAM (US) lets you send commercial email with truthful headers, a physical address, and a working unsubscribe. CASL (Canada) is built more around consent, with real penalties. Implied consent exists in limited cases. Do not guess from a US blog.",
      "This page is a map, not a legal opinion. If Canada is in the list, talk to counsel and suppress people who should not be there until you have a story.",
      "LinkedIn DMs are a platform message, not a classic email address. CASL's \"commercial electronic message\" language is broader than CAN-SPAM. Do not assume DMs are automatically out of scope. Get advice for your facts.",
      "Honor stop requests everywhere. That is the overlap of every regime and every platform.",
      "Omentir cannot make you CASL-safe. Pacing a send is not consent. See [GDPR and CAN-SPAM](/help/is-cold-outreach-legal-gdpr-can-spam).",
    ],
    faqItems: [
      {
        question: "Can I email Canadian companies under legitimate interest?",
        answer:
          "That is a GDPR-style idea. CASL is its own statute. Do not import EU logic into Canada without counsel.",
      },
      {
        question: "Does a LinkedIn accept count as consent to email?",
        answer:
          "Do not treat an accept as email consent. Ask for email, or use a basis counsel signed off on.",
      },
      {
        question: "Are B2B messages exempt?",
        answer:
          "CASL has B2B-related pieces. They are not a blanket \"B2B is fine.\" Read the current guidance or hire someone who has.",
      },
      {
        question: "What if I only have one Canadian lead?",
        answer:
          "One lead still counts. Volume is not the legal test.",
      },
    ],
    relatedSlugs: [
      "is-cold-outreach-legal-gdpr-can-spam",
      "how-to-handle-cold-email-unsubscribes",
      "is-linkedin-automation-allowed",
    ],
  },
  {
    slug: "how-to-prevent-linkedin-from-looking-like-a-bot",
    question: "How do I prevent my LinkedIn from looking like a sales bot?",
    description:
      "Send like a person: gaps, a real photo, different first lines, no same-minute pitch after accept. Daily caps and a complete profile do more than a \"humanizer\" slider.",
    keywords: [
      "LinkedIn looks like a bot",
      "avoid LinkedIn automation detection",
      "human paced LinkedIn outreach",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Bot tells: 40 identical notes at 9:01, a logo avatar, a pitch in the invite, a DM 20 seconds after accept, likes on 80 posts in ten minutes, a scraper extension. Humans have idle time and uneven days.",
      "Write first lines that would be wrong on the next person. Use a face photo. Wait a day after accept. Keep pending low. Comment only when you have a point.",
      "Software with visible daily limits, send windows, and a log you can read is less dangerous than a black box that promises \"safe 200 a day.\" Nothing unofficial is blessed. Caps only reduce the obvious fingerprints.",
      "If you would be embarrassed to show the send log to the recipient, do not send it.",
      "Omentir enforces invite and message limits on purpose. You still choose the copy. A human pace with a robotic paragraph is still a robot.",
    ],
    faqItems: [
      {
        question: "Do random delays fool LinkedIn?",
        answer:
          "Random delays are better than a metronome. They do not hide a 200-invite Monday from a quiet account. Volume and quality still matter.",
      },
      {
        question: "Should I type with mistakes on purpose?",
        answer:
          "A fake typo campaign is a meme. Write clearly. Uneven timing beats performative misspelling.",
      },
      {
        question: "Does posting every day hide outbound?",
        answer:
          "Posting helps the profile look real. It does not hide a blast. Do both at a human pace, or skip the posts.",
      },
      {
        question: "What is the first thing to change?",
        answer:
          "The photo and the same-hour pitch. Then the identical note. Then the daily cap.",
      },
    ],
    relatedSlugs: [
      "is-linkedin-automation-allowed",
      "should-i-use-a-logo-as-linkedin-photo",
      "when-to-send-first-linkedin-message-after-accept",
    ],
  },
];
