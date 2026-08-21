import type { HelpPageDraft } from "./types";

const DATE = "August 19, 2026";

export const HELP_PAGES_N: HelpPageDraft[] = [
  {
    slug: "why-cant-i-connect-with-someone-on-linkedin",
    question: "Why can I not connect with someone on LinkedIn?",
    description:
      "The Connect button hides when you already invited them, they invited you, you hit a limit, they restrict invites, or LinkedIn is throttling the account. Check pending and the weekly pause first.",
    keywords: [
      "why can I not connect with someone on LinkedIn",
      "LinkedIn connect button missing",
      "cannot send LinkedIn connection request",
    ],
    cluster: "requests",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "If you already sent an invite, you cannot send another until they accept, ignore, or you withdraw. Check My Network, then Invitation manager, then Sent. A year-old pending invite still counts.",
      "If they already invited you, you accept or ignore. You do not send a second request the other way. If you are already connected, Connect is gone on purpose.",
      "LinkedIn also hides or blocks Connect when you are in an invitation limit, a restriction, or a checkpoint. That can look like a missing button or a generic error. See [what happens when you hit the invitation limit](/help/what-happens-when-i-hit-linkedin-invitation-limit).",
      "Some members make it harder for people they do not know to invite them. You will see Follow, a message path, or nothing useful. That is their setting, not a bug in your browser.",
      "Rare cases: you blocked them, they blocked you, the profile is locked, or you are looking at a company page. Company pages do not take personal connection requests. Follow the page or find a person.",
    ],
    faqItems: [
      {
        question: "Does following them let me connect later?",
        answer:
          "Follow does not queue a connection. You still need Connect to be available, or another path like InMail.",
      },
      {
        question: "Can a Sales Navigator seat bypass this?",
        answer:
          "Navigator helps you find people. It does not create a Connect button on a profile that will not take invites.",
      },
      {
        question: "I withdrew. Can I re-invite immediately?",
        answer:
          "Often not. LinkedIn has made people wait weeks before inviting the same person again. Do not treat withdraw as a refresh button.",
      },
      {
        question: "Is this the same as \"I don't know this person\"?",
        answer:
          "No. That is their response to an invite you already sent. See [what I don't know this person does](/help/what-does-i-dont-know-this-person-do-on-linkedin).",
      },
    ],
    relatedSlugs: [
      "how-to-withdraw-pending-linkedin-invitations",
      "what-happens-when-i-hit-linkedin-invitation-limit",
      "if-you-follow-someone-on-linkedin-can-you-message-them",
    ],
  },
  {
    slug: "if-you-follow-someone-on-linkedin-can-you-message-them",
    question: "If you follow someone on LinkedIn, can you message them?",
    description:
      "No. Follow is one-way. A normal DM still needs a first-degree connection, InMail, Open Profile, or another surface LinkedIn actually offers.",
    keywords: [
      "if you follow someone on LinkedIn can you message them",
      "does following on LinkedIn allow messages",
      "LinkedIn follow vs message",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Follow means you see more of their posts. It does not open a chat. Creators and people with Follow as the primary button collect followers who cannot DM them.",
      "To message, you still need one of the usual doors: they accept a connection, you spend InMail, they enabled Open Profile, or you share a group or event surface that still shows Message. Those doors change. Believe the button on their profile, not a Twitter thread.",
      "Following before you invite can be polite if they post and you have something to say. It is not a loophole. A follow plus an invite plus a like in the same minute is still a bot tell.",
      "If your own profile is in Creator Mode, visitors may Follow you instead of connecting. Then they cannot message you either, unless they use InMail or you connect anyway. That is the trade.",
      "For outbound, Follow is optional seasoning. The conversation is still connect or InMail. See [message without connecting](/help/how-to-message-someone-on-linkedin-without-connecting).",
    ],
    faqItems: [
      {
        question: "Can they message me because I followed them?",
        answer:
          "Only if a message path already exists the other way. Your follow does not grant them inbox access, and theirs does not grant you any.",
      },
      {
        question: "Is Follow better than Connect for executives?",
        answer:
          "Sometimes they turned Connect off. Follow plus a later InMail can be the only path. Do not spam Follow as a volume tactic.",
      },
      {
        question: "Does unfollowing notify them?",
        answer:
          "Usually not in a loud way. Do not build a strategy around that trivia.",
      },
      {
        question: "Should SDRs follow everyone they invite?",
        answer:
          "No. It adds noise to their notifications and yours. Follow the few you will actually read.",
      },
    ],
    relatedSlugs: [
      "how-to-message-someone-on-linkedin-without-connecting",
      "what-is-linkedin-creator-mode-for-sales",
      "what-is-linkedin-open-profile",
    ],
  },
  {
    slug: "something-unexpected-happened-please-try-again-linkedin",
    question: "What does \"Something unexpected happened. Please try again\" mean on LinkedIn?",
    description:
      "It is LinkedIn's generic failure. Often a stale session, a rate limit, a flaky extension, or a save that did not write. It is not a secret invite code.",
    keywords: [
      "something unexpected happened please try again LinkedIn",
      "LinkedIn unexpected error",
      "why is my save failing on LinkedIn",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "LinkedIn shows that line when the app does not want to name the real error. People see it on connect, message, save, search, and profile edits. Treat it as \"this action did not complete,\" not as a strategy signal.",
      "First pass: refresh, log out and in, try another browser without extensions, turn off the LinkedIn helper you installed last week. A lot of \"save failing\" reports are an extension fighting the page.",
      "Second pass: you may be throttled. Too many searches, views, invites, or message sends in a short window. Wait, use the product like a person, and stop retrying the same button every two seconds. Retries look worse than a pause.",
      "Third pass: the account is already in a restriction or checkpoint. Then the generic error is a mask. Open LinkedIn in a clean browser and see if a warning is sitting on the home feed.",
      "Do not buy a \"fix unexpected error\" script. If a tool is clicking Connect for you, the error is often LinkedIn rejecting the pattern. Slow the tool or send by hand. See [why accounts get restricted](/help/why-was-my-linkedin-account-restricted).",
    ],
    faqItems: [
      {
        question: "Why does save fail on a job or post?",
        answer:
          "Same generic wrapper. Session, extension, or a temporary outage. If it persists on a clean browser, wait. LinkedIn has outages.",
      },
      {
        question: "Does this mean I am banned?",
        answer:
          "Not by itself. A ban or restriction usually comes with a clearer notice. This line is used for boring failures too.",
      },
      {
        question: "Should I keep clicking until it works?",
        answer:
          "No. Clicking Connect 15 times is how you turn a glitch into a limit.",
      },
      {
        question: "Can Omentir clear the error?",
        answer:
          "No. It is LinkedIn's UI. If our send fails, check the connected session and try later. We cannot override their error page.",
      },
    ],
    relatedSlugs: [
      "why-was-my-linkedin-account-restricted",
      "why-cant-i-connect-with-someone-on-linkedin",
      "linkedin-commercial-search-limit",
    ],
  },
  {
    slug: "how-to-write-linkedin-about-section-for-outbound",
    question: "How should I write a LinkedIn About section for SDR or BDR outbound?",
    description:
      "Write it for the person who just got your invite. First person, who you help, proof after the problem. Skip the mission poem.",
    keywords: [
      "LinkedIn About section best practices for SDR BDR outreach",
      "LinkedIn summary for outbound sales",
      "SDR LinkedIn About section",
    ],
    cluster: "profile",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "About is the second page of the invite. They already saw the photo and headline. If About is a wall of adjectives, they bounce. If it names their job and a problem they have, they stay long enough to accept.",
      "A working shape: one sentence on who you help, two sentences on the problem in their language, one proof (a number, a logo, a before/after they can believe), then how to talk to you. First person. Short paragraphs.",
      "Do not paste the company About. Do not start with \"passionate about connecting people.\" Do not hide the sales job. They know. Pretending you are a journalist makes the first DM worse.",
      "SDRs who sell for a named product should say that. \"I work with {company} on {problem} for {role}\" is clearer than a personal brand that does not match the email domain.",
      "Rewrite when the ICP changes, not every Friday. Pair it with a headline that matches. The rest of the profile notes are in [optimize your profile for outbound](/help/how-to-optimize-linkedin-profile-for-outbound).",
    ],
    faqItems: [
      {
        question: "How long should About be?",
        answer:
          "Long enough to scan on a phone, short enough that they do not need a heading structure. A few short blocks beat one essay.",
      },
      {
        question: "Should I put a Calendly link in About?",
        answer:
          "You can put a link lower down. Do not make the first line a booking page. The invite already feels like a pitch.",
      },
      {
        question: "Do keywords for LinkedIn search matter here?",
        answer:
          "A little. Stuffing \"SDR BDR AE closer hunter\" reads as a resume hack. Write for the buyer first.",
      },
      {
        question: "Can I use the same About as my email signature story?",
        answer:
          "If it is still true and still short. Signature poems that thank the reader for their time do not belong on LinkedIn.",
      },
    ],
    relatedSlugs: [
      "how-to-optimize-linkedin-profile-for-outbound",
      "what-should-a-linkedin-headline-say-for-sales",
      "should-i-use-a-logo-as-linkedin-photo",
    ],
  },
  {
    slug: "linkedin-inmail-best-practices",
    question: "What are LinkedIn InMail best practices?",
    description:
      "Spend the credit on a trigger and a title that can buy. Short subject, short body, one ask. Track it like paid media, not like free DMs.",
    keywords: [
      "LinkedIn InMail best practices",
      "InMail LinkedIn tips",
      "LinkedIn InMail strategy",
    ],
    cluster: "inmail",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "InMail is a paid message to someone who is not a first-degree connection. Treat each credit as scarce. A good one names something specific, asks a small question, and does not attach a deck. A bad one is your sequence step one with a subject line glued on.",
      "Subject: a few words, true after they open. Body: a few sentences. LinkedIn has said shorter InMails get more response than long ones. Believe that. The subject notes are in [how to write an InMail subject](/help/how-to-write-a-linkedin-inmail-subject-line).",
      "Send when you have a reason today: a hire, a post, a tool they use, a role that just opened. Do not InMail because you are out of invites for the week. That is how credits vanish.",
      "If they reply, you often get the credit back. If they ignore you, you paid to learn. Do not send a three-step InMail follow-up campaign to the same person. One InMail, maybe one later if the trigger changed, then stop.",
      "The longer version with examples lives in [the complete guide to LinkedIn InMail](/blogs/the-complete-guide-to-linkedin-inmail-best-practices). Help pages nearby cover [credits](/help/how-many-inmail-credits-does-sales-navigator-give) and [reply rates](/help/what-is-a-good-inmail-response-rate).",
    ],
    faqItems: [
      {
        question: "Should I mention Sales Navigator in the InMail?",
        answer:
          "No. They do not care which search product you pay for.",
      },
      {
        question: "Is InMail better than a connection request?",
        answer:
          "For people who will not accept, or executives who treat invites as noise, sometimes. For everyone else, a cheap invite plus a DM is the default.",
      },
      {
        question: "Can I use the same template I use on email?",
        answer:
          "Only if you cut it. InMail is not a place to paste 180 words.",
      },
      {
        question: "When should I skip InMail entirely?",
        answer:
          "When Open Profile already gives you Message, or when they would accept a normal invite. Do not spend a credit on a door that is already open.",
      },
    ],
    relatedSlugs: [
      "what-is-linkedin-inmail",
      "how-to-write-a-linkedin-inmail-subject-line",
      "how-do-i-get-more-inmail-credits",
    ],
  },
  {
    slug: "how-do-i-get-more-inmail-credits",
    question: "How do I get more InMail credits?",
    description:
      "Buy a higher plan, wait for the monthly allotment, or earn refunds when people reply. There is no honest hack that prints free credits.",
    keywords: [
      "how do I get more InMail credits",
      "buy more LinkedIn InMail credits",
      "InMail credit refund",
    ],
    cluster: "inmail",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Credits come with Premium, Sales Navigator, or Recruiter, on a monthly pile that can roll over up to a cap. Sales Navigator Core is commonly 50 a month. Premium Business is smaller. Check the plan you actually pay for.",
      "The only regular way to stretch the pile is replies. If they respond inside LinkedIn's window (often about 90 days), the credit can come back. That is an argument for writing InMails people answer, not for sending more junk.",
      "Some plans let you purchase extra credits. LinkedIn's own checkout is the path. Random sites selling \"InMail packs\" attached to someone else's seat are a good way to lose the account.",
      "You cannot convert unused invites into InMail. You cannot farm Open Profile and call it credits. You cannot get a restriction lifted by buying more InMail.",
      "If you are out of credits every week, the problem is targeting, not the allotment. Put most outbound on invites and DMs. Save InMail for names that are worth a dollar figure you can feel. See [do credits come back](/help/do-inmail-credits-come-back-if-someone-replies).",
    ],
    faqItems: [
      {
        question: "Does LinkedIn Premium Career give enough InMail for outbound?",
        answer:
          "Usually no. It is a job-seeker pile. Outbound teams buy Navigator or accept that InMail is rare.",
      },
      {
        question: "Can my teammate send me credits?",
        answer:
          "Team Navigator can have admin allocation. Ask whoever owns billing. Do not share logins to steal credits.",
      },
      {
        question: "If they accept a connection after my InMail, do I get the credit back?",
        answer:
          "Refunds are about replies to the InMail, not about later connecting. Read the current LinkedIn help for your product.",
      },
      {
        question: "Should I switch to email when credits run out?",
        answer:
          "If you have a verified work address and a domain you trust, yes. Do not guess emails in a panic. See [LinkedIn vs cold email](/help/linkedin-vs-cold-email-for-b2b-outreach).",
      },
    ],
    relatedSlugs: [
      "how-many-inmail-credits-does-sales-navigator-give",
      "do-inmail-credits-come-back-if-someone-replies",
      "linkedin-premium-vs-sales-navigator",
    ],
  },
  {
    slug: "linkedin-cold-message-templates",
    question: "What are good LinkedIn cold message templates for B2B?",
    description:
      "Keep two or three sentences and one question. Swap in a fact that is actually true. Templates without a trigger are just polished spam.",
    keywords: [
      "LinkedIn cold message template",
      "LinkedIn message templates for sales",
      "best LinkedIn cold templates",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A template is a skeleton. The first line still has to be unique or the whole thing is a mail merge. If you cannot fill the blank with a real hire, post, or stack, do not send that row.",
      "After accept, something like: \"Saw you just hired two AEs. We help new teams get first conversations on LinkedIn without standing up a sequencer. Worth a 15-minute compare notes, or should I leave you alone?\" Cut our product if it does not fit. Keep the question.",
      "If they have not accepted yet, do not paste that into the invite. The invite note is shorter and less salesy, or it is blank. After they accept, wait at least a day.",
      "Follow-up skeleton: one new fact, one smaller ask. \"Noticed the AE roles are still up. Curious if outbound is even on the list this quarter. If not, I'll close the thread.\" Then actually close it.",
      "Length: two or three sentences. No Calendly in message one. No \"hope you're doing well.\" More on length sits in [how long a cold message should be](/help/how-long-should-a-linkedin-cold-message-be).",
    ],
    faqItems: [
      {
        question: "Can I use ChatGPT to fill the blank?",
        answer:
          "You can draft. You still have to check the fact. Invented posts are worse than a boring template. See [using ChatGPT for LinkedIn messages](/help/can-i-use-chatgpt-to-write-linkedin-messages).",
      },
      {
        question: "Should the template mention their company name?",
        answer:
          "If you have nothing else, a company name is hygiene, not personalization. Pair it with a reason.",
      },
      {
        question: "Do voice notes replace templates?",
        answer:
          "A short voice note can work after they accept and you have something specific to say. It is not a volume channel. See [voice messages](/help/how-to-send-a-linkedin-voice-message).",
      },
      {
        question: "Can I send the same template on email?",
        answer:
          "Shorten it again and fix the greeting. LinkedIn is not email. People read it in a thinner pane.",
      },
    ],
    relatedSlugs: [
      "how-long-should-a-linkedin-cold-message-be",
      "how-to-personalize-linkedin-outreach",
      "how-to-write-a-linkedin-connection-request",
    ],
  },
  {
    slug: "what-is-autonomous-prospecting",
    question: "What is autonomous prospecting?",
    description:
      "It is a marketing phrase for software that finds people and contacts them with little clicking. The account, the copy, and the restriction still belong to you.",
    keywords: [
      "what is autonomous prospecting",
      "autonomous pipeline generation",
      "AI autonomous outbound",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Vendors use \"autonomous\" to mean the tool picks leads, writes mail, and sends while you sleep. Sometimes that is a LinkedIn session. Sometimes it is email. Sometimes it is a phone agent. The word does not change LinkedIn's user agreement.",
      "What still fails: a vague ICP, identical first lines, unofficial automation at high volume, and nobody reading replies. Autonomy does not fix a product nobody wants. It only sends the bad version faster.",
      "A saner version is assisted prospecting. You define the buyer. The tool finds ICP-fit people and drafts. You keep a daily cap. A human still owns weird replies. That is closer to how Omentir is built: send as you, with limits you can see.",
      "Fully hands-off LinkedIn is the version that gets people restricted and then surprised. If Overview cannot show you who was contacted yesterday in your own voice, you are renting a black box.",
      "If you want meetings, measure meetings, not how few minutes you spent in the product. A self-driving sequencer with a 0.2 percent reply rate is still a toy.",
    ],
    faqItems: [
      {
        question: "Is this the same as an AI SDR?",
        answer:
          "Often the same pitch in a different box. Ask what channel it touches and whose identity it uses.",
      },
      {
        question: "Can it book demos without me?",
        answer:
          "It can put a calendar link in a message. Buyers still decide. Someone still has to show up and sell.",
      },
      {
        question: "Does autonomous mean no warmup?",
        answer:
          "If the vendor says that for a new LinkedIn seat, they are selling speed over the account. See [warmup for automation](/help/how-to-warm-up-a-linkedin-account-for-automation).",
      },
      {
        question: "Is email autonomy safer than LinkedIn autonomy?",
        answer:
          "Different risk: domains vs profile. Both can get you hated. Neither is \"set and forget\" if you care about the brand.",
      },
    ],
    relatedSlugs: [
      "is-linkedin-automation-allowed",
      "how-to-build-a-linkedin-prospecting-list",
      "how-to-qualify-b2b-leads-with-ai",
    ],
  },
  {
    slug: "how-to-turn-linkedin-into-a-revenue-channel",
    question: "How do I turn LinkedIn into a revenue channel?",
    description:
      "Treat it as a pipeline with a cap: ICP, profile, conservative invites, DMs that ask for a meeting, and a CRM. Posts can help. They are not the channel by themselves.",
    keywords: [
      "how to turn LinkedIn into a revenue channel",
      "LinkedIn as a sales channel",
      "make LinkedIn produce pipeline",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Revenue on LinkedIn is meetings that close, not impressions. Pick one ICP. Finish the profile so a stranger can accept you. Send a volume you can defend if LinkedIn asks. Message people who accept. Book or learn. Put the names in a CRM so they do not live in your head.",
      "Content can warm a market. It does not replace the list. A founder who posts and never invites is running a brand bet. A seller who invites and never posts can still book, if the profile is not empty.",
      "Count the funnel in public: invites, accepts, replies, meetings, revenue. If accepts are fine and meetings are not, the DM is the leak. If invites are huge and accepts are poor, the list or the profile is the leak. Do not buy a new tool until you know which.",
      "Keep email as a second channel only when the address is verified and you will not stack both on the same morning. LinkedIn has a ceiling. That ceiling is why it can stay a clean channel instead of a spam cannon.",
      "Omentir is built for that capped loop: find people who fit, draft, send as you. It will not turn a dead offer into ARR. The measurement version is [how to measure LinkedIn outreach ROI](/help/how-to-measure-linkedin-outreach-roi).",
    ],
    faqItems: [
      {
        question: "How long until LinkedIn pays for itself?",
        answer:
          "Enough conversations to see a meeting rate, then enough meetings to see close rate. That is weeks to a couple of months for most small teams, not a weekend.",
      },
      {
        question: "Do I need a company page?",
        answer:
          "Not to start. People accept people. Build the page when you have something worth showing.",
      },
      {
        question: "Should marketing own LinkedIn and sales own DMs?",
        answer:
          "Split if you must. The profile the buyer sees should still match the DM. Mixed stories kill accepts.",
      },
      {
        question: "Is SSI the score for revenue?",
        answer:
          "No. SSI is LinkedIn's habit score. Meetings and closed revenue are yours. See [what is SSI](/help/what-is-linkedin-ssi).",
      },
    ],
    relatedSlugs: [
      "how-to-measure-linkedin-outreach-roi",
      "how-to-book-a-meeting-from-a-linkedin-message",
      "what-is-a-good-outbound-meeting-booked-rate",
    ],
  },
  {
    slug: "how-to-qualify-b2b-leads-with-ai",
    question: "How do I use AI for B2B lead qualification?",
    description:
      "Let a model score fit from the profile and your ICP. Do not let it mark someone sales-qualified because the sentiment was polite. You still need their problem in their words.",
    keywords: [
      "AI lead qualification",
      "lead qualification AI",
      "AI qualify B2B leads LinkedIn",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "AI is decent at \"does this title and company look like the ICP?\" It is weak at budget, timing, and whether they already bought a rival last month unless you gave it that evidence. Use it as a pre-filter on the list, not as a closer.",
      "Feed it the same ICP sentence a human would use. If the prompt is \"find anyone in sales,\" you will get anyone in sales. Bad prompts scale bad targeting.",
      "A high fit score is permission to invite, not permission to log an SQL. A cheerful \"sounds interesting\" is not budget. Keep the human bar from [how to qualify a LinkedIn lead](/help/how-to-qualify-a-linkedin-lead).",
      "Watch for the model inventing pain. If the About section never mentioned churn and the pitch opens with \"I saw you're struggling with churn,\" you trained a liar. Ground every claim in a field you can point at.",
      "Omentir scores leads against My Product. You still decide who gets a conversation. Auto-enrolling every high score into a five-step pitch is how you recreate a bad sequencer with nicer copy.",
    ],
    faqItems: [
      {
        question: "Can AI replace BANT questions?",
        answer:
          "It can remind you to ask them. It cannot hear the answer from a profile scrape.",
      },
      {
        question: "Should I auto-skip low scores?",
        answer:
          "Yes for obvious misses (wrong country, wrong industry). Spot-check the cutoff. Models drop weird but real buyers.",
      },
      {
        question: "Is a chatbot on my site the same as outbound qualification?",
        answer:
          "No. That person arrived. Outbound AI is guessing from public pages. Different evidence, different confidence.",
      },
      {
        question: "Does AI qualification help GDPR?",
        answer:
          "No. Scoring a profile does not create a lawful basis to email them. See [GDPR and CAN-SPAM](/help/is-cold-outreach-legal-gdpr-can-spam).",
      },
    ],
    relatedSlugs: [
      "how-to-qualify-a-linkedin-lead",
      "what-is-an-icp-for-b2b-sales",
      "can-i-use-chatgpt-to-write-linkedin-messages",
    ],
  },
  {
    slug: "how-do-i-connect-grok-bot-to-omentir",
    question: "How do I connect Grok Bot to Omentir?",
    description:
      "Install Grok Bot, add Omentir's MCP URL under Settings then Plugins, and approve Connect workspace. Do not sign LinkedIn into the Bot's cloud computer.",
    keywords: [
      "connect Grok Bot to Omentir",
      "Grok Bot MCP Omentir",
      "Grok Bot LinkedIn plugin",
    ],
    cluster: "rules",
    publishedDate: "August 20, 2026",
    updatedDate: "August 20, 2026",
    paragraphs: [
      "Grok Bot is the new SpaceXAI teammate app, not grok.com chat. You need SuperGrok Heavy, Cursor Ultra, or Cursor Teams Premium, plus the desktop app on macOS or Windows, or iOS. Finish Omentir first: LinkedIn connected, My Product filled.",
      "In Grok Bot, open Settings, then Plugins. Add a custom MCP server at https://omentir.com/api/agent/v1/mcp. Sign in on Omentir when the browser opens and choose Connect workspace. If your Cursor team uses an MCP allowlist, add that URL there too. MCP sign-in is shared with Cursor.",
      "If the plugin UI has no sign-in and wants a header, create a key on the Omentir API page and send Authorization Bearer. Store it in the client's secret store. Do not paste it into a Bot group chat.",
      "When the Bot asks you to take over the computer for a LinkedIn password, passkey, two-factor code, or CAPTCHA, refuse. LinkedIn stays inside Omentir. Every Bot on your account shares that cloud computer, so a LinkedIn session there is shared too.",
      "Ask the Bot for Omentir context and a list of agents before you let it create anything. Setup details: [Grok Bot integration](/integrations/grok-bot).",
    ],
    faqItems: [
      {
        question: "Is this the same as adding Grok in grok.com Settings?",
        answer:
          "No. grok.com chat is the [Grok integration](/integrations/grok). Grok Bot is a separate app with Plugins and a cloud computer.",
      },
      {
        question: "Do I need Linux?",
        answer:
          "SpaceXAI's get-started docs say Grok Bot is not currently a Linux desktop app. Use macOS, Windows, or iOS.",
      },
      {
        question: "The plugin shows no tools.",
        answer:
          "Turn the connector on in that Bot or conversation. Sign in on omentir.com first, then retry. If your plan has no API access, the approval step fails.",
      },
      {
        question: "Can I skip MCP and let the Bot click around Omentir in a browser?",
        answer:
          "You can. You should not. MCP is the contract. A browser session on the shared computer is a mess to audit and easy to over-permission.",
      },
    ],
    relatedSlugs: [
      "can-i-use-grok-bot-for-linkedin-outreach",
      "is-linkedin-automation-allowed",
      "how-to-prevent-linkedin-from-looking-like-a-bot",
    ],
  },
  {
    slug: "can-i-use-grok-bot-for-linkedin-outreach",
    question: "Can I use Grok Bot for LinkedIn outreach?",
    description:
      "Yes as an operator that researches and drafts through Omentir. No as a cloud browser that logs into LinkedIn and clicks Connect while you sleep.",
    keywords: [
      "Grok Bot LinkedIn outreach",
      "Grok Bot for LinkedIn outreach",
      "Grok Bot cold LinkedIn",
    ],
    cluster: "targeting",
    publishedDate: "August 20, 2026",
    updatedDate: "August 20, 2026",
    paragraphs: [
      "SpaceXAI ships a Sales Outbound example for Grok Bot: research accounts, score contacts, draft email and LinkedIn, leave a review list. Their own starter prompt says do not send and do not enroll anyone. Believe that sentence.",
      "The useful split is: Grok Bot works overnight on research and copy. Omentir holds the LinkedIn account, daily limits, send windows, and reply drafts. You read the list in the morning. Meetings still need a person on the call.",
      "Letting the Bot sign into LinkedIn on its computer looks like the automation LinkedIn already fights. Logins on that computer are shared across your Bots. A restriction lands on your profile, not on SpaceXAI.",
      "Give the Bot a written ICP, a stop rule, and one source. \"Find me pipeline\" produces a wide, noisy list. After the drafts look like you, start a small Omentir campaign. If accepts drop, tighten targeting. Do not raise volume.",
      "Grok Bot is in beta and sits on paid Cursor or SuperGrok plans. If you do not already have it, run outbound from Omentir Overview. The Bot is an extra operator, not a requirement. Longer walkthrough: [Grok Bot for LinkedIn outreach](/blogs/grok-bot-linkedin-sales).",
    ],
    faqItems: [
      {
        question: "Can it send without me?",
        answer:
          "Not if you keep send behind review, which you should. Omentir still enforces caps. It does not enforce taste. A Bot you never read will still enqueue junk if you told it to.",
      },
      {
        question: "Is this allowed by LinkedIn?",
        answer:
          "Writing with a model is not the same as a VM clicking the site. The send path still has to look like you. See [is LinkedIn automation allowed](/help/is-linkedin-automation-allowed).",
      },
      {
        question: "Should I also connect grok.com chat?",
        answer:
          "Pick one operator you will actually watch. Two Grok products plus Claude is how review lists die unread.",
      },
      {
        question: "What should the first job be?",
        answer:
          "Twenty to forty people, one ICP, drafts only. See [get LinkedIn sales with Grok Bot](/use-cases/grok-bot-outbound).",
      },
    ],
    relatedSlugs: [
      "how-do-i-connect-grok-bot-to-omentir",
      "can-i-use-chatgpt-to-write-linkedin-messages",
      "is-linkedin-automation-allowed",
    ],
  },
];
