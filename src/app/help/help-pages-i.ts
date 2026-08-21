import type { HelpPageDraft } from "./types";

const DATE = "August 19, 2026";

export const HELP_PAGES_I: HelpPageDraft[] = [
  {
    slug: "what-to-say-when-linkedin-prospect-says-not-interested",
    question: "What do I say when a LinkedIn prospect says not interested?",
    description:
      "Thank them, stop pitching, and leave. \"Not interested\" is a closed door. Arguing with it is how you get marked as spam.",
    keywords: [
      "LinkedIn not interested reply",
      "how to handle not interested on LinkedIn",
      "sales objection not interested DM",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "\"Not interested\" is clearer than silence. Reply once: thanks, you will close the loop, they can find you later if the problem shows up. Then stop the sequence on every channel.",
      "Do not ask \"is it the price or the timing\" unless they left a crack. A flat no is not a discovery call. Pushing turns a clean no into a report.",
      "If they add a reason (\"we just signed a three-year deal\"), you can ask whether a note in month 11 is OK. If they say no to that too, believe them.",
      "Remove them from the list in a way the next campaign cannot \"rediscover\" next week. Suppression is part of not being a pest.",
      "Your ego will want the last word. Skip it. Spend the energy on someone who has not voted yet.",
    ],
    faqItems: [
      {
        question: "Is \"not interested\" the same as \"not now\"?",
        answer:
          "No. Not now has a clock. Not interested does not. See [not right now](/help/what-to-say-when-a-linkedin-lead-says-not-right-now).",
      },
      {
        question: "Should I send a breakup after a no?",
        answer:
          "You already have the no. A breakup is for ghosts. Extra messages after a no are spam.",
      },
      {
        question: "Can I stay connected?",
        answer:
          "Yes, unless they asked to disconnect. Do not keep pitching in the thread. A real comment on a post months later is still allowed if it is about the post.",
      },
      {
        question: "What if they are rude?",
        answer:
          "One short polite close. Do not match the tone. Walk away.",
      },
    ],
    relatedSlugs: [
      "what-to-say-when-a-linkedin-lead-says-not-right-now",
      "how-to-reply-when-prospect-already-uses-a-competitor",
      "is-cold-outreach-legal-gdpr-can-spam",
    ],
  },
  {
    slug: "how-to-follow-up-after-a-demo-no-show",
    question: "How do I follow up after a demo no-show?",
    description:
      "Bump once the same day with a new time, stay calm, and do not guilt them. One no-show is common. Three chases is a campaign against their calendar.",
    keywords: [
      "demo no-show follow up",
      "LinkedIn meeting no-show",
      "what to say after missed demo",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "People miss calls. Travel, a fire drill, a forgotten calendar overlay. Send a short note the same day: you were on the line, here are two new windows, or here is the link to rebook. No lecture.",
      "If they rebook, send the invite immediately with the same agenda. If they go silent, one more bump two days later is enough. Then treat it as a nurture, not a debt they owe you.",
      "Do not post about no-shows. Do not email their CEO. Do not \"confirm with your assistant\" in a tone that implies they are flaky. You are still trying to sell them something.",
      "If no-shows are common in a segment, shorten the first call and send a reminder an hour before. The reminder does more than a stern follow-up.",
      "Keep the original thread. A new sequence that pretends you never met is confusing. They already know who you are.",
    ],
    faqItems: [
      {
        question: "Should I call their mobile after a no-show?",
        answer:
          "Only if they gave the number for that purpose. A surprise call can feel like an ambush.",
      },
      {
        question: "Can I send the recording of an empty room?",
        answer:
          "No. That is petty. Offer a loom of the walkthrough if they still want async.",
      },
      {
        question: "What if they no-show twice?",
        answer:
          "Ask if they still want this. If yes, let them pick the time. If silence, close the loop.",
      },
      {
        question: "Do I keep them in the outbound cadence?",
        answer:
          "Pause it. They are in a live deal thread, even if they missed. Cadence on top of a no-show is messy.",
      },
    ],
    relatedSlugs: [
      "how-to-book-a-meeting-from-a-linkedin-message",
      "what-to-do-when-linkedin-prospect-ghosts-you",
      "how-to-handle-send-me-more-information",
    ],
  },
  {
    slug: "can-i-use-chatgpt-to-write-linkedin-messages",
    question: "Can I use ChatGPT to write LinkedIn messages?",
    description:
      "Yes as a draft helper. No as an unsupervised sender. Generic model copy is easy to spot and can accept worse than a short human template.",
    keywords: [
      "ChatGPT LinkedIn messages",
      "AI write LinkedIn outreach",
      "using ChatGPT for cold DMs",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Models are fine for a first pass if you paste a real trigger and your actual offer. They are bad at pretending they read a post you did not paste. \"Loved your insights on leadership\" is the default slop.",
      "Edit until it sounds like something you would say out loud. Cut the compliment, cut the biography, leave one observation and one question. If you would not send it from your personal phone, do not send it from LinkedIn.",
      "Never let a model invent a customer, a metric, or a mutual friend. Recipients check. A fake proof point is worse than a plain note.",
      "Operator tests in 2026 did not show a clean win for unedited AI personalization over a good human template. Some even saw lower accepts. Use the model for speed. Keep the last read as yours.",
      "Omentir drafts from product context and lead signals on purpose. You still review. A fluent paragraph that could fit a dentist and a datacenter should not leave the queue.",
    ],
    faqItems: [
      {
        question: "Should I tell them a model wrote it?",
        answer:
          "No need to announce the tools. Do not lie if they ask. The standard is that the message is true, not that you typed every word with a quill.",
      },
      {
        question: "Can I generate 500 unique first lines overnight?",
        answer:
          "You can. Many will be wrong. Spot-check a sample before anything sends. Unique-looking is not the same as true.",
      },
      {
        question: "What prompt works?",
        answer:
          "Paste the post or the hire, paste your one-sentence offer, and ask for two sentences with no pitch and no calendar. Then cut more.",
      },
      {
        question: "Is this allowed by LinkedIn?",
        answer:
          "Writing with a model is not the same as bot-sending. The send path still has to look like you. Automation rules are the bigger issue. See [is LinkedIn automation allowed](/help/is-linkedin-automation-allowed).",
      },
    ],
    relatedSlugs: [
      "how-to-personalize-linkedin-outreach",
      "how-to-write-a-linkedin-connection-request",
      "how-to-prevent-linkedin-from-looking-like-a-bot",
    ],
  },
  {
    slug: "how-to-send-a-linkedin-voice-message",
    question: "How do I send a LinkedIn voice message?",
    description:
      "Voice notes are for first-degree chats where a voice is not creepy. Keep it under 30 seconds. Most cold outbound should stay text.",
    keywords: [
      "LinkedIn voice message",
      "send voice note LinkedIn",
      "LinkedIn audio message sales",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "On mobile, in a 1st-degree thread, LinkedIn has offered a microphone for voice notes. Availability changes by app version. If you do not see it, you cannot force it from a sequencer.",
      "Cold voice from a stranger is intimate in a way a two-sentence DM is not. Many buyers hate it. Use it after they have talked to you, or with people who already know your voice.",
      "If you send one, script the first line, smile anyway, and stop under 30 seconds. No walk through the deck. No \"um, just circling back.\"",
      "Do not mass-send the same audio. Recipients compare notes. Identical voice is a worse tell than identical text.",
      "When in doubt, type. Text is searchable, forwardable, and easier to ignore politely. That last part is a feature.",
    ],
    faqItems: [
      {
        question: "Can I send voice before we are connected?",
        answer:
          "Not as a normal InMail or invite feature. Voice lives in an existing chat.",
      },
      {
        question: "Do voice notes get better reply rates?",
        answer:
          "Sometimes in warm threads because they stand out. In cold, they can also get you muted. Test on people who already replied once, not on a cold list.",
      },
      {
        question: "Should I transcribe it in the same bubble?",
        answer:
          "A one-line text plus optional audio is kinder than audio only. They might be in a meeting.",
      },
      {
        question: "Can automation send voice?",
        answer:
          "If a tool claims it can, that is a loud fingerprint. Do not.",
      },
    ],
    relatedSlugs: [
      "how-long-should-a-linkedin-cold-message-be",
      "when-to-send-first-linkedin-message-after-accept",
      "can-i-send-linkedin-messages-in-bulk",
    ],
  },
  {
    slug: "how-to-use-sales-navigator-boolean-search",
    question: "How do I use LinkedIn Sales Navigator Boolean search?",
    description:
      "Boolean lets you combine titles and keywords with AND, OR, and NOT. Use it to cut junk, not to write a novel of operators. Tight filters beat clever strings.",
    keywords: [
      "Sales Navigator Boolean search",
      "LinkedIn Boolean strings for sales",
      "AND OR NOT LinkedIn search",
    ],
    cluster: "inmail",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "In Navigator, keyword and title fields accept Boolean: quotes for exact phrases, OR for variants, NOT to exclude, parentheses to group. Example thinking: (\"head of sales\" OR \"vp sales\") NOT intern. LinkedIn's own help covers the operators. If a string errors, simplify it.",
      "Put spelling variants in the title field, not the whole ICP. Location, headcount, function, and seniority belong in filters. A 200-character poem of ORs is how you get professors, interns, and job seekers in the same list and cannot tell why.",
      "Start from the titles that already bought from you. Add OR for the two other ways they spell it. Add NOT for the titles that always waste a week. Save the search. Look at 20 profiles by hand before you trust it.",
      "Boolean will not raise result caps or invitation limits. It only changes who matches. A tighter string should mean fewer, better people, which is the point.",
      "If you do not have Navigator, you can still use simpler operators in consumer search. Do not expect the same depth. Paid search is the product for this job.",
    ],
    faqItems: [
      {
        question: "Should I put the whole ICP in one Boolean?",
        answer:
          "No. Use filters for location, headcount, function, and seniority. Use Boolean for title spelling variants. A giant string is how you get zero results and do not know why.",
      },
      {
        question: "Does consumer LinkedIn support the same Boolean?",
        answer:
          "Some of it, less cleanly. Navigator is the place this is worth learning.",
      },
      {
        question: "Can Boolean bypass the result cap?",
        answer:
          "No. It should reduce how many people match. See [the 1,000 result limit](/help/what-is-linkedin-1000-search-result-limit).",
      },
      {
        question: "Where do people go wrong?",
        answer:
          "They OR every synonym in the world and then wonder why interns and professors appear. Add NOT, or use seniority filters, or both.",
      },
    ],
    relatedSlugs: [
      "what-is-linkedin-1000-search-result-limit",
      "how-to-find-decision-makers-on-linkedin",
      "is-sales-navigator-worth-it-for-outbound",
    ],
  },
  {
    slug: "how-to-build-a-linkedin-prospecting-list",
    question: "How do I build a LinkedIn prospecting list?",
    description:
      "Start from ICP and a trigger, pull a slice you can work this week, and verify each profile. A 5,000-row dump is not a list. It is a postponement.",
    keywords: [
      "build LinkedIn prospecting list",
      "LinkedIn lead list",
      "how to make a prospect list",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Write the ICP in a sentence you would say to a teammate. Then pick one trigger for this week: hiring, a new leader, a post, a launch. Search that slice. Twenty to a hundred names you can actually message beat a TAM spreadsheet you never send.",
      "Open the profile. If the title matched but the person is in a different world, drop them. Lists rot when you skip this step to \"save time.\"",
      "Store enough to send: LinkedIn URL, title, company, the trigger in their words, and where you found them. That last field matters for GDPR stories later.",
      "Do not scrape. Do not buy a mystery CSV of \"LinkedIn users.\" Navigator saved lists, a careful sheet, or a tool that finds ICP-fit people are the paths that still leave you an account.",
      "Rebuild often. Last quarter's list is stale. Job changes and new hires are the point of LinkedIn. Omentir's lead finders are this job with less filter clicking, still from the same idea: ICP first, then names.",
    ],
    faqItems: [
      {
        question: "How big should week-one be?",
        answer:
          "Smaller than your weekly invite room. If you can send 40 thoughtful invites, do not build 2,000 names first. You will never clean them.",
      },
      {
        question: "Should I include personal emails?",
        answer:
          "Only from a source you can defend, and only if you will use email. Guessing Gmail from a name is how you get bounces and angry people.",
      },
      {
        question: "Can I reuse last year's event list?",
        answer:
          "Re-verify titles. Half of them moved. The ones who moved might be better, if you mention the new role.",
      },
      {
        question: "Is a competitor's customer list fair game?",
        answer:
          "Public job titles at a company are fair to find. Pretending you have their customer file is not. Stay with public facts.",
      },
    ],
    relatedSlugs: [
      "what-is-an-icp-for-b2b-sales",
      "what-buying-signals-to-use-before-linkedin-outreach",
      "should-i-target-accounts-or-contacts-first",
    ],
  },
  {
    slug: "should-i-target-accounts-or-contacts-first",
    question: "Should I target accounts or contacts first?",
    description:
      "Pick the company if the deal is big and political. Pick the person if the product is bought by one founder or one team lead. Most B2B motions need both, in that order.",
    keywords: [
      "account based vs contact based outbound",
      "ABM vs lead outbound LinkedIn",
      "target accounts or contacts",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Account-first means you choose companies that fit, then map who inside can champion and who can sign. That is right when several people have to agree, or when one logo is worth a month.",
      "Contact-first means you search titles across many companies. That is right when a single practitioner can buy, or when you are still guessing the ICP and need conversations.",
      "Doing contact-first into random logos produces meetings that cannot close. Doing account-first with no named human produces pretty account lists and no threads. Start with the constraint: who can say yes this quarter.",
      "On LinkedIn, account-first looks like Navigator account lists plus two or three people per company. Contact-first looks like a title search. Do not message six people at the same company with the identical note on the same day.",
      "If you are a solo founder, contact-first into a tight ICP is usually faster. Add account discipline when deals get bigger or when you keep \"winning\" chats with people who have no budget.",
    ],
    faqItems: [
      {
        question: "How many people per account?",
        answer:
          "Two or three is plenty at first: champion, economic buyer, maybe a practitioner. Ten parallel pitches is a raid.",
      },
      {
        question: "What if the champion and the buyer disagree?",
        answer:
          "That is a real deal. Keep both threads honest. Do not play them against each other in writing.",
      },
      {
        question: "Is ABM just account-first with a budget?",
        answer:
          "ABM usually means marketing and ads around those accounts too. You can still do account-first outbound without a full ABM program.",
      },
      {
        question: "Should the same sequence hit the whole account?",
        answer:
          "Same offer, different first lines by role. The CFO does not want the AE ramp story.",
      },
    ],
    relatedSlugs: [
      "how-to-build-a-linkedin-prospecting-list",
      "how-to-find-decision-makers-on-linkedin",
      "how-to-qualify-a-linkedin-lead",
    ],
  },
  {
    slug: "how-to-find-work-emails-from-linkedin",
    question: "How do I find work emails from LinkedIn?",
    description:
      "LinkedIn will not hand you a mailbox dump. Use a data provider you can explain, or ask after they reply. Guessing addresses from names burns domains.",
    keywords: [
      "find email from LinkedIn",
      "LinkedIn to email finder",
      "get work email from LinkedIn profile",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A LinkedIn profile is not an email directory. Some people list an address. Most do not. Hunter-style tools, enrichment APIs, and your CRM's waterfall are the usual next step. Pick vendors that verify, keep bounce rates low, and can talk about lawful source.",
      "Pattern guessing (first.last@company.com) without verification is how you hit catch-alls, traps, and spam folders. Verify before the first send.",
      "If they are already talking to you on LinkedIn, ask for the best email for a calendar invite. That address is better than any enricher.",
      "Do not harvest emails off profile pages with a scraper. That combines a LinkedIn ToS problem with a data-protection problem.",
      "Finding an email does not make the send legal everywhere. CAN-SPAM, GDPR, and CASL still apply to what you do with it. See [is cold outreach legal](/help/is-cold-outreach-legal-gdpr-can-spam).",
    ],
    faqItems: [
      {
        question: "Does Sales Navigator include emails?",
        answer:
          "Some packages and integrations add contact info. Do not assume every Navigator seat is a full email database. Read the plan.",
      },
      {
        question: "Are personal Gmail addresses OK?",
        answer:
          "For B2B, prefer work email. Personal Gmail is easier to mark as spam and messier under privacy law. See [can I cold email Gmail](/help/can-i-cold-email-gmail-addresses).",
      },
      {
        question: "What bounce rate means the source is bad?",
        answer:
          "If verification still leaves you over about 2 percent bounces, stop using that source. See [bounce rate](/help/what-is-a-good-cold-email-bounce-rate).",
      },
      {
        question: "Can I use the email on their company site contact page?",
        answer:
          "A published role inbox (sales@, press@) is a different thing than a personal work address. Role inboxes often ignore vendors. Use them with low hopes.",
      },
    ],
    relatedSlugs: [
      "is-it-ok-to-scrape-linkedin",
      "what-is-email-verification",
      "can-i-export-linkedin-search-results",
    ],
  },
  {
    slug: "is-it-ok-to-scrape-linkedin",
    question: "Is it OK to scrape LinkedIn?",
    description:
      "LinkedIn's user agreement restricts scraping and unauthorized bots. You can still lose the account, face a contract claim, and create a GDPR mess. Copying a few names by hand is research. A harvester is not.",
    keywords: [
      "is scraping LinkedIn legal",
      "LinkedIn scraping allowed",
      "can I scrape LinkedIn profiles",
    ],
    cluster: "rules",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "The user agreement restricts automated collection of data from the platform. LinkedIn has enforced that in court and with restrictions. The hiQ fight was about CFAA and public data. It did not make scrapers friendly, and later rulings still left contract claims on the table.",
      "A Chrome plugin that pages through search and dumps a CSV is scraping even if you click \"export\" yourself. So is a headless browser farm. So is buying a dump from someone who did that last night.",
      "Hand-copying 15 URLs for a campaign you will send this week is how sellers have always built lists. That is not the same category. If you need scale, use official products, partners, or a dataset whose source you can explain.",
      "EU personal data scraped without a lawful basis is a second problem on top of LinkedIn's rules. \"It was public\" is not a complete GDPR answer.",
      "If a vendor says \"we only use public data\" while they log in as you, they are using your session. You own that outcome.",
    ],
    faqItems: [
      {
        question: "What about tools that use official APIs?",
        answer:
          "Official APIs do not offer bulk personal-profile harvest for sales. If they claim \"the LinkedIn API\" for that, ask which product and which partnership.",
      },
      {
        question: "Can I scrape my own connections?",
        answer:
          "You can export your data from LinkedIn's settings. That is your archive. It is not a license to run a harvester on everyone else's graph.",
      },
      {
        question: "Is buying a scraped list safer?",
        answer:
          "Safer for the scraper, not for you. Bounces, complaints, and stale titles land in your domain and your campaigns.",
      },
      {
        question: "Does Omentir scrape LinkedIn?",
        answer:
          "Omentir is for finding ICP-fit buyers and sending from your connected account under limits you set. It is not a scrape-to-CSV product. Read how a given feature actually collects names before you turn it on.",
      },
    ],
    relatedSlugs: [
      "can-i-export-linkedin-search-results",
      "is-linkedin-automation-allowed",
      "is-cold-outreach-legal-gdpr-can-spam",
    ],
  },
  {
    slug: "what-is-linkedin-teamlink",
    question: "What is LinkedIn TeamLink?",
    description:
      "TeamLink shows how your colleagues connect you to a prospect in Sales Navigator. It is a path to a real intro, not a magic warm lead button.",
    keywords: [
      "LinkedIn TeamLink",
      "Sales Navigator TeamLink",
      "TeamLink intro",
    ],
    cluster: "inmail",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "On Navigator team seats, TeamLink can show that someone on your LinkedIn team is a 1st-degree connection of the person you are viewing. That is a possible warm path.",
      "Use it by asking your colleague for an intro, with a forwardable blurb, and with permission for them to say no. Do not InMail the prospect claiming you are close to their friend if your colleague has not talked to them in five years.",
      "TeamLink needs a team. A solo Navigator seat will not invent colleagues. Sharing logins to fake a team is against how seats work.",
      "It does not raise invite caps. It does not mark the prospect as inbound. It is a graph hint.",
      "If nobody on the team is connected, you are back to a cold reason. That is fine. Write the reason. Do not stare at an empty TeamLink panel as if the deal is dead.",
    ],
    faqItems: [
      {
        question: "Does the prospect see TeamLink?",
        answer:
          "They see a normal invite or intro from a person. They do not see your Navigator chrome.",
      },
      {
        question: "Can I automate TeamLink asks?",
        answer:
          "Do not spam your coworkers with 40 intro requests from a bot. Ask when the account is real.",
      },
      {
        question: "Is TeamLink in Premium Business?",
        answer:
          "It is a Navigator team feature, not a generic Premium perk. Check your edition.",
      },
      {
        question: "What if the colleague is in another country?",
        answer:
          "Still ask. Time zones make intros slower, not invalid.",
      },
    ],
    relatedSlugs: [
      "what-is-a-linkedin-2nd-degree-connection",
      "how-to-ask-for-a-referral-on-linkedin",
      "is-sales-navigator-worth-it-for-outbound",
    ],
  },
];

