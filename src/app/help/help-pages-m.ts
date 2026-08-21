import type { HelpPageDraft } from "./types";

const DATE = "August 19, 2026";

export const HELP_PAGES_M: HelpPageDraft[] = [
  {
    slug: "why-are-linkedin-contact-discovery-tools-bouncing",
    question:
      "Why are my LinkedIn contact discovery tools giving me so many bounced emails and wrong numbers?",
    description:
      "Those tools are guessing from a profile, not reading a mailbox LinkedIn keeps. Stale jobs, pattern emails, catch-alls, and recycled phone data are the usual mess.",
    keywords: [
      "LinkedIn contact discovery bounced emails",
      "wrong numbers from LinkedIn enrichment",
      "LinkedIn email finder bounce",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "LinkedIn is not a contact database. A discovery or enrichment tool sees a name, a company, and sometimes a location, then it infers an email and a phone. The inference is often last year's pattern at a company the person already left.",
      "Bounced emails are the honest failure. The mailbox is gone, the local-part was invented, or the vendor marked a catch-all as valid. Wrong numbers are quieter: a switchboard, a prior employee, a data-broker mobile that was never theirs. You still look like a stranger calling the wrong desk.",
      "Waterfalls make this worse. Tool A misses, tool B fills a guess, tool C \"verifies\" a catch-all, and you send. Each hop can add a worse record. One verified source plus a small test send beats three logos on a pricing page.",
      "People change jobs faster than most databases refresh. If the profile says Acme and the email is still at the last company, that is not a LinkedIn bug. That is a stale row. Re-check title and company the same week you send.",
      "Do not scrape inboxes off LinkedIn to \"fix\" the vendor. That stacks a platform problem on a data problem. Stay on the thread if they already replied, or verify work email before the first cold send. See [how to find work emails from LinkedIn](/help/how-to-find-work-emails-from-linkedin).",
    ],
    faqItems: [
      {
        question: "Is a 10 percent bounce \"normal\" for LinkedIn-sourced lists?",
        answer:
          "No. That is a dirty list. Keep hard bounces under about 2 percent or stop the source. See [what is a good bounce rate](/help/what-is-a-good-cold-email-bounce-rate).",
      },
      {
        question: "Why is the email valid but the person is wrong?",
        answer:
          "Valid means the mailbox exists. It does not mean it belongs to the title you found. Shared aliases and recycled addresses show up as delivered.",
      },
      {
        question: "Should I call every number the tool returns?",
        answer:
          "Not until you have a reason to believe it is theirs. A wrong mobile burns the account faster than a skipped call.",
      },
      {
        question: "Does Omentir replace enrichment?",
        answer:
          "Omentir is LinkedIn-first outreach. It does not magically invent a clean phone book. If you hop to email, verify that address yourself.",
      },
    ],
    relatedSlugs: [
      "why-are-linkedin-prospecting-efforts-failing-with-30-percent-bounce",
      "why-are-linkedin-phone-numbers-from-enrichment-wrong",
      "what-is-email-verification",
    ],
  },
  {
    slug: "why-are-linkedin-prospecting-efforts-failing-with-30-percent-bounce",
    question:
      "Why are my LinkedIn prospecting efforts failing with 30% bounce rates?",
    description:
      "A 30 percent bounce is list failure, not a LinkedIn DM problem. Pause sending, throw out the file, and stop treating enrichment confidence as a send button.",
    keywords: [
      "LinkedIn prospecting 30% bounce rate",
      "why LinkedIn outbound bounce rate high",
      "30 percent email bounce from LinkedIn leads",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Thirty percent hard bounce means roughly one in three addresses never existed or no longer takes mail. Mailbox providers treat that as a dirty sender. LinkedIn did not bounce those messages. Your email hop did.",
      "Common stack: a scraped or purchased \"LinkedIn list,\" a waterfall that marks unknowns as valid, no verification close to send time, and a new domain that cannot absorb the spike. The campaign then \"fails\" in the sequencer while the LinkedIn side might still be fine.",
      "Stop the sequence the day you see it. Do not \"finish the remaining 2,000.\" A bounce storm can park the domain for weeks. Pull a 50-row sample, verify it with a second vendor, and only restart if hard bounce sits near 2 percent or under.",
      "If LinkedIn replies are also dead, you have two problems: bad emails and a weak ICP. Fix the list definition before you buy another finder. Title plus company from last year is not a prospect.",
      "Omentir will not rescue a poisoned mailbox. Keep LinkedIn on the account, and treat email as a separate reputation you can actually lose. See [good bounce rate](/help/what-is-a-good-cold-email-bounce-rate).",
    ],
    faqItems: [
      {
        question: "Is 30 percent bounce a LinkedIn restriction?",
        answer:
          "No. LinkedIn restrictions are invites, messages, and search. Bounce is email infrastructure.",
      },
      {
        question: "Can I keep sending to the 70 percent that did not bounce?",
        answer:
          "After you pause, verify the rest, and confirm placement with seeds. Sending the leftover chunk from a panicked domain is how the 70 percent starts landing in spam too.",
      },
      {
        question: "Does a catch-all hide a 30 percent problem?",
        answer:
          "Yes. Catch-alls look delivered. You find out later when nobody replies and a few complain. Skip catch-alls as a default.",
      },
      {
        question: "Should I switch vendors mid-campaign?",
        answer:
          "Switch after you stop. Running two dirty sources at once just mixes the poison.",
      },
    ],
    relatedSlugs: [
      "why-are-linkedin-contact-discovery-tools-bouncing",
      "what-is-a-good-cold-email-bounce-rate",
      "why-are-my-cold-emails-going-to-spam",
    ],
  },
  {
    slug: "why-are-linkedin-phone-numbers-from-enrichment-wrong",
    question: "Why are phone numbers from LinkedIn enrichment tools so often wrong?",
    description:
      "Most tools never saw the person's phone. They match a name to an old broker record, a company main line, or a prior employee. Treat the number as a hypothesis.",
    keywords: [
      "wrong phone numbers LinkedIn enrichment",
      "LinkedIn phone finder inaccurate",
      "bad mobile numbers from contact tools",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "LinkedIn rarely shows a direct dial. Enrichers stitch data-broker files, company directories, and old CRM dumps to the profile you just viewed. The match is a name plus a company, which is a weak key. Homonyms and job-hoppers break it.",
      "What you get back is often the HQ switchboard, a general sales line, a mobile that belonged to the last person in that seat, or a VoIP that rings nowhere useful. Direct dials that do work are the exception you should be grateful for, not the default you budget around.",
      "Calling the wrong number with a script about \"your LinkedIn\" is how you train gatekeepers to hang up. Confirm the person still works there, then ask for the right line, or skip the call and stay on LinkedIn.",
      "Do not harvest numbers off profile pages or message attachments with a scraper. Wrong data plus a ToS problem is not an upgrade.",
      "If phone is core to the motion, buy a vendor you can audit, test 20 records by hand, and fire them if the first batch is junk. A logo on a comparison page is not a test.",
    ],
    faqItems: [
      {
        question: "Are mobile numbers more accurate than work lines?",
        answer:
          "Sometimes, and they are also easier to spam-report. A wrong mobile is worse than no call.",
      },
      {
        question: "Should I leave voicemail if I am not sure it is them?",
        answer:
          "No. A voicemail for the wrong person is a complaint waiting. Hang up and check the company site.",
      },
      {
        question: "Does Sales Navigator include phones?",
        answer:
          "Some seats and integrations surface contact fields. Do not assume every Navigator user got a clean dialer list. Read the plan.",
      },
      {
        question: "Is LinkedIn better than phone for first touch?",
        answer:
          "For most small teams, yes. A profile they can inspect beats a surprise call from a guessed mobile. See [LinkedIn vs cold calling](/help/linkedin-vs-cold-calling-for-b2b).",
      },
    ],
    relatedSlugs: [
      "why-are-linkedin-contact-discovery-tools-bouncing",
      "how-to-find-work-emails-from-linkedin",
      "linkedin-vs-cold-calling-for-b2b",
    ],
  },
  {
    slug: "how-to-nurture-leads-without-harassing-them",
    question: "How do I nurture leads without harassing them?",
    description:
      "Stay useful, leave gaps, and stop when they go quiet. Nurture is a calendar and a reason, not a longer sequence.",
    keywords: [
      "nurture leads without harassing",
      "B2B lead nurture outbound",
      "stay in touch without being pushy",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Harassment is a volume problem wearing a strategy hat. If the person already said not now, or they never replied, another identical bump is not nurture. It is you failing to close the loop.",
      "A humane cadence after a real conversation: one useful note when something actually changed (a hire, a product they use, a date they named), then silence. Useful means they could act on it without buying. A recap of your deck is not useful.",
      "Space channels. Do not DM, email, and call the same week unless they asked for a follow-up. One surface per touch. If they picked LinkedIn, stay there until they give you email.",
      "Write a stop rule before you start. Example: two follow-ups after a positive reply, or a breakup after silence, then they leave the sequence. Put them on a quarterly check-in list if the account is real. That list should be short enough that you still remember who they are.",
      "If you cannot name why this note exists today, do not send it. The polite version of nurture is absence. See [follow up without being spammy](/help/how-to-follow-up-on-linkedin-without-being-spammy).",
    ],
    faqItems: [
      {
        question: "Is a monthly newsletter nurture?",
        answer:
          "Only if they opted in. A cold DM is not a newsletter signup. Do not add them to marketing automation from a LinkedIn reply.",
      },
      {
        question: "What if they said \"circle back next quarter\"?",
        answer:
          "Put a date. Send one note near that date. Do not fill the gap with \"just checking in\" every two weeks.",
      },
      {
        question: "Can software drip them for me?",
        answer:
          "It can. Recipients can tell. If the drip cannot add a new fact, it is a bump with a nicer name.",
      },
      {
        question: "When does nurture become harassment legally?",
        answer:
          "Honor stop, unsubscribe, and \"don't contact me.\" Laws differ by channel and country. The social test is simpler: would you still send it if they could reply in front of your CEO?",
      },
    ],
    relatedSlugs: [
      "how-to-follow-up-on-linkedin-without-being-spammy",
      "what-to-say-when-a-linkedin-lead-says-not-right-now",
      "how-to-write-a-linkedin-breakup-message",
    ],
  },
  {
    slug: "how-to-warm-up-a-linkedin-account-for-automation",
    question: "How do I warm up a LinkedIn account for automation?",
    description:
      "Use the account as a person first. Then turn on a tool at a fraction of a seasoned volume. A warmup slider is not a substitute for a complete profile and quiet weeks.",
    keywords: [
      "warm up LinkedIn account for automation",
      "LinkedIn automation warmup",
      "new account LinkedIn sequencer",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Automation on a blank or brand-new profile is how accounts get restricted in week one. Finish photo, headline, About, and experience. Connect with people you actually know. Comment like a human. Do that before any sequencer touches the seat.",
      "Then keep using it by hand for a couple of weeks. A handful of thoughtful invites a day, real replies, no CSV dump. Watch accepts. If strangers ignore you, the tool will only ignore them faster.",
      "When you connect software, start well below whatever the vendor's default is. Daily invite and message caps exist because LinkedIn does not publish a safe bot quota. Random delays help less than low volume. A \"safe 80 a day\" toggle on a two-week-old account is still a blast.",
      "Do not warm up by automating likes, profile views, and follows at machine speed. That is a second bot fingerprint. Warmup is manual product use, then paced sending from your own session.",
      "Nothing unofficial is allowed just because you ramped. Caps only make the obvious pattern less obvious. Read [is LinkedIn automation allowed](/help/is-linkedin-automation-allowed) before you paste a session into a cloud tool. The slower playbook without the bot angle is [warmup for outreach](/help/how-to-warm-up-a-linkedin-account-for-outreach).",
    ],
    faqItems: [
      {
        question: "How long before I turn the tool on?",
        answer:
          "Plan on two to four weeks of normal use for a new or recovered account. An old personal profile can move sooner, but still should not jump from 2 invites a week to the vendor default.",
      },
      {
        question: "Does a warmup pool of fake conversations count?",
        answer:
          "Email warmup pools are a different product. LinkedIn does not give you a blessed conversation farm. Fake chats with other bots are a tell.",
      },
      {
        question: "Can I skip warmup if the tool is cloud-based?",
        answer:
          "Cloud vs browser changes the fingerprint, not the need for a real profile and a slow ramp. You still own the restriction.",
      },
      {
        question: "What if I need meetings this week?",
        answer:
          "Email, communities, and people you already know. Burning the LinkedIn seat to feed a sequencer is an expensive trade.",
      },
    ],
    relatedSlugs: [
      "how-to-warm-up-a-linkedin-account-for-outreach",
      "is-linkedin-automation-allowed",
      "mistakes-with-linkedin-automation-tools",
    ],
  },
  {
    slug: "common-linkedin-outreach-mistakes",
    question: "What are common LinkedIn outreach mistakes to avoid?",
    description:
      "Pitching in the invite, blasting a wide list, same-hour DMs after accept, and identical first lines. Most \"LinkedIn doesn't work\" stories start there.",
    keywords: [
      "common LinkedIn outreach mistakes",
      "LinkedIn outbound mistakes",
      "what not to do LinkedIn prospecting",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "The expensive mistakes are social, not technical. A logo photo, a slogan headline, and a connection note that is a pitch. People click I don't know this person, and your pending pile becomes a spam signal.",
      "The volume mistakes: new account at seasoned volume, pending invites in the thousands, the same paragraph to 200 titles. LinkedIn does not publish a weekly magic number. It does punish patterns that look like a bot.",
      "The timing mistakes: message 20 seconds after they accept, Calendly in line one, a follow-up every morning for a week. You had one shot at looking like a person. You used it as a sequencer.",
      "The list mistakes: scraping, buying \"LinkedIn leads,\" targeting everyone with a VP title in a country. Outreach fails at the list more often than at the comma in the opener.",
      "Fix the profile, tighten the ICP, write a first line that would be wrong on the next person, wait a day after accept, and cap the week. That boring stack beats a new tool. Nearby detail lives in [why requests get ignored](/help/why-are-my-linkedin-connection-requests-ignored).",
    ],
    faqItems: [
      {
        question: "Is sending without a note a mistake?",
        answer:
          "Not always. A blank invite from a clear profile can beat a pitchy note. See [should I include a note](/help/should-i-include-a-note-with-linkedin-connection-request).",
      },
      {
        question: "Is automation itself the mistake?",
        answer:
          "Unofficial automation is a ToS risk. The mistake people feel first is identical copy at 9:01. Caps do not fix a bad paragraph.",
      },
      {
        question: "What if my accept rate is fine and replies are not?",
        answer:
          "The invite worked. The first DM is the problem. Shorten it and drop the calendar link.",
      },
      {
        question: "Should I A/B everything?",
        answer:
          "Change one thing a week. If you rewrite profile, list, and script the same day, you will not know what moved.",
      },
    ],
    relatedSlugs: [
      "should-i-pitch-in-the-linkedin-connection-request",
      "why-are-my-linkedin-connection-requests-ignored",
      "how-to-prevent-linkedin-from-looking-like-a-bot",
    ],
  },
  {
    slug: "mistakes-with-linkedin-automation-tools",
    question: "What mistakes should I avoid with LinkedIn automation tools?",
    description:
      "Vendor default volumes, cloud sessions you cannot see, scraping add-ons, and copy that only a bot would send. The tool is optional. The restriction is yours.",
    keywords: [
      "mistakes with LinkedIn automation tools",
      "LinkedIn automation errors",
      "LinkedIn sequencer mistakes",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "The first mistake is believing a dashboard that says \"safe.\" LinkedIn does not certify consumer-profile bots. If the default is dozens of invites a day on a quiet account, that default is the vendor's appetite, not yours.",
      "The second is running two tools on one seat, or a scraper extension plus a cloud sequencer. You get two fingerprints and one name on the restriction email.",
      "The third is copy the tool generated for 400 people with a merge tag. Recipients compare notes. LinkedIn sees the same blob. Write fewer first lines yourself.",
      "The fourth is ignoring replies because the sequence is still running. A human said hello and the bot sent step three. Pause on reply. Always.",
      "Omentir puts invite and message caps in front of you on purpose. We still cannot promise LinkedIn will like the account. If a vendor wants your password or a session cookie and will not say where the browser lives, walk away.",
    ],
    faqItems: [
      {
        question: "Is a Chrome extension safer than a cloud tool?",
        answer:
          "Safer is the wrong word. Extensions click the page you see. Cloud tools move the session. Both are unofficial. Pick the one you can actually supervise, or send by hand.",
      },
      {
        question: "Can I automate only views and likes?",
        answer:
          "You can. It still looks like a bot, and it trains you to skip the part that books meetings: a specific invite.",
      },
      {
        question: "What if the tool got other customers restricted?",
        answer:
          "Assume you can be next. Read recent reviews like a pessimist. Then still cap volume.",
      },
      {
        question: "Does warming the email domain protect LinkedIn?",
        answer:
          "No. Separate reputations. Warm the seat and the domain as different jobs.",
      },
    ],
    relatedSlugs: [
      "how-to-warm-up-a-linkedin-account-for-automation",
      "is-linkedin-automation-allowed",
      "is-it-ok-to-scrape-linkedin",
    ],
  },
  {
    slug: "how-to-build-relationships-before-a-linkedin-pitch",
    question: "How do I build a relationship on LinkedIn before I pitch?",
    description:
      "Earn a little context: a real comment, a specific invite, a first DM that is not a meeting ask. Then pitch once. Skipping the context is why cold feels colder.",
    keywords: [
      "build relationships before LinkedIn pitch",
      "warm up prospect before pitching LinkedIn",
      "LinkedIn social selling before outbound",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "You do not need a six-month content courtship. You need the person to recognize why you exist before you ask for 20 minutes. A comment that adds a point, an invite with a real reason, a first message that asks one question: that is the whole warmup.",
      "Liking 40 posts in a night is not a relationship. It is a notification tax. One comment they would agree was fair beats a streak of thumbs.",
      "After they accept, wait. A same-hour pitch trains them to regret the click. Next day, reference the thing you already noticed. If you noticed nothing, you were not ready to invite them.",
      "Some accounts never get a public warmup because the buyer does not post. Then the relationship is the quality of the note and the profile. Do not fake \"loved your post\" on a silent page.",
      "When you do pitch, pitch once, clearly, with an easy no. If they ignore that, breakup and leave. A relationship is not a hostage sequence. See [comment before outreach](/help/how-to-comment-on-linkedin-before-outreach).",
    ],
    faqItems: [
      {
        question: "How many comments before I invite?",
        answer:
          "Zero to two is plenty. A week of comments with no invite can also look like lurking. Do not turn it into a ritual.",
      },
      {
        question: "Should I send value-first PDFs?",
        answer:
          "Not in the first DM. Strangers do not download decks. Offer a one-liner they can use without a file.",
      },
      {
        question: "Does posting every day replace 1:1?",
        answer:
          "Posting helps inbound. Outbound still needs a name and a reason. Different jobs.",
      },
      {
        question: "What if they accept and never talk?",
        answer:
          "One follow-up with a new fact, then a close. Silence is an answer. See [when a prospect ghosts you](/help/what-to-do-when-linkedin-prospect-ghosts-you).",
      },
    ],
    relatedSlugs: [
      "how-to-comment-on-linkedin-before-outreach",
      "when-to-send-first-linkedin-message-after-accept",
      "should-i-like-a-prospect-post-before-connecting",
    ],
  },
  {
    slug: "should-i-auto-accept-linkedin-invitations",
    question: "Should I auto-accept LinkedIn connection invitations?",
    description:
      "Usually no for a sales seat. Auto-accept fills the graph with recruiters, bots, and people you will never message on purpose.",
    keywords: [
      "LinkedIn auto accept invitations",
      "should I auto accept LinkedIn connections",
      "automatically accept LinkedIn requests",
    ],
    cluster: "requests",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A sales profile gets a lot of incoming invites that are not buyers: other SDRs, scrapers, \"opportunity\" accounts, and people collecting graphs. Auto-accept turns your first-degree list into a junk drawer. Search, TeamLink-style paths, and \"people you know\" get noisier.",
      "Accept people you might actually talk to, plus a few peers in your market. Ignore or withdraw the rest. You do not owe a stranger a slot in a 30,000 cap.",
      "Tools that auto-accept so you can message everyone who added you are running a different motion: inbound spam. You will spend the week in conversations you did not want.",
      "If you are a known founder and incoming is mostly customers, a looser filter can work. Still skim. A fake profile with a logo photo is not a customer.",
      "Open Profile and Creator Mode already change how strangers reach you. Adding auto-accept on top is how the inbox becomes unusable. Keep inbound manual unless you have a reason you can say out loud.",
    ],
    faqItems: [
      {
        question: "Will ignoring invites hurt SSI?",
        answer:
          "SSI is a habit score, not a reason to accept bots. See [what is SSI](/help/what-is-linkedin-ssi).",
      },
      {
        question: "Can I message them without accepting?",
        answer:
          "Not as a normal DM. You would need InMail or another allowed path. If they are not worth a credit, they are not worth a cluttered graph.",
      },
      {
        question: "What about people who already emailed me?",
        answer:
          "Accept those. The relationship started off-platform. LinkedIn is just the other door.",
      },
      {
        question: "Is there an official LinkedIn auto-accept?",
        answer:
          "Not as a blessed sales feature. Third-party auto-accept is unofficial automation with the usual risks.",
      },
    ],
    relatedSlugs: [
      "how-many-connections-can-i-have-on-linkedin",
      "what-does-i-dont-know-this-person-do-on-linkedin",
      "is-linkedin-automation-allowed",
    ],
  },
  {
    slug: "how-to-check-contact-data-before-cold-email",
    question: "How do I check LinkedIn-sourced contact data before I email?",
    description:
      "Confirm they still work there, verify the mailbox, skip catch-alls, and send a 20-person test. Confidence scores from a finder are not a test.",
    keywords: [
      "verify LinkedIn contact data",
      "check emails before cold email",
      "validate LinkedIn enrichment",
    ],
    cluster: "email",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Open the profile the same week. If title or company moved, drop the row. Enrichment that was \"95 percent confident\" last quarter is trivia now.",
      "Run the address through a verifier that returns invalid, catch-all, and unknown as separate buckets. Invalid never goes out. Catch-all and unknown stay off the first blast.",
      "Send 20 to 50 from the warmed inbox, not 2,000. Read bounce, not opens. If hard bounce is already ugly, the rest of the file is not a mystery. It is more of the same.",
      "Spot-check phones if you call. A LinkedIn URL plus a switchboard is not a mobile. See [wrong numbers](/help/why-are-linkedin-phone-numbers-from-enrichment-wrong).",
      "Keep a kill rule: one bad source gets removed from the waterfall, not \"averaged\" with a better one. Mixing junk with clean still produces junk.",
    ],
    faqItems: [
      {
        question: "Is a company website contact page enough?",
        answer:
          "For a role inbox, maybe, with low hopes. For a named person, you still want a verified personal work address or a LinkedIn thread.",
      },
      {
        question: "How fresh is fresh enough?",
        answer:
          "Verify close to send, days to a few weeks, not a year-old export.",
      },
      {
        question: "Can I trust \"catch-all but previously mailed\"?",
        answer:
          "Previously mailed is not previously delivered to a human. Test small or skip.",
      },
      {
        question: "Does asking on LinkedIn beat enrichment?",
        answer:
          "Once they are talking, yes. \"What's best for a calendar invite?\" is cleaner than another finder.",
      },
    ],
    relatedSlugs: [
      "what-is-email-verification",
      "why-are-linkedin-contact-discovery-tools-bouncing",
      "how-to-find-work-emails-from-linkedin",
    ],
  },
];
