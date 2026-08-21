import type { HelpPageDraft } from "./types";

const DATE = "August 19, 2026";

export const HELP_PAGES_G: HelpPageDraft[] = [
  {
    slug: "why-cant-i-add-a-note-to-linkedin-connection-request",
    question: "Why can't I add a note to a LinkedIn connection request?",
    description:
      "Free accounts are often rationed on personalized notes. Some surfaces also hide the note field. Paid plans can attach notes more freely. The invite still sends without one.",
    keywords: [
      "can't add note to LinkedIn invite",
      "LinkedIn connection note missing",
      "personalized invitation limit LinkedIn",
    ],
    cluster: "requests",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "If the note box is gone, you are usually out of personalized invitations on a free account for that month, or you are inviting from a surface that only offers Connect. LinkedIn has tightened how many notes free members can attach. The exact count has moved. Do not build a process that needs a note on every invite.",
      "Paid members historically get more room, including a slightly longer note. Even then, some mobile flows and \"Connect\" buttons in search skip the composer. Open the profile and invite from there if you need the box.",
      "A missing note is not a broken account. Send blank, or wait until the allowance resets, or upgrade if notes are actually the bottleneck. A blank invite with a strong profile still works on a warm-ish list.",
      "Do not install an extension to force a note field. That is the kind of DOM tool LinkedIn watches. Write fewer notes worth sending.",
      "If you only get a handful of notes, spend them on the coldest, highest-value names. Everyone else gets blank or no invite. See [should I include a note](/help/should-i-include-a-note-with-linkedin-connection-request).",
    ],
    faqItems: [
      {
        question: "Will Premium fix this immediately?",
        answer:
          "It usually restores the ability to add notes on more invites. It does not raise the weekly invite cap.",
      },
      {
        question: "Can I add a note after I already sent the invite?",
        answer:
          "No. Withdraw and wait if you must redo it. Re-inviting the same person quickly looks worse than a blank send.",
      },
      {
        question: "Does this mean I am restricted?",
        answer:
          "Not by itself. A restriction banner looks different. A missing note field on a free account is usually rationing.",
      },
      {
        question: "Is a blank invite worse?",
        answer:
          "Worse than a specific one-liner, often. Better than a fake paragraph. See the note-versus-blank page.",
      },
    ],
    relatedSlugs: [
      "should-i-include-a-note-with-linkedin-connection-request",
      "how-long-should-a-linkedin-connection-note-be",
      "linkedin-premium-vs-sales-navigator",
    ],
  },
  {
    slug: "can-i-export-linkedin-search-results",
    question: "Can I export LinkedIn search results?",
    description:
      "Not as a supported dump from the consumer search page. Sales Navigator and Recruiter have their own export and list tools. Scrapers violate the user agreement.",
    keywords: [
      "export LinkedIn search results",
      "download LinkedIn leads CSV",
      "scrape LinkedIn search",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Regular LinkedIn search has no \"Download CSV\" button for a reason. The graph is not your database. Copying a few names by hand for a campaign you will actually run is how people have always worked. Automating extraction is how people get restricted.",
      "Sales Navigator lets you save leads and accounts into lists. Some paid LinkedIn products allow exports inside their rules. That is still not \"the whole search, every field, every email.\"",
      "Browser extensions that promise 2,500 rows with emails are doing the thing the user agreement restricts. LinkedIn has sued and restricted over scraping. The hiQ story did not make consumer scraping a friendly hobby.",
      "If you need emails, use a data provider you can defend, or ask on a call. Do not harvest from profile pages at machine speed.",
      "Omentir finds ICP-fit people for outreach from your account. It is not a LinkedIn exporter. If your job is a spreadsheet of the whole TAM, you want a different product, and you still need a lawful source.",
    ],
    faqItems: [
      {
        question: "Can I copy-paste 20 names into a sheet?",
        answer:
          "Yes. That is research. A plugin clicking through 2,000 profiles is not.",
      },
      {
        question: "Does Sales Navigator CSV export include emails?",
        answer:
          "Navigator is not primarily an email database. Some seats and integrations add contact fields. Read what your contract actually includes before you assume a full mailbox dump.",
      },
      {
        question: "What if my agency already scraped the list?",
        answer:
          "You still own how you use it. High bounce, GDPR complaints, and LinkedIn restrictions can land on you. Ask how they built it.",
      },
      {
        question: "Is the Recruiter export different?",
        answer:
          "Recruiter is for hiring. Using it as a sales scrape is against the spirit of that product and a good way to lose the seat.",
      },
    ],
    relatedSlugs: [
      "is-it-ok-to-scrape-linkedin",
      "is-linkedin-automation-allowed",
      "how-to-find-work-emails-from-linkedin",
    ],
  },
  {
    slug: "what-is-a-linkedin-2nd-degree-connection",
    question: "What is a LinkedIn 2nd-degree connection?",
    description:
      "A 2nd-degree connection shares a mutual first-degree connection with you. Invites to them often accept better because a name they know appears.",
    keywords: [
      "LinkedIn 2nd degree connection",
      "what does 2nd degree mean on LinkedIn",
      "1st 2nd 3rd degree LinkedIn",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "1st-degree people are already connected. You can usually DM them. 2nd-degree means you both know someone in the middle. 3rd-degree is further out. LinkedIn shows these labels on profiles and in search.",
      "2nd-degree invites often accept at a higher rate because the mutual person is social proof. That only helps if the mutual is real. Name-dropping a stranger you both collected at a conference in 2017 does not.",
      "You still need a reason. \"We're both connected to Priya\" is weak if Priya would not introduce you. Pair the degree with a trigger.",
      "TeamLink in Sales Navigator is a related idea at company scale: colleagues' networks. It is not a license to pretend you are close.",
      "Do not buy 1st-degree connections to manufacture 2nd-degree paths. That graph is junk, and LinkedIn is not confused about farms.",
    ],
    faqItems: [
      {
        question: "Can I filter search to 2nd-degree only?",
        answer:
          "Yes, in both consumer search and Navigator. It is a useful slice when you have a real network in the market.",
      },
      {
        question: "What is 3rd-degree plus?",
        answer:
          "Out of network, or far enough that LinkedIn will not show a path. You will need InMail, Open Profile, a group, or a colder invite.",
      },
      {
        question: "Does 2nd-degree skip the invite limit?",
        answer:
          "No. An invite is still an invite. It may just be more likely to be accepted.",
      },
      {
        question: "Should I only write 2nd-degree people?",
        answer:
          "If your graph is dense in the ICP, it is a good default. If your graph is empty, you will have to go colder and write better reasons.",
      },
    ],
    relatedSlugs: [
      "what-is-linkedin-teamlink",
      "can-i-send-linkedin-requests-to-people-i-dont-know",
      "how-to-find-decision-makers-on-linkedin",
    ],
  },
  {
    slug: "how-to-message-linkedin-group-members",
    question: "How do I message LinkedIn group members without connecting?",
    description:
      "Some groups still allow member-to-member messages. The rules change, and spam in groups gets people removed. Keep it as short as an invite note.",
    keywords: [
      "message LinkedIn group members",
      "LinkedIn group message without connecting",
      "outreach in LinkedIn groups",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "LinkedIn groups have, at times, let members message each other without a first-degree connection. If the Message button appears on a member in a group you both belong to, that is the path. If it does not, the group is not a back door.",
      "Join groups you would actually read. Lurking for a week and then blasting 40 members is obvious. Comment in the group, then message one person with a specific point.",
      "Do not paste your email sequence into a group DM. Moderators and LinkedIn both see patterns. Getting kicked from the group is the light outcome. A restriction is the heavy one.",
      "Group membership as a line in a connection note only works if you participate. \"We're both in Marketing Leaders\" from someone who never posted is empty.",
      "Treat group messaging as a rare extra, not a parallel sequencer. Invites and InMail remain the main paths.",
    ],
    faqItems: [
      {
        question: "Are unlisted groups better for this?",
        answer:
          "Smaller, real groups have conversations. They also notice spam faster. Behave like a member.",
      },
      {
        question: "Can I scrape the member list?",
        answer:
          "No. Same scraping problem as search. Use the UI like a person.",
      },
      {
        question: "Does leaving the group after messaging look bad?",
        answer:
          "Yes. Stay if the group is real. If you only joined to extract names, you already made the wrong call.",
      },
      {
        question: "Is this the same as an event attendee message?",
        answer:
          "Events have had their own attendee messaging rules. They also change. If the button is there, keep it short and tied to the event.",
      },
    ],
    relatedSlugs: [
      "how-to-message-someone-on-linkedin-without-connecting",
      "what-is-linkedin-open-profile",
      "is-linkedin-automation-allowed",
    ],
  },
  {
    slug: "can-i-send-linkedin-messages-in-bulk",
    question: "Can I send LinkedIn messages in bulk?",
    description:
      "Not in a way LinkedIn blesses for cold outreach. Identical blasts look like spam, burn reply rates, and can restrict the account. Sequence a small list with gaps instead.",
    keywords: [
      "bulk LinkedIn messages",
      "mass LinkedIn DM",
      "send LinkedIn messages in bulk",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "There is no official \"select 500 connections and mail merge\" for cold sales on the consumer product. Tools that do it are unofficial automation. Recipients can tell when 200 people got the same paragraph at 9:01.",
      "Even to 1st-degree connections, a blast can get marked as spam and hurt the account. LinkedIn is still watching volume and reports, not only whether you are connected.",
      "The workable version of bulk is a campaign: a defined segment, a template with one real first line, daily caps, and pauses on reply. That is paced sending, not a dump.",
      "If you need an announcement to customers, use email they opted into, or a company page post. LinkedIn DMs are a conversation surface.",
      "Omentir runs connection requests, messages, and follow-ups from your profile with limits you set. It will not make a 2,000-line identical DM a good idea.",
    ],
    faqItems: [
      {
        question: "What about LinkedIn's own bulk invite from CSV?",
        answer:
          "Contact imports and \"people you may know\" flows are not a cold TAM upload. Using them as one is how you import a mess and a restriction.",
      },
      {
        question: "Can I BCC people in LinkedIn?",
        answer:
          "LinkedIn is not email. There is no BCC for DMs. Group chats are for groups of people who expect to be together.",
      },
      {
        question: "Is InMail better for bulk?",
        answer:
          "Credits run out and spam marks still count. Bulk InMail is an expensive way to get restricted.",
      },
      {
        question: "How small should a batch be?",
        answer:
          "Small enough that you could read every first line. If you cannot, it is too big for one day.",
      },
    ],
    relatedSlugs: [
      "is-linkedin-automation-allowed",
      "how-to-personalize-linkedin-outreach",
      "how-many-linkedin-follow-up-messages-should-i-send",
    ],
  },
  {
    slug: "how-to-recover-linkedin-after-too-many-ignores",
    question: "How do I recover a LinkedIn account after too many ignored invites?",
    description:
      "Stop sending to strangers for a bit, withdraw stale pending invites, and only ask people with a clear reason. Acceptance has to recover before volume does.",
    keywords: [
      "LinkedIn invites ignored recover",
      "low LinkedIn acceptance rate fix",
      "LinkedIn account after ignored requests",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A week of ignores is a signal. Treat it like a mini restriction even if no banner appeared. Cut daily invites, sometimes down to people you actually know, for several days.",
      "Withdraw pending requests older than two to four weeks, slowly. A fat pending pile plus a low accept rate is how the next week gets smaller.",
      "Rewrite the list, not only the note. If the last 100 names were \"any VP,\" the next 20 should be a trigger you can point at. Profile and headline next, then copy.",
      "Do not make up volume on a second account. That is how you lose both. Do not buy accepts. Do not run a scraper \"just to find better people\" in the same week.",
      "When accepts climb back over about 30 percent, raise volume a little. Stay there. The goal is a boring healthy week, not a revenge blast. See [what is a good acceptance rate](/help/what-is-a-good-linkedin-acceptance-rate).",
    ],
    faqItems: [
      {
        question: "How long should the pause last?",
        answer:
          "A few days to two weeks depending on how ugly the week was. If you also hit a restriction, follow that timer first.",
      },
      {
        question: "Should I post more during recovery?",
        answer:
          "A couple of real comments help the profile look alive. A sudden content binge from a silent account looks like another tactic. Keep it human.",
      },
      {
        question: "Can I keep messaging 1st-degree connections?",
        answer:
          "Yes, if they are real conversations. Do not pivot the blast into the inbox.",
      },
      {
        question: "What if acceptance never recovers?",
        answer:
          "The offer or the ICP is wrong. More invites will not find a hidden yes. Talk to the last ten people who did reply and copy that segment.",
      },
    ],
    relatedSlugs: [
      "why-are-my-linkedin-connection-requests-ignored",
      "how-to-withdraw-pending-linkedin-invitations",
      "how-to-warm-up-a-linkedin-account-for-outreach",
    ],
  },
  {
    slug: "how-to-appeal-a-linkedin-restriction",
    question: "How do I appeal a LinkedIn restriction?",
    description:
      "Read the notice, do what it asks once, and send one factual appeal if a form exists. Do not appeal daily, and do not open a second profile to dodge it.",
    keywords: [
      "appeal LinkedIn restriction",
      "LinkedIn restriction help form",
      "LinkedIn account restricted appeal",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Match the appeal to the notice. An invitation-limit screen usually wants you to wait about a week. LinkedIn Help says Support will not shorten that one. Save the form for identity checks, suspected errors, or longer holds.",
      "If there is a form, write what happened in plain language: you sent too many invites, you removed the extension, you will lower volume. Do not threaten. Do not paste a legal essay. One ticket.",
      "Premium and Navigator sometimes get a faster support path. That can help on a true error. It will not mint extra invites during a standard cooldown.",
      "While you wait, disconnect unused apps, review sessions, and stop all senders. Using a VPN, a new laptop, and a new appeal every morning looks like evasion.",
      "If the account is gone, export data through LinkedIn's tools if you still can. Rebuild later on the same identity after the case closes. A parallel fake profile is a worse hole. See [why was my account restricted](/help/why-was-my-linkedin-account-restricted).",
    ],
    faqItems: [
      {
        question: "Should I mention my vendor in the appeal?",
        answer:
          "If a tool triggered it, say you disconnected it. Do not blame LinkedIn for not supporting unofficial automation.",
      },
      {
        question: "How long until they reply?",
        answer:
          "Hours to many days. Invitation cooldowns may never get a human reply because the wait is the product. Watch the banner more than your inbox.",
      },
      {
        question: "Can a lawyer speed this up?",
        answer:
          "For a permanent ban with a real dispute, maybe. For a one-week invite pause, no. Do not spend that money on a cooldown.",
      },
      {
        question: "What if I did nothing wrong?",
        answer:
          "Say that once, with dates and what you actually clicked. Then wait. Repeated claims without changing behavior do not help.",
      },
    ],
    relatedSlugs: [
      "how-long-does-a-linkedin-restriction-last",
      "why-was-my-linkedin-account-restricted",
      "what-happens-when-i-hit-linkedin-invitation-limit",
    ],
  },
  {
    slug: "what-is-linkedin-focused-inbox",
    question: "What is LinkedIn's Focused inbox?",
    description:
      "Incoming invitations and messages can land in Focused or Other. Low-trust invites sit where people do not look. That is one reason \"sent\" is not the same as \"seen.\"",
    keywords: [
      "LinkedIn Focused inbox",
      "LinkedIn Other invitations",
      "why LinkedIn invite in Other",
    ],
    cluster: "requests",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "LinkedIn sorts some incoming invitations into Focused versus Other, described in its invitations help. Other is where unknown, salesy, or low-trust requests go to die. You do not get a dashboard that says your last 40 invites landed in Other. You infer it from silence.",
      "Things that push you toward Other: no photo, a logo avatar, a pitch in the note, a stranger with no mutuals, a pattern of ignored asks. Things that help: a complete profile, a real reason, a mutual person they actually know.",
      "You cannot buy Focused. You can stop looking like spam. That is the whole tactic.",
      "Messages have also had primary versus other-style filtering over the years. A first DM that is a landing page is more likely to be ignored even if it technically delivered.",
      "Measure accepts and replies, not sends. A campaign that \"reached\" 200 people who never opened Other did not reach them. See [LinkedIn spam filters](/blogs/linkedin-spam-filters-how-they-work).",
    ],
    faqItems: [
      {
        question: "Can I see which of my invites went to Other?",
        answer:
          "Not as a sender report. If acceptance is terrible on a cold list, assume many never got a fair look.",
      },
      {
        question: "Does Premium put me in Focused?",
        answer:
          "Not as a published skip. A paid badge is not a trust score for the recipient.",
      },
      {
        question: "Should I tell them to check Other?",
        answer:
          "You cannot, until you have another channel. \"Check your Other tab\" from a stranger is a strange first line anyway.",
      },
      {
        question: "Is Other the same as spam?",
        answer:
          "It is a quieter folder, not always a spam mark. Both outcomes waste the invite.",
      },
    ],
    relatedSlugs: [
      "why-are-my-linkedin-connection-requests-ignored",
      "what-does-i-dont-know-this-person-do-on-linkedin",
      "how-to-optimize-linkedin-profile-for-outbound",
    ],
  },
  {
    slug: "how-to-write-a-linkedin-inmail-subject-line",
    question: "How do I write a LinkedIn InMail subject line?",
    description:
      "Keep it short and specific. Name the trigger. Skip clickbait. LinkedIn's subject field is small, and it does a lot of the open.",
    keywords: [
      "LinkedIn InMail subject line",
      "best InMail subject lines",
      "InMail subject character limit",
    ],
    cluster: "inmail",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "The InMail subject is often capped around 200 characters. You should use far less. Five to eight words that name why this note exists will beat a teaser.",
      "Good: \"Hiring two AEs this month?\" or \"Question on the Series B ops hire.\" Bad: \"Quick question\" and \"Touching base\" and \"Partnership opportunity.\" Those are spam labels wearing a subject.",
      "Match the body. If the subject is a hire and the body is a product dump, you baited them. They will not forgive that on a paid credit.",
      "Lowercase can look human. It can also look like a trick. Write the way you would write an email to a peer. Do not optimize for a growth-hack thread.",
      "If you cannot write a subject without the product name, you are not ready to spend the credit. Put the product in sentence two of the body, or not at all on the first InMail. See [what is LinkedIn InMail](/help/what-is-linkedin-inmail).",
    ],
    faqItems: [
      {
        question: "Should I include their company name?",
        answer:
          "If it fits naturally. Merge-tag company names that overflow the subject look broken. Check long names.",
      },
      {
        question: "Are questions better than statements?",
        answer:
          "Questions often earn a peek. They still need to be a question only that person could get. \"Got a minute?\" is not that.",
      },
      {
        question: "Can I use emojis?",
        answer:
          "Skip them in cold InMail. They read as a template.",
      },
      {
        question: "Does the subject show on mobile the same way?",
        answer:
          "It truncates. Put the meaning first, not a greeting.",
      },
    ],
    relatedSlugs: [
      "what-is-linkedin-inmail",
      "what-is-a-good-inmail-response-rate",
      "how-long-should-a-linkedin-cold-message-be",
    ],
  },
  {
    slug: "what-is-a-good-inmail-response-rate",
    question: "What is a good LinkedIn InMail response rate?",
    description:
      "Targeted InMails often get quoted in a 10 to 25 percent reply band. Spray InMail does worse. Credits make this a paid-media number, not a vanity open rate.",
    keywords: [
      "good InMail response rate",
      "LinkedIn InMail reply rate",
      "InMail conversion benchmarks",
    ],
    cluster: "inmail",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "LinkedIn has published that shorter InMails get better response than long ones. Vendor benches for targeted InMail often sit around 10 to 25 percent. Generic blasts sit lower. Your offer will move this more than the plan name.",
      "Count replies, not opens. An InMail that was opened and ignored still spent a credit if they did not reply (until any refund window). Track positive replies separately.",
      "If you are under 5 percent after a few dozen well-chosen names, the list or the first two sentences are wrong. Do not spend the rest of the month's credits proving it.",
      "InMail should beat a cold invite on the same person only when they will not connect, or when you should not invite. If they would have accepted a normal request, you paid extra for a mailbox they already would have opened as a DM.",
      "Refunds on reply can make a good InMail cheaper than it looks. They do not make a bad template free. See [do InMail credits come back](/help/do-inmail-credits-come-back-if-someone-replies).",
    ],
    faqItems: [
      {
        question: "Is InMail better than a connection note?",
        answer:
          "Different funnel. Notes are tiny and cheap. InMail is longer and scarce. Compare meetings per week, not reply rate in isolation.",
      },
      {
        question: "Do executives reply less?",
        answer:
          "Often, unless the note is short and business-specific. Volume at C-suite is how credits vanish.",
      },
      {
        question: "Should I follow up an InMail with an invite?",
        answer:
          "If they ignored the InMail, an invite with the same pitch is a pile-on. Wait, or use a different reason later.",
      },
      {
        question: "Does Open Profile inflate my InMail stats?",
        answer:
          "Those are not InMails. Keep the numbers in different columns.",
      },
    ],
    relatedSlugs: [
      "how-to-write-a-linkedin-inmail-subject-line",
      "what-is-a-good-linkedin-reply-rate",
      "how-many-inmail-credits-does-sales-navigator-give",
    ],
  },
];
