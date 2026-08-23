import type { HelpPageDraft } from "./types";

const DATE = "August 19, 2026";

export const HELP_PAGES_E: HelpPageDraft[] = [
  {
    slug: "what-is-a-good-cold-email-reply-rate",
    question: "What is a good cold email reply rate?",
    description:
      "A few percent overall is normal at scale. 5 to 10 percent is a healthy target on a tight list. Open rate is a weaker number than it used to be.",
    keywords: [
      "good cold email reply rate",
      "average cold email response rate",
      "cold email benchmarks",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Reply rate is replies divided by emails delivered, not sent, and not opened. Bounces are a list problem. Opens are partly fake now because of mail privacy features. Replies are still real people.",
      "Across a lot of 2026 vendor data, overall reply rates often sit around 3 to 8 percent. 5 to 10 percent is a fair \"we know who we are writing to\" target. 10 percent and up usually means a small, sharp segment, not a 20,000-row blast. Positive replies (interested, referral, meeting) will be a slice of that, often 1 to 3 percent of delivered.",
      "If you are at 0 percent after a couple hundred delivered emails, you have a deliverability problem or a list problem. Rewrite later. Check spam placement, bounce rate, and whether the domain is new first.",
      "Compare campaigns inside your own account more than against a blog. A hardware ICP will not match a SaaS founder ICP. The useful question is whether this week's segment beat last week's.",
      "Omentir is not a cold email warmup product. If email is your main channel, you still need domains, authentication, and a sequencer that respects per-inbox caps. Use LinkedIn when identity matters more than volume.",
    ],
    faqItems: [
      {
        question: "What is a good open rate in 2026?",
        answer:
          "People still quote 40 to 60 percent as healthy, and under 30 percent as \"check spam.\" Apple Mail Privacy Protection inflates opens. Use opens as a directional alarm, not as a vanity chart.",
      },
      {
        question: "Should I count out-of-office replies?",
        answer:
          "Track them separately. They prove delivery. They do not prove interest. Some teams auto-pause until the person is back.",
      },
      {
        question: "Is a high unsubscribe rate bad?",
        answer:
          "Unsubscribes are cleaner than spam complaints. A lot of them still means the list or the pitch is off. Honor them fast.",
      },
      {
        question: "How soon will I see replies?",
        answer:
          "If the domain is warmed, you can see replies in the first week of sending. A brand new domain needs warmup first, often two to four weeks, before you judge copy.",
      },
    ],
    relatedSlugs: [
      "why-are-my-cold-emails-going-to-spam",
      "how-many-cold-email-follow-ups-should-i-send",
      "linkedin-vs-cold-email-for-b2b-outreach",
    ],
  },
  {
    slug: "how-many-cold-emails-can-i-send-per-day",
    question: "How many cold emails can I send per day?",
    description:
      "Think tens per inbox, not thousands. New domains start lower. Scale by adding inboxes, not by slamming one mailbox.",
    keywords: [
      "how many cold emails per day",
      "cold email sending limit per inbox",
      "cold email volume per domain",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "There is no universal legal cap that says \"37 emails.\" There are mailbox provider reputations. Google and Microsoft punish sudden volume, high bounces, and spam complaints. Practitioners who still have inboxes usually sit in a band like 30 to 50 new cold emails per inbox per day once the domain is warmed, and much lower at the start.",
      "A domain you registered last week should not send like a five-year-old corporate mail server. Warm up for a couple of weeks with small, real-looking volume. Then raise slowly. A 0 to 200 jump on Monday is how you buy a spam folder.",
      "Need more volume? Add inboxes and domains that you actually control, with SPF, DKIM, and DMARC set. Do not send 400 a day from founder@gmail.com. That mailbox is your identity, not a cannon.",
      "Watch bounce rate (keep it low, under about 2 percent) and spam complaint rate (providers talk about staying under 0.1 to 0.3 percent). Those two numbers will take the inbox away faster than a slightly long subject line.",
      "If you cannot operate that infrastructure, do not fake it with LinkedIn automation either. Pick a volume you can stand behind. LinkedIn will not absorb an email problem. It has its own caps.",
    ],
    faqItems: [
      {
        question: "Is 100 emails a day from one inbox safe?",
        answer:
          "For most cold programs, that is aggressive. Some aged inboxes tolerate it. New ones will not. Split across inboxes before you find out the hard way.",
      },
      {
        question: "Do follow-ups count toward the daily cap?",
        answer:
          "They still leave the inbox. Count all cold sends, not only first-touch. A 40-first-touch plus 40-follow-up day is 80 sends.",
      },
      {
        question: "Can I send from my primary domain?",
        answer:
          "You can, and a complaint can hurt the domain that also carries customer mail. Many teams use a sibling domain for cold. Set it up properly or do not bother.",
      },
      {
        question: "Does LinkedIn volume replace email volume?",
        answer:
          "No. They are separate reputations. Hitting both hard from the same burst of leads is still a burst of leads.",
      },
    ],
    relatedSlugs: [
      "why-are-my-cold-emails-going-to-spam",
      "how-many-linkedin-connection-requests-per-day",
      "what-is-a-good-cold-email-reply-rate",
    ],
  },
  {
    slug: "how-many-cold-email-follow-ups-should-i-send",
    question: "How many follow-up emails should I send after a cold email?",
    description:
      "Plan on two to four follow-ups, a few days apart, each with a new point. Most meetings come from the first few emails. Long sequences collect complaints.",
    keywords: [
      "how many cold email follow-ups",
      "cold email sequence length",
      "cold email follow-up cadence",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A lot of cold email meetings come from email one plus the first follow-up. Extra steps still add some replies, with diminishing returns. A four-email total sequence (one first touch, three follows) is a common working shape. Seven-plus starts to feel like a collection agency and raises unsubscribe and spam-complaint risk.",
      "Space them three to seven days apart. Daily follow-ups on a stranger are rude and look automated. A simple cadence: day 0, day 3, day 7, day 14, then stop.",
      "Each follow-up needs a new payload: a different angle, a tighter question, a relevant proof point, or a polite breakup. \"Just checking in\" is not a payload. About 40 percent of replies in many datasets arrive on follow-ups, so skipping them leaves money on the table. Copy-pasting email one four times leaves reputation on the table.",
      "Stop on reply, bounce, unsubscribe, or a hard no. If your tool cannot pause a thread, you do not have a sequence. You have a timer.",
      "If LinkedIn is also in the mix, do not stack a follow-up email on the same morning as a follow-up DM. See [how to combine LinkedIn and cold email](/help/how-to-combine-linkedin-and-cold-email).",
    ],
    faqItems: [
      {
        question: "Should the last email be a breakup?",
        answer:
          "Yes, if it is calm. \"I'll close your file\" gets honest replies. Sarcasm does not.",
      },
      {
        question: "Do I follow up after an out-of-office?",
        answer:
          "Wait until they are back, then send one note. Do not keep the original cadence running into their vacation.",
      },
      {
        question: "Is one email enough?",
        answer:
          "Sometimes, on a tiny, hot list. At scale you will leave roughly half the conversations unearned. Send follow-ups. Keep them short.",
      },
      {
        question: "Should follow-ups be shorter than the first email?",
        answer:
          "Usually yes. They already have the first one. Add one new line, not a reboot.",
      },
    ],
    relatedSlugs: [
      "how-long-should-a-cold-email-be",
      "what-is-a-good-cold-email-reply-rate",
      "how-many-linkedin-follow-up-messages-should-i-send",
    ],
  },
  {
    slug: "why-are-my-cold-emails-going-to-spam",
    question: "Why are my cold emails going to spam?",
    description:
      "Usually authentication, a new domain, too much volume, dirty data, or content that looks like a blast. Fix infrastructure before you rewrite the joke in the subject line.",
    keywords: [
      "cold emails going to spam",
      "cold email deliverability",
      "why cold email lands in spam",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "If nobody is opening and nobody is replying, assume spam or a dead list before you assume the opener is boring. Open rates that fall off a cliff after a volume increase are a reputation story.",
      "Checklist that actually moves placement: SPF, DKIM, and DMARC on the sending domain. A warmup period. Verified addresses so bounce rate stays low. A per-inbox cap. A physical address and a working unsubscribe on commercial mail, which US CAN-SPAM expects.",
      "Content still matters, but it is second. Image-only mail, URL shorteners, giant tracking pixels, \"ACT NOW,\" and five CTAs look like 2014. Plain text, one link, one ask, from a person, does better.",
      "Purchased lists are how domains die. Even \"verified\" dumps include traps and old addresses. Build or rent lists you can explain. GDPR still applies to the people on them if they are in the EU.",
      "Do not launder a burned domain by swapping tools. The domain is the patient. Rest it, fix DNS, lower volume, and only then test copy. A new sequencer on a poisoned domain is a new coat of paint.",
    ],
    faqItems: [
      {
        question: "How do I know I am in spam versus ignored?",
        answer:
          "Seed inboxes at Gmail and Outlook. If seeds land in spam, it is placement. If seeds land in inbox and strangers still ignore you, it is copy or list.",
      },
      {
        question: "Does a custom tracking domain help?",
        answer:
          "It can, if it is aligned and not a random tiny site. A shady redirect will not help.",
      },
      {
        question: "Should I use my Google Workspace for cold?",
        answer:
          "You can ruin the workspace that also holds customer mail. Many teams keep cold on a separate domain for that reason.",
      },
      {
        question: "Is this LinkedIn's fault?",
        answer:
          "No. LinkedIn DMs do not fix an email domain. Different channel, different reputation.",
      },
    ],
    relatedSlugs: [
      "how-many-cold-emails-can-i-send-per-day",
      "is-cold-outreach-legal-gdpr-can-spam",
      "what-is-a-good-cold-email-reply-rate",
    ],
  },
  {
    slug: "how-long-should-a-cold-email-be",
    question: "How long should a cold email be?",
    description:
      "Keep it around 50 to 80 words, one idea, one ask. If they have to scroll on a phone to find the question, it is too long.",
    keywords: [
      "how long should a cold email be",
      "cold email word count",
      "short cold email",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Short wins on first touch because the job is a reply, not an education. 50 to 80 words is a working range. Over 120 words you are asking for a reading session they did not schedule.",
      "Structure: why them (one line), why you are relevant (one line), a question that is easy to answer. Optional: one proof point. Not optional: a way to say no.",
      "Subject lines should match the body. Mystery and clickbait get opens from robots and distrust from humans. A specific, boring subject is a feature.",
      "Follow-ups can be shorter than the first email. The first email already did the introduction. Do not recap your life story in email three.",
      "If the product needs a diagram, link it after they ask. A cold email is a knock, not a kickoff meeting.",
    ],
    faqItems: [
      {
        question: "Do paragraphs or bullets work better?",
        answer:
          "One short paragraph, maybe two. A stack of bullets from a stranger looks like a brochure.",
      },
      {
        question: "Should I include images?",
        answer:
          "Skip them on first touch. They hurt some spam filters and look like marketing. Text is enough.",
      },
      {
        question: "Is a one-sentence email too short?",
        answer:
          "It can work if the sentence is specific. \"Saw you hired three AEs, how are you ramping outbound?\" is a complete email. \"Quick question\" is not.",
      },
      {
        question: "Can LinkedIn DMs be longer than emails?",
        answer:
          "They should not be, on first touch. Same brain, smaller screen. See [how long should a LinkedIn cold message be](/help/how-long-should-a-linkedin-cold-message-be).",
      },
    ],
    relatedSlugs: [
      "how-many-cold-email-follow-ups-should-i-send",
      "how-to-personalize-linkedin-outreach",
      "how-long-should-a-linkedin-cold-message-be",
    ],
  },
  {
    slug: "is-linkedin-automation-allowed",
    question: "Is LinkedIn automation allowed?",
    description:
      "LinkedIn's user agreement restricts bots, scraping, and automated use of the consumer product. Tools still exist. You own the account if it gets restricted.",
    keywords: [
      "is LinkedIn automation allowed",
      "LinkedIn automation against terms of service",
      "can I automate LinkedIn outreach",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "LinkedIn documents official APIs for ads, some company-page work, and partner programs. It does not sell you a public switch that blasts connection requests from your personal profile. The user agreement restricts unauthorized bots, scraping, and automated use of the consumer product.",
      "The market is full of tools that do it anyway, through the browser or through a cloud session. Enforcement is uneven, which is why the tools stay in business. A restriction, a checkpoint, or a permanent lock does not come with an appeals team that cares about your pipeline. If the profile is your name, the cost is personal.",
      "Safer-looking habits: visible daily caps, delays between actions, send windows, a ramp on new accounts, and a human reading replies. Those reduce the most obvious bot fingerprints. They do not make unofficial automation \"allowed.\" Anyone who promises your account cannot be restricted is selling you a story.",
      "Chrome extensions that click the LinkedIn DOM and scrapers that dump search results are the noisier architectures. Cloud sequencers move the session off your laptop and introduce a different fingerprint. Official partner APIs are a different legal object. Ask which one you are buying.",
      "Omentir sends from your connected account with invite and message limits you can tighten. We are not official LinkedIn. We will not tell you that automation is blessed. If you want the longer version, read [LinkedIn outreach compliance](/blogs/linkedin-outreach-compliance-2026).",
    ],
    faqItems: [
      {
        question: "Is using Sales Navigator automation different?",
        answer:
          "Navigator is a paid search product. It is not a license to bot the consumer profile. LinkedIn can still restrict InMail, invites, and search on paid seats.",
      },
      {
        question: "Are official LinkedIn APIs an option for DMs?",
        answer:
          "Not for bulk personal invites and DMs. See LinkedIn's developer docs before you budget an engineering sprint around outreach.",
      },
      {
        question: "Can I automate likes and views as warmup?",
        answer:
          "Mass fake engagement is still automation, and it is a poor look when a prospect sees a like with no person behind it. Warm up by using the product as yourself.",
      },
      {
        question: "What happens if a tool gets my account restricted?",
        answer:
          "You deal with LinkedIn. The vendor will often say they are not liable. Read that in the contract before you paste a session cookie anywhere.",
      },
    ],
    relatedSlugs: [
      "why-was-my-linkedin-account-restricted",
      "how-to-warm-up-a-linkedin-account-for-outreach",
      "is-cold-outreach-legal-gdpr-can-spam",
    ],
  },
  {
    slug: "is-cold-outreach-legal-gdpr-can-spam",
    question: "Is cold outreach legal under GDPR and CAN-SPAM?",
    description:
      "Cold B2B contact can be lawful, with different rules by channel and country. This is not legal advice. GDPR cares about how you process personal data. CAN-SPAM cares about commercial email.",
    keywords: [
      "is cold email legal",
      "GDPR LinkedIn outreach",
      "CAN-SPAM cold email",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Talk to counsel for your facts. The rest of this page is a map of what people mix up, not a permission slip.",
      "CAN-SPAM (US) is built for commercial email: truthful headers, honest subject lines, a physical postal address, and a working opt-out you honor quickly. It is generally treated as not covering a LinkedIn DM, because a LinkedIn message is not mail to an email address. If your sequence hops to email, that email step is in CAN-SPAM's world.",
      "GDPR (EU/EEA, and extra-territorial in practice) applies when you process personal data: a name, a title, an employer, a profile URL sitting in your tool. B2B cold contact often relies on legitimate interest, not prior consent, and that still needs a documented assessment, data minimization, transparency, and a real way to object. Scraping a giant EU list into a sequencer without a story is the version that goes badly.",
      "Canada's CASL is stricter than CAN-SPAM and leans toward consent for commercial electronic messages. If you sell into Canada, do not assume a US email playbook is enough.",
      "Platform rules sit on top of all of this. A campaign can be fine under CAN-SPAM and still get a LinkedIn restriction. Honor opt-outs on every channel you used. Do not buy mystery lists. Keep a record of where a contact came from. That is the unglamorous half of outbound that keeps you in business.",
    ],
    faqItems: [
      {
        question: "Do I need consent before a LinkedIn DM?",
        answer:
          "GDPR does not always require consent for relevant B2B contact if legitimate interest holds and they can object. LinkedIn's own rules still apply. When someone asks you to stop, stop.",
      },
      {
        question: "Is a purchased email list legal?",
        answer:
          "Sometimes, if the source is lawful and you can still meet GDPR, CAN-SPAM, or CASL. In practice, purchased lists are how bounce rates and complaints spike. Prefer lists you can explain.",
      },
      {
        question: "Does an unsubscribe link belong in a LinkedIn message?",
        answer:
          "A simple \"happy to close the loop if this is not useful\" is human. A legal footer in a DM looks like email. On email, include a real unsubscribe. On LinkedIn, honor \"please stop\" without arguing.",
      },
      {
        question: "Can Omentir make my outreach compliant?",
        answer:
          "No product can. We can pace sends and keep replies in one place. You still own targeting, data sources, and how you respond when someone objects. Read our [privacy policy](/privacy-policy) and [terms](/terms-of-service).",
      },
    ],
    relatedSlugs: [
      "is-linkedin-automation-allowed",
      "why-are-my-cold-emails-going-to-spam",
      "can-i-send-linkedin-requests-to-people-i-dont-know",
    ],
  },
];
