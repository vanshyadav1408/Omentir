import type { HelpPageDraft } from "./types";

const DATE = "August 19, 2026";

export const HELP_PAGES_D: HelpPageDraft[] = [
  {
    slug: "what-is-linkedin-inmail",
    question: "What is LinkedIn InMail and when should I use it?",
    description:
      "InMail is LinkedIn's paid message to people you are not connected with. Use it for a few high-value names with a real trigger, not as a replacement for a bad invite list.",
    keywords: [
      "what is LinkedIn InMail",
      "when to use InMail",
      "InMail vs connection request",
    ],
    cluster: "inmail",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "InMail lets you message someone who is not a first-degree connection, using credits that come with Premium, Sales Navigator, or Recruiter. It has a subject line and a body. It is not a magic inbox. People still ignore weak ones, and they can mark them as spam.",
      "Use InMail when the person is worth a credit: a target account, a clear trigger, and a title that can buy or champion. Do not use it because you hit the weekly invite cap and you are bored. That is how credits disappear.",
      "A connection request is cheaper and, if they accept, opens a free DM thread. InMail is for people who will not accept, people you should not invite (executives who treat invites as noise), or people with Open Profile already handled as a free message.",
      "Write it like a short email. Subject under a line. Body under a few sentences. One ask that is not \"book 30 minutes.\" LinkedIn has published that shorter InMails get better response than long ones. Believe the UI: they gave you less room than a novel.",
      "If they reply, you often get the credit back (plan rules differ slightly). If they do not, you paid to learn the message was skippable. Track InMail like paid media, not like unlimited DMs. The longer guide is [LinkedIn InMail best practices](/blogs/the-complete-guide-to-linkedin-inmail-best-practices).",
    ],
    faqItems: [
      {
        question: "Does InMail skip the weekly invite limit?",
        answer:
          "It spends a different budget. It does not reset invitation limits. You can still get restricted for spammy InMail.",
      },
      {
        question: "Should the subject be all lowercase?",
        answer:
          "Write a subject a human would write. Stunts are optional. Clarity is not. Name the trigger if it fits.",
      },
      {
        question: "Can I InMail a 1st-degree connection?",
        answer:
          "You already have DM. Do not waste a credit there.",
      },
      {
        question: "Is Sponsored InMail the same thing?",
        answer:
          "No. That is an ad product. Recipients can smell it. 1:1 InMail is a credit from your seat.",
      },
    ],
    relatedSlugs: [
      "how-many-inmail-credits-does-sales-navigator-give",
      "do-inmail-credits-come-back-if-someone-replies",
      "how-to-message-someone-on-linkedin-without-connecting",
    ],
  },
  {
    slug: "how-many-inmail-credits-does-sales-navigator-give",
    question: "How many InMail credits do I get with Sales Navigator?",
    description:
      "Sales Navigator Core includes 50 InMail credits per month. Unused credits can roll over up to a cap. Premium Business includes fewer. Check your plan page, because seats differ.",
    keywords: [
      "Sales Navigator InMail credits",
      "how many InMails per month",
      "LinkedIn Premium InMail credits",
    ],
    cluster: "inmail",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "LinkedIn's published Sales Navigator Core allotment is 50 InMail credits per month. Unused credits can roll over for up to three months, with a maximum balance often cited at 150. If the recipient replies within the window LinkedIn names (commonly 90 days), the credit can come back.",
      "Premium Business is a different pile, commonly 15 credits a month. Premium Career is smaller still. Recruiter plans are a third family. Do not mix those numbers in a spreadsheet and call it one budget.",
      "Team seats can have admin-level sharing rules. If you share a Navigator team, ask how credits are allocated before you assume you personally own 50.",
      "Fifty credits is not 50 meetings. Treat them as expensive. A 10 percent reply rate on well-chosen InMails is 5 conversations, not a pipeline miracle. The rest of outbound should still be invites and DMs to people you can connect with.",
      "If you never use the credits, you are paying for search and lists, which may still be worth it. If you blow them on a generic template in week one, you paid for a lesson. See [is Sales Navigator worth it for outbound](/help/is-sales-navigator-worth-it-for-outbound).",
    ],
    faqItems: [
      {
        question: "Do unused credits last forever?",
        answer:
          "No. Navigator unused credits roll for a limited time and then stop stacking. Use them on purpose or lose them.",
      },
      {
        question: "Can I buy extra InMails?",
        answer:
          "LinkedIn has sold extra credits in some plans. It is still a poor substitute for a better list. Read the current plan page before you assume you can top up.",
      },
      {
        question: "Do Open Profile messages spend these credits?",
        answer:
          "No. That is the point of Open Profile. You still have a send cap on those messages.",
      },
      {
        question: "Does a declined InMail refund the credit?",
        answer:
          "A reply is the usual refund trigger. A decline or ignore may not return it. Plan as if ignore burns the credit.",
      },
    ],
    relatedSlugs: [
      "do-inmail-credits-come-back-if-someone-replies",
      "what-is-linkedin-inmail",
      "linkedin-premium-vs-sales-navigator",
    ],
  },
  {
    slug: "do-inmail-credits-come-back-if-someone-replies",
    question: "Do I get InMail credits back if someone replies?",
    description:
      "Usually yes, if they reply within LinkedIn's window, often 90 days on Sales Navigator. Ignore typically keeps the credit spent. Read the rule on your exact plan.",
    keywords: [
      "InMail credit refund",
      "InMail credit back on reply",
      "Sales Navigator InMail credit return",
    ],
    cluster: "inmail",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "LinkedIn's Sales Navigator help has long said that if the recipient replies within 90 days, you get the credit back. Premium help has used similar language around the recipient accepting or replying, depending on the plan page you read. This is one of the few InMail rules that is actually documented.",
      "An auto-reply or an out-of-office can sometimes count. Do not build a strategy on tricking that. A real reply is the point.",
      "No reply means the credit stays spent. That is why InMail is closer to paid media than to free DMs. You are betting a credit that the message is worth answering.",
      "Credits that return are not extra volume for spam. They let you try again on a different person. If you recycle refunds into the same bad template, you will just spend them again.",
      "If your admin dashboard disagrees with the public help article, trust the dashboard and the contract. LinkedIn changes packaging. This help page is not a billing guarantee.",
    ],
    faqItems: [
      {
        question: "What if they reply after 90 days?",
        answer:
          "Treat the credit as gone. A late reply is still a conversation. It may not restore the allotment.",
      },
      {
        question: "Does \"thanks, not interested\" refund it?",
        answer:
          "A reply is a reply in most descriptions of the policy. You should still honor the no. Do not keep the sequence running to farm refunds. That is a good way to get marked as spam and lose the seat.",
      },
      {
        question: "Can I InMail the same person twice if the first credit refunded?",
        answer:
          "You can. You rarely should. They already told you something, even if it was silence the first time and a no the second.",
      },
      {
        question: "Do connection request accepts refund anything?",
        answer:
          "Invites do not use InMail credits. There is nothing to refund. Accepts just open the free inbox.",
      },
    ],
    relatedSlugs: [
      "how-many-inmail-credits-does-sales-navigator-give",
      "what-is-linkedin-inmail",
      "what-is-a-good-linkedin-reply-rate",
    ],
  },
  {
    slug: "is-sales-navigator-worth-it-for-outbound",
    question: "Is Sales Navigator worth it for outbound?",
    description:
      "Worth it if you live in lead and account search every day. Not worth it if you only wanted extra invites. Navigator does not raise the connection request cap.",
    keywords: [
      "is Sales Navigator worth it",
      "Sales Navigator for outbound",
      "Sales Navigator vs free LinkedIn",
    ],
    cluster: "inmail",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Sales Navigator is LinkedIn's paid search and alerting product for sellers: saved leads, account lists, better filters, InMail credits, and a workspace that is not the consumer feed. You buy it to find people, not to send unlimited invites. Invitation limits still follow the account.",
      "It is worth the seat if you prospect daily, your ICP is specific, and you will actually use saved searches and alerts. It is a poor buy if you wanted a magic send button, or if your list already lives in a database you trust.",
      "The commercial use limit on free search is a real reason to upgrade for heavy prospectors. If you hit that wall every month, Navigator is the official way to keep searching like a seller.",
      "Team Navigator makes sense when several people share an account list and you need admin. A founder sending 10 invites a day from a complete personal profile may not need it yet. Buy it when search is the bottleneck, not when copy is the bottleneck.",
      "Omentir is not a Navigator replacement. We find ICP-fit buyers and run outreach from your profile. Some teams use both: Navigator for deep account work, Omentir for the send-and-reply loop. Some teams pick one. Match the bottleneck.",
    ],
    faqItems: [
      {
        question: "Will Navigator stop my account from getting restricted?",
        answer:
          "No. LinkedIn can still restrict invitations, InMail, and search on paid seats. Paid can make support slightly easier to reach. It does not bless spam.",
      },
      {
        question: "Is the free trial enough to decide?",
        answer:
          "Use the trial to build two saved searches you would actually run every week. If you do not open them, you will not open them when the card is charged.",
      },
      {
        question: "Can I share one Navigator login across the team?",
        answer:
          "That violates how seats work and looks like unusual activity. Buy seats or do not share.",
      },
      {
        question: "Does Navigator include extra connection notes?",
        answer:
          "You are on a paid LinkedIn identity, so notes are less rationed than on some free accounts. That is still not extra weekly invites.",
      },
    ],
    relatedSlugs: [
      "linkedin-premium-vs-sales-navigator",
      "linkedin-commercial-search-limit",
      "how-to-find-decision-makers-on-linkedin",
    ],
  },
  {
    slug: "linkedin-premium-vs-sales-navigator",
    question: "What is the difference between LinkedIn Premium and Sales Navigator?",
    description:
      "Premium is a broader paid LinkedIn membership. Sales Navigator is the sales search and InMail workspace. They are not the same seat, and InMail credits do not move between them.",
    keywords: [
      "LinkedIn Premium vs Sales Navigator",
      "difference Premium Business Sales Navigator",
      "which LinkedIn paid plan for sales",
    ],
    cluster: "inmail",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Premium Career is for job seekers. Premium Business is for general professional use: more profile insights, a modest InMail pile, and fewer consumer-search frustrations. Sales Navigator is built around lead and account search, saved lists, alerts, and a larger InMail allotment on Core.",
      "If your job is outbound to accounts, Navigator is the plan that matches the job. If you wanted to see who viewed your profile and send a few InMails a month, Premium Business may be enough. Buying both without a reason just splits credits into two wallets that do not share.",
      "Neither plan deletes invitation limits, commercial-use behavior on the consumer graph, or the 30,000 connection cap. You are renting search and messaging features, not a new identity.",
      "Recruiter is a fourth path for hiring. Do not prospect out of Recruiter InMails as a sales hack. The product and the recipients expect hiring context.",
      "Pick one primary paid product, use it for 30 days like you mean it, and cancel if the saved searches sit idle. A unused Navigator tab is an expensive RSS reader.",
    ],
    faqItems: [
      {
        question: "Can I use Premium InMails inside Navigator?",
        answer:
          "They are separate credit pools. LinkedIn has said they do not transfer. Check your current billing UI rather than a 2022 blog.",
      },
      {
        question: "Which one raises SSI faster?",
        answer:
          "Navigator makes the \"find people\" pillar easier to feed. SSI still follows activity. The paid badge is not a score multiplier by itself.",
      },
      {
        question: "Is Premium enough for Open Profile?",
        answer:
          "Open Profile is a Premium-side feature for people who enable it. Navigator is not required for that. You still cannot force prospects to enable it.",
      },
      {
        question: "Should a five-person sales team all buy Premium Business?",
        answer:
          "If they prospect all day, look at Navigator seats. If they mostly run existing relationships, they may not need either.",
      },
    ],
    relatedSlugs: [
      "is-sales-navigator-worth-it-for-outbound",
      "what-is-linkedin-open-profile",
      "how-many-inmail-credits-does-sales-navigator-give",
    ],
  },
  {
    slug: "how-to-find-decision-makers-on-linkedin",
    question: "How do I find decision makers on LinkedIn?",
    description:
      "Search by title, company size, and geography, then verify they own the problem you solve. A VP in the wrong function is not a decision maker for you.",
    keywords: [
      "find decision makers on LinkedIn",
      "LinkedIn prospecting decision maker",
      "who to contact on LinkedIn for B2B",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Decision maker means they can say yes, or they can get you to the person who can. For a $49 tool that might be a founder. For a six-figure rollout that might be a VP plus procurement. Start from the job you change, not from \"C-level looks impressive.\"",
      "On LinkedIn, combine title, function, seniority, company headcount, and location. Then open the profile. If their About and posts are about a different world than your product, skip them even if the title matched.",
      "Buying committees are real. A champion in ops plus a budget holder in finance is a common pair. Messaging only the CEO because the filter said so is how you get ignored. Messaging only an intern because they accept everything is how you get meetings that cannot close.",
      "Triggers help you guess who feels the pain this month: hiring for the team that would use you, a new leader in the function, a product launch, a fundraising post. Title plus trigger beats title alone.",
      "Sales Navigator makes this search less painful. A careful free-account workflow still works if you stay under commercial search limits. Omentir's lead finders score people against an ICP you define, which is the same idea with less manual filter clicking.",
    ],
    faqItems: [
      {
        question: "Should I always go to the C-suite?",
        answer:
          "Only if they feel the problem weekly. Many C-level inboxes are a graveyard of vendor mail. A director who owns the workflow will often reply faster and pull the exec in later.",
      },
      {
        question: "How do I tell a fake title from a real one?",
        answer:
          "Read experience dates, company size, and whether anyone else at the company has the same inflated title. \"Founder & CEO\" at a company of one is a founder. Sell like it.",
      },
      {
        question: "Are job changers good targets?",
        answer:
          "Often. New leaders buy tools in the first few months. Say that you noticed the new role. Do not pretend you worked together.",
      },
      {
        question: "Can I scrape the search results?",
        answer:
          "Not if you care about the account. Export through allowed products, or copy names by hand. Scrapers are how restrictions start.",
      },
    ],
    relatedSlugs: [
      "what-is-an-icp-for-b2b-sales",
      "what-buying-signals-to-use-before-linkedin-outreach",
      "linkedin-commercial-search-limit",
    ],
  },
  {
    slug: "what-is-an-icp-for-b2b-sales",
    question: "What is an ICP for B2B sales?",
    description:
      "An ideal customer profile is a plain description of the company and person who actually buys, including who is a bad fit. If you cannot write it in a few lines, your outreach will sound generic.",
    keywords: [
      "what is an ICP",
      "ideal customer profile B2B",
      "how to define ICP for outbound",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "ICP is the company: industry, size, geography, tech, and the situation that makes them buy. Persona is the human inside it: title, job, and what they are measured on. People mash those words together. Keep them straight so the list does not turn into \"anyone with a pulse.\"",
      "A useful ICP includes disqualifiers. No SMBs if you cannot support them. No industries where you cannot store the data. No companies that just bought your competitor for a three-year contract, unless you have a reason. Outbound dies when the filter is only vanity logos.",
      "Write one sentence: we help [role] at [type of company] who are dealing with [visible problem] get [outcome] without [painful alternative]. If that sentence is vague, the DM will be vague. We use a version of this in [getting first B2B customers](/blogs/get-first-b2b-customers-zero-budget).",
      "Your first ICP is a guess. The real one shows up in who replies and who pays. After 30 conversations, rewrite the sentence. Do not protect the original guess because it is in a slide.",
      "Omentir asks for this up front in My Product and in lead finders. If you skip it, the agents will still find people. They will just find the wrong ones.",
    ],
    faqItems: [
      {
        question: "How narrow should an ICP be?",
        answer:
          "Narrow enough that two customers would recognize each other. \"B2B SaaS in the US with 20 to 200 people, founder-led sales\" is a start. \"Companies that want to grow\" is not an ICP.",
      },
      {
        question: "Can I have more than one ICP?",
        answer:
          "Yes, as separate campaigns. Mixing two ICPs in one sequence makes the copy lie to half the list.",
      },
      {
        question: "Is firmographic data enough?",
        answer:
          "It is the floor. Trigger and pain make it a list worth sending to. A 200-person company in your industry with no problem you can see is still a maybe.",
      },
      {
        question: "Who should write the ICP, marketing or sales?",
        answer:
          "Whoever talks to buyers. If those people disagree, go read the last ten closed deals together instead of workshopping adjectives.",
      },
    ],
    relatedSlugs: [
      "how-to-find-decision-makers-on-linkedin",
      "what-buying-signals-to-use-before-linkedin-outreach",
      "how-to-personalize-linkedin-outreach",
    ],
  },
  {
    slug: "linkedin-vs-cold-email-for-b2b-outreach",
    question: "Should I use LinkedIn or cold email for B2B outreach?",
    description:
      "Email scales. LinkedIn carries identity and context. Most teams that book meetings use both, with different jobs for each channel.",
    keywords: [
      "LinkedIn vs cold email",
      "is LinkedIn better than cold email",
      "B2B outreach channel",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Cold email reaches more people per day, costs less per send, and has clearer deliverability math if you set up domains correctly. It also lands next to a hundred other vendors and can die in spam without you noticing.",
      "LinkedIn is slower and capped. The buyer can see your face, your company, and mutual connections before they reply. Reply rates on good LinkedIn threads are often higher than on average cold email. Volume is the tax.",
      "Use LinkedIn when the person is active there, when a public trigger exists, and when trust matters (services, higher ACV, founder-led). Use email when you have verified addresses, a tight segment, and you need coverage the invite cap cannot give you.",
      "Using only one channel is a choice, not a virtue. Buyers move. Some will never accept a stranger. Some never open LinkedIn. A short email that mentions a LinkedIn comment you left is often stronger than either channel alone.",
      "Omentir is LinkedIn-first on purpose. We are a weak buy if you only wanted a mailer. We are a better fit if the bottleneck is finding ICP-fit people and talking to them as yourself. The longer comparison is [LinkedIn outbound vs cold emailing](/blogs/linkedin-outbound-vs-cold-emailing-which-works-best-in-2026).",
    ],
    faqItems: [
      {
        question: "Which one is cheaper per meeting?",
        answer:
          "Email usually wins on raw cost if deliverability is healthy. LinkedIn wins when a meeting needs a face and a thread. Count fully loaded time, not only software.",
      },
      {
        question: "Can I copy the same copy into both?",
        answer:
          "You can, and it will feel copy-pasted. Shorten LinkedIn. Let email hold one extra proof point. Keep the same offer.",
      },
      {
        question: "What about cold calling?",
        answer:
          "Calls convert live conversations at a high rate and do not scale like mail. Use them on warmed names, not as the first touch on a 2,000-row CSV unless that is really your motion.",
      },
      {
        question: "Is LinkedIn \"dead\" for outbound in 2026?",
        answer:
          "No. It is more crowded, and replies are harder. Teams that still treat it like 2018 templates feel that. Teams that send fewer, sharper notes still get conversations.",
      },
    ],
    relatedSlugs: [
      "how-to-combine-linkedin-and-cold-email",
      "what-is-a-good-cold-email-reply-rate",
      "what-is-a-good-linkedin-reply-rate",
    ],
  },
  {
    slug: "how-to-combine-linkedin-and-cold-email",
    question: "How do I run LinkedIn and cold email together?",
    description:
      "Use one story across both channels, stagger the touches, and stop both when they reply anywhere. Parallel identical pitches on the same morning feel like a raid.",
    keywords: [
      "LinkedIn and cold email sequence",
      "multichannel outreach LinkedIn email",
      "how to combine LinkedIn and email",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Pick a single reason you are reaching out. The LinkedIn note and the email should feel like the same person, not two vendors. If the email mentions a hire, the invite can mention it too, in fewer words.",
      "Stagger. A common shape: email on day 1, LinkedIn view or comment on day 2, invite on day 3, DM after accept, a second email later in the week. Do not fire all of that on Tuesday at 9:04.",
      "When they reply on either channel, pause the other. Nothing says \"bot\" like an email arriving an hour after they said \"interested\" on LinkedIn, restating the pitch they already answered.",
      "Share suppression. If they unsubscribe on email, do not keep DMing as if nothing happened. If they mark an invite as IDK, do not \"try email instead\" the same afternoon with a hotter pitch.",
      "Keep volume inside each channel's health rules. Multi-channel is not permission to ignore warmup, bounce rates, or invite caps. It is a way to be present without leaning on one meter until it breaks.",
    ],
    faqItems: [
      {
        question: "Should the email say I also messaged on LinkedIn?",
        answer:
          "Only if you actually did, and only as a light mention. \"I also pinged you on LinkedIn\" from a stranger can feel like a surround. Better: same reason, no meta commentary.",
      },
      {
        question: "How many total touches?",
        answer:
          "Think 6 to 10 across two weeks if you include a call attempt, not 20. After that you are training them to filter you.",
      },
      {
        question: "Do I need one tool that does both?",
        answer:
          "Nice, not required. Two tools work if a human owns the pause-on-reply rule. One tool that cannot pause will embarrass you.",
      },
      {
        question: "What if I only have LinkedIn URLs, not emails?",
        answer:
          "Then run LinkedIn first. Enrich emails later for the people who fit, with a provider you can defend under privacy law. Do not guess addresses.",
      },
    ],
    relatedSlugs: [
      "linkedin-vs-cold-email-for-b2b-outreach",
      "how-many-linkedin-follow-up-messages-should-i-send",
      "how-many-cold-email-follow-ups-should-i-send",
    ],
  },
  {
    slug: "how-to-personalize-linkedin-outreach",
    question: "How do I personalize LinkedIn outreach without spending hours?",
    description:
      "Personalize the first line from one real public fact, then reuse a tight body. Research every account for an hour if the deal size pays for it. Do not fake uniqueness with a merge tag.",
    keywords: [
      "personalize LinkedIn outreach",
      "LinkedIn personalization at scale",
      "custom LinkedIn connection notes",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "The part that has to be unique is the first sentence. It should be a fact they would recognize: a post, a hire, a launch, a line from their site. The rest can be a stable explanation of why you are relevant, short enough to read on a phone.",
      "Batch by trigger, not by title. Fifty people who all hired SDRs this month can share a body. Fifty \"VPs of Sales\" with nothing in common cannot. That is how you get speed without lying.",
      "Skip fake personalization. \"Congrats on the anniversary\" from a tool, \"loved your post\" on a post you did not read, or an AI paragraph that could fit any CRO. Recipients have seen all of it.",
      "Spend real research time on accounts that match your ICP and have a shot at paying. Everyone else gets a light trigger or no send. Personalization is a budget. Spend it where the ACV can pay the minutes.",
      "Omentir drafts from product context and lead signals so you are not starting from a blank box. You still owe the first line a check. If the draft could fit a dentist and a datacenter, rewrite it.",
    ],
    faqItems: [
      {
        question: "Is first name personalization enough?",
        answer:
          "No. Everyone has that. It is hygiene, not personalization.",
      },
      {
        question: "How long should research take per lead?",
        answer:
          "Thirty seconds to two minutes for a standard outbound name: scan About, last post, current role. Ten minutes for a named account you actually want. Hours are for late-stage deals, not for first invites.",
      },
      {
        question: "Can I personalize from their company blog?",
        answer:
          "Yes, if you read the post. Citing a title you have not opened is obvious when they ask a follow-up.",
      },
      {
        question: "What if there is no public trigger?",
        answer:
          "Then you are guessing. Use email with a role-based problem, or wait. Silence beats a invented compliment.",
      },
    ],
    relatedSlugs: [
      "what-buying-signals-to-use-before-linkedin-outreach",
      "how-to-write-a-linkedin-connection-request",
      "what-is-an-icp-for-b2b-sales",
    ],
  },
  {
    slug: "what-buying-signals-to-use-before-linkedin-outreach",
    question: "What buying signals should I use before LinkedIn outreach?",
    description:
      "Use public events that imply a problem you can help with: hiring, new leaders, posts about the pain, product launches, funding, or a competitor they just engaged with.",
    keywords: [
      "LinkedIn buying signals",
      "intent signals for LinkedIn outreach",
      "when to reach out on LinkedIn",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A buying signal is a public fact that makes \"why now\" obvious. Hiring for the team that would use you. A new VP in the function. A post complaining about the workflow. A launch that will create operational mess. Funding that means they will spend. Those are fair to mention because they published them.",
      "Weak signals: they work at a company in your TAM, they have the right title, they logged into LinkedIn. That is a directory, not intent. You can still write to them. You should not pretend they asked for it.",
      "Two tests. Is it visible enough that naming it feels fair? Does it imply a problem you actually solve? A Series B is not a reason to pitch accounting software unless the rest of the profile agrees.",
      "Commenting on competitor posts, joining a relevant webinar, or changing jobs in the last 90 days are stronger than static filters. Use one signal in the first line. Stacking four of them looks like a dossier.",
      "Omentir scores leads with this kind of context on purpose. You can still do it by hand with a saved search and 20 minutes. The point is to send fewer notes that could only have been written today.",
    ],
    faqItems: [
      {
        question: "Is website visit tracking a LinkedIn signal?",
        answer:
          "That is a different channel. If they visited pricing and you also see them on LinkedIn, you can mention the category, not \"I see you were on page 4.\" Covert tracking in a DM feels hostile.",
      },
      {
        question: "How fresh should the signal be?",
        answer:
          "Days to a few weeks for posts and job changes. Months for a hire that is still ramping. A 2019 article is not a signal.",
      },
      {
        question: "What if the only signal is a like on a post?",
        answer:
          "A like is weak. A comment they wrote is stronger because they spent words. Prefer words.",
      },
      {
        question: "Should I wait for a signal before any outreach?",
        answer:
          "For high ACV, yes when you can. For a broad motion, mix a small cold slice with a larger signal slice, and compare reply rates. Keep the cold slice small enough that it cannot wreck acceptance.",
      },
    ],
    relatedSlugs: [
      "how-to-personalize-linkedin-outreach",
      "how-to-find-decision-makers-on-linkedin",
      "what-is-an-icp-for-b2b-sales",
    ],
  },
];
