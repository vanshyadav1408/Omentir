import type { HelpPageDraft } from "./types";

const DATE = "August 19, 2026";

export const HELP_PAGES_B: HelpPageDraft[] = [
  {
    slug: "what-is-linkedin-ssi",
    question: "What is LinkedIn SSI and does it matter for outreach?",
    description:
      "SSI is LinkedIn's 0 to 100 social selling score. It measures how you use LinkedIn, not how many meetings you book. Treat it as a health check, not a quota.",
    keywords: [
      "LinkedIn SSI",
      "Social Selling Index",
      "does SSI affect LinkedIn limits",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "SSI is the Social Selling Index. LinkedIn scores every member from 0 to 100 across four pillars worth 25 points each: professional brand, finding the right people, engaging with insights, and building relationships. You can see yours at [linkedin.com/sales/ssi](https://www.linkedin.com/sales/ssi) while logged in. Sales Navigator is not required to view it.",
      "The score updates from recent behavior. Completing a profile, posting, searching, commenting, and connecting in ways LinkedIn likes will move it. Ignoring the product for a month will drop it. That is all it can see. It cannot see your CRM, your close rate, or whether the last InMail was any good.",
      "LinkedIn has claimed that people with higher SSI create more opportunities. That comparison mixes heavy product users with people who barely log in. A high SSI can still sit on an empty pipeline. A founder with a modest SSI who books two demos a week is doing the actual job.",
      "Vendors like to say SSI is a secret rate-limit input. LinkedIn does not document that. What we can say without guessing: accounts that look complete, get accepts, and do not spam tend to have more room, and those habits also raise SSI. Chase the habits. Do not grind the number.",
      "If you manage a team in Sales Navigator, SSI shows up in reports and becomes a vanity KPI. Keep the real dashboard on acceptance, reply rate, and meetings. SSI is a side mirror.",
    ],
    faqItems: [
      {
        question: "What is a good SSI score?",
        answer:
          "People often treat 70 as \"fine\" and under 40 as \"you barely use LinkedIn.\" Industry percentiles on the SSI page matter more than a magic total. Be in the top slice of your industry if you care. Then go back to pipeline.",
      },
      {
        question: "Does a low SSI block invites?",
        answer:
          "Not as a published switch. A hollow profile that also sends cold invites is still a risk. Raise the profile quality because buyers look at it, not because a widget told you to.",
      },
      {
        question: "Which pillar is hardest without Sales Navigator?",
        answer:
          "Finding the right people. That pillar rewards Navigator-style search. You can still score elsewhere with a complete profile, comments, and real relationships.",
      },
      {
        question: "Should I game SSI with fake activity?",
        answer:
          "Mass likes and empty comments are visible to humans and still look automated to the product. It is a poor use of the morning.",
      },
    ],
    relatedSlugs: [
      "how-to-increase-linkedin-ssi",
      "is-sales-navigator-worth-it-for-outbound",
      "how-to-warm-up-a-linkedin-account-for-outreach",
    ],
  },
  {
    slug: "how-to-increase-linkedin-ssi",
    question: "How do I increase my LinkedIn SSI score?",
    description:
      "Fill the profile, search for people you actually sell to, comment with a point, and connect with a reason. SSI follows those habits. It does not need a separate campaign.",
    keywords: [
      "how to increase LinkedIn SSI",
      "improve Social Selling Index",
      "raise LinkedIn SSI score",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Start with the brand pillar, because it is the one buyers see. Use a face photo, a headline that names a buyer and a problem, an About section in plain language, and experience that is not a paste of your resume's mission statement. A logo-as-avatar and \"Passionate growth hacker\" will cap this pillar and your accept rate together.",
      "Finding the right people means search with intent: title, industry, geography, and a trigger, not \"CEO\" worldwide. Save searches if you have Navigator. On a free account, be picky. Random scrolling does not teach the product who you serve.",
      "Engaging with insights is comments and posts that add a fact or a question, not \"Great share!\" Under a prospect's post, say something specific about the thing they wrote. That is also how you warm a name before the invite.",
      "Building relationships is accepts, replies, and conversations with people in your market, including seniors. Connecting with 200 students in another country to inflate the graph will not help SSI in a way you want, and it will not help outbound.",
      "Give it a few weeks of real use. Checking the SSI page every afternoon is not a tactic. If the score moves and replies do not, you optimized the widget. Switch attention to who you invite and what you ask.",
    ],
    faqItems: [
      {
        question: "How often does SSI update?",
        answer:
          "LinkedIn describes it as a near-daily snapshot of recent behavior, not a lifetime trophy. A quiet week shows up.",
      },
      {
        question: "Do I need to post to raise SSI?",
        answer:
          "Posting helps the brand pillar. Thoughtful comments on other people's posts often do more for outreach, because the prospect sees you in their notifications before you ask to connect.",
      },
      {
        question: "Will Sales Navigator jump my score overnight?",
        answer:
          "It makes the \"find people\" pillar easier to feed. It will not rescue a empty profile or a spammy invite habit.",
      },
      {
        question: "Is SSI worth a weekly team meeting?",
        answer:
          "No. Glance at it when an account looks sick. Spend the meeting on acceptance, replies, and which segment actually booked.",
      },
    ],
    relatedSlugs: [
      "what-is-linkedin-ssi",
      "how-to-write-a-linkedin-connection-request",
      "how-to-find-decision-makers-on-linkedin",
    ],
  },
  {
    slug: "linkedin-commercial-search-limit",
    question: "Why did LinkedIn say I reached my commercial search limit?",
    description:
      "Free LinkedIn caps sales-style searching. When you hit the commercial use limit, search results shrink until the window resets. Sales Navigator is the paid search product.",
    keywords: [
      "LinkedIn commercial search limit",
      "LinkedIn search limit reached",
      "commercial use limit LinkedIn",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "The commercial use limit is LinkedIn's way of stopping free accounts from using regular search like a prospecting database. After enough sales-looking searches and profile views in a month, you will see a notice and fewer results. It is separate from the invitation limit.",
      "LinkedIn does not publish a clean \"you get 300 searches\" number that you can budget. The limit is looser if you mostly use LinkedIn as a network and tighter if every query is \"VP Sales SaaS United States.\" Premium and Recruiter have their own search products. Sales Navigator is the one built for lead and account search.",
      "When you hit it, stop trying to brute-force the same query. You will not \"reset\" it by logging out. Use people you already found, work InMail or Open Profile where you have access, and wait for the window to refresh. Spreadsheets of URLs you already collected still work because you are not searching.",
      "A Chrome scraper will not save you. It is how people turn a search cap into an account restriction. If prospecting search is the job, pay for Navigator or keep a slower manual rhythm on the free graph.",
      "Omentir's lead finding is a different motion: agents look for ICP-fit buyers and you still send from your own profile. It does not delete LinkedIn's commercial use rules. If you live in Sales Navigator all day, you still need that seat for that search UI.",
    ],
    faqItems: [
      {
        question: "When does the commercial search limit reset?",
        answer:
          "It is a monthly-style window, not a midnight refresh you can game. Plan to hit it late in the month if you prospect daily on a free account, then idle search until it clears.",
      },
      {
        question: "Does viewing profiles count?",
        answer:
          "Heavy profile viewing is part of the same commercial pattern. Open people you will actually evaluate, not every row in a 1,000-result list.",
      },
      {
        question: "Will a second account dodge the limit?",
        answer:
          "That is against the user agreement and a fast way to lose both accounts. Buy the search product or slow down.",
      },
      {
        question: "Is this the same as the 1,000 search result cap?",
        answer:
          "No. Regular search also paginates. You cannot see endless pages of one query. Navigator raises how deep you can go on saved lead search. They are related annoyances, not the same meter.",
      },
    ],
    relatedSlugs: [
      "is-sales-navigator-worth-it-for-outbound",
      "linkedin-premium-vs-sales-navigator",
      "how-to-find-decision-makers-on-linkedin",
    ],
  },
  {
    slug: "how-many-connections-can-i-have-on-linkedin",
    question: "How many connections can I have on LinkedIn?",
    description:
      "LinkedIn caps first-degree connections at 30,000. After that, people can follow you, but you cannot add more connections without removing some.",
    keywords: [
      "LinkedIn 30000 connection limit",
      "maximum LinkedIn connections",
      "LinkedIn connection cap",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "The published cap on first-degree connections is 30,000. LinkedIn has said this for years. It is a lifetime size of your graph on that account, not a weekly quota. Premium does not raise it.",
      "When you hit it, new people can still follow you if you have follow enabled, and you can still post. You cannot keep accepting or sending connections until you remove existing ones. That is a painful place to discover during a campaign.",
      "Most sellers never get close. If you are adding everyone who will click Accept, you will get there with a network that does not buy. Quality still wins: 4,000 people in your ICP beat 29,000 random accepts.",
      "Followers are a different counter. Creators can have a large follow graph without 30,000 connections. If your motion is content plus inbound DMs, follow can be enough. If your motion is 1:1 messages, you still need the connection (or InMail, or Open Profile).",
      "Do not build a \"connection farm\" of dummy profiles to route around the cap. That is a restriction waiting to happen, and it produces a graph nobody wants to talk to.",
    ],
    faqItems: [
      {
        question: "Does unconnecting someone free a slot?",
        answer:
          "Yes. Removing a connection opens room. They may notice. Use it for people who were never a fit, not for a weekly churn trick.",
      },
      {
        question: "Do pending invites count toward 30,000?",
        answer:
          "No. Pending is a separate pile. Only accepted first-degree connections count toward the 30,000.",
      },
      {
        question: "Can I have more than 30,000 followers?",
        answer:
          "Yes. Followers are not connections. Creator-style accounts often have far more followers than connections.",
      },
      {
        question: "Should I connect with everyone who follows me?",
        answer:
          "No. Follow is a weaker relationship and that is fine. Convert to a connection when there is a reason to talk, not as a default.",
      },
    ],
    relatedSlugs: [
      "how-many-pending-linkedin-invitations-is-too-many",
      "how-many-linkedin-connection-requests-per-week",
      "can-i-send-linkedin-requests-to-people-i-dont-know",
    ],
  },
  {
    slug: "should-i-include-a-note-with-linkedin-connection-request",
    question: "Should I include a note with a LinkedIn connection request?",
    description:
      "Use a note when you have one specific reason. Skip it when the reason is fake. A blank invite can beat a pitch that looks like an ad.",
    keywords: [
      "LinkedIn connection request with note",
      "blank LinkedIn invite vs note",
      "should I personalize LinkedIn connection",
    ],
    cluster: "requests",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A note is useful when it names something only that person could have triggered: a post, a hire, a group, a talk, a mutual person they would recognize. \"Loved your content, let's partner\" is not that. It is a pitch wearing a compliment.",
      "A blank request can outperform a weak note, especially if your profile already explains who you are. The invite looks like a normal network ask. On a true cold list with no shared context, a one-line reason usually beats blank, because otherwise you are a stranger with a slogan.",
      "Never put the calendar link, the five-line product story, or \"I noticed you're in [industry]\" in the invite. That is what people ignore, mark as spam, or answer with \"I don't know this person.\" Save the ask for after they accept.",
      "Free accounts have historically been stingy with how many notes you can attach. If you are rationing notes, spend them on the coldest, highest-value names and send blank (or skip) the rest. Paid accounts can note more of them. The quality bar does not change.",
      "If you cannot think of a true sentence, do not invent one. Follow them, comment once, and invite later, or leave them for email. A fake personalization line is worse than silence. More templates live in [how to write a LinkedIn connection request that gets accepted](/blogs/how-to-write-a-linkedin-connection-request-that-gets-accepted).",
    ],
    faqItems: [
      {
        question: "What is the shortest useful note?",
        answer:
          "One sentence: why you, why them, no ask. \"Saw the hiring post for two AEs. Curious how you are ramping outbound without adding headcount.\" Then stop.",
      },
      {
        question: "Should I mention my product in the invite?",
        answer:
          "Almost never. The invite's job is to get you into the inbox. The product belongs in a later message, after they have a chance to look at you.",
      },
      {
        question: "Do emojis help?",
        answer:
          "They make a cold note look like a template. Skip them unless you already talk that way with that person.",
      },
      {
        question: "Is a note required to look human?",
        answer:
          "No. Plenty of humans send blank requests. A required-looking paragraph of merge tags is what looks like software.",
      },
    ],
    relatedSlugs: [
      "how-long-should-a-linkedin-connection-note-be",
      "how-to-write-a-linkedin-connection-request",
      "what-is-a-good-linkedin-acceptance-rate",
    ],
  },
  {
    slug: "how-long-should-a-linkedin-connection-note-be",
    question: "How long should a LinkedIn connection note be?",
    description:
      "Keep connection notes under 200 characters, about two short sentences. The field is small on purpose. A pitch does not belong there.",
    keywords: [
      "LinkedIn connection note character limit",
      "how long LinkedIn connection message",
      "LinkedIn invite note length",
    ],
    cluster: "requests",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "The note field is short. Older free accounts sat around 200 characters. Many paid accounts sit around 300. Those numbers move, and a long first name plus a company name will eat the template. Write to 200 so the sentence does not clip on anyone's account.",
      "Two short sentences is the useful shape: the trigger, then why you are asking to connect, with no meeting ask. That length also reads on a phone, which is where a lot of accepts happen.",
      "Longer notes start to look like emails. People did not opt into a pitch by clicking My Network. If you need 800 characters, you wanted InMail or a post-accept DM, not an invite footnote.",
      "Count characters after personalization, not before. \"Hi {{firstName}} at {{company}}\" looks short in the sequencer and overflows when the name is Maximilian and the company is a law firm.",
      "If you cannot say it in 200 characters, the thought is not sharp yet. Cut the compliment, cut the biography, leave the one observation. Operator data on short notes beating long ones is messy, but the product UI is not: LinkedIn gave you a stub, not an essay box.",
    ],
    faqItems: [
      {
        question: "What is the current official character limit?",
        answer:
          "LinkedIn has changed the note field over time and it can differ by plan. Do not build a process that needs the last 40 characters. Stay under 200 and you will not fight the box.",
      },
      {
        question: "Should I use the full limit every time?",
        answer:
          "No. Filling the bar because it exists produces fluff. Stop when the reason is clear.",
      },
      {
        question: "Can I add a link in the note?",
        answer:
          "Skip it. Links in an unaccepted invite look like tracking. They also burn characters you need for the reason.",
      },
      {
        question: "Does a longer Premium note convert better?",
        answer:
          "Not because it is longer. Extra room is only useful if the extra words are a better reason. Most people use them to ramble.",
      },
    ],
    relatedSlugs: [
      "should-i-include-a-note-with-linkedin-connection-request",
      "how-to-write-a-linkedin-connection-request",
      "how-long-should-a-linkedin-cold-message-be",
    ],
  },
  {
    slug: "how-to-write-a-linkedin-connection-request",
    question: "How do I write a LinkedIn connection request that gets accepted?",
    description:
      "Pick people with a real trigger, write one specific sentence, skip the pitch, and make the profile look like a person worth accepting.",
    keywords: [
      "how to write LinkedIn connection request",
      "LinkedIn connection request template",
      "LinkedIn invite that gets accepted",
    ],
    cluster: "requests",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Start with who. A request to someone who just posted about the problem you solve, hired for the team you sell into, or sits in a group you both actually use will beat a prettier sentence sent to a random title. Targeting is the copy.",
      "Then write one observation they would recognize as true, in language you would say out loud. Mention the post, the job change, the shared school, the customer they announced. Do not flatter. Do not say \"I'd love to pick your brain.\"",
      "Do not ask for 15 minutes in the invite. Do not attach a PDF. Do not introduce the product. The accept is the only call to action. After they accept, you get a free DM. Spend the invite getting that far.",
      "Look at your own profile in an incognito mindset. Photo, headline, and About are what they open when the invite arrives. If those three things scream \"SDR blasting,\" the note will not save you. Fix them first. We wrote a longer pass in [crafting a LinkedIn profile that doubles outbound acceptances](/blogs/crafting-a-linkedin-profile-that-doubles-your-outbound-acceptances).",
      "Send fewer, better requests. Measure accepts, not sends. If a segment sits under 30 percent, change the segment. Rewriting the same template for a bad list is how people burn the weekly cap.",
    ],
    faqItems: [
      {
        question: "Can I use the same note for a whole list?",
        answer:
          "You can, and people can smell it. A shared trigger for a small segment (\"hiring two AEs this month\") is a template. A fake unique line generated for 400 strangers is still a template.",
      },
      {
        question: "Should I mention a mutual connection?",
        answer:
          "Only if they would actually vouch for you. Name-dropping a mutual they have not spoken to in years reads as social engineering.",
      },
      {
        question: "Is \"I came across your profile\" fine?",
        answer:
          "It is empty. Everyone on LinkedIn came across a profile. Say what you saw, or send blank.",
      },
      {
        question: "How soon should I follow up after they accept?",
        answer:
          "Wait at least a day. Same-hour pitches after accept are why people regret clicking. See [when to send the first LinkedIn message after they accept](/help/when-to-send-first-linkedin-message-after-accept).",
      },
    ],
    relatedSlugs: [
      "should-i-include-a-note-with-linkedin-connection-request",
      "why-are-my-linkedin-connection-requests-ignored",
      "how-to-personalize-linkedin-outreach",
    ],
  },
  {
    slug: "why-are-my-linkedin-connection-requests-ignored",
    question: "Why are my LinkedIn connection requests getting ignored?",
    description:
      "Most ignored invites are a targeting problem, a profile that looks like spam, or a note that is already a pitch. Volume is rarely the missing piece.",
    keywords: [
      "LinkedIn connection requests ignored",
      "why nobody accepts LinkedIn invites",
      "LinkedIn invites not accepted",
    ],
    cluster: "requests",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Ignored usually means they never opened it, they opened it and felt nothing, or LinkedIn parked it in Other. You do not get a report that tells you which. You infer from the list quality and the profile they would have seen.",
      "Wrong person is the common case. Messaging a CEO about a tool their ops lead would buy, or a student about enterprise software, wastes the invite. If you cannot explain in one sentence why this title cares this month, do not send it.",
      "Wrong first impression is next. No photo, a company logo, a headline that is only a product name, or 14 open-to-work banners from old jobs. People accept people. They ignore billboards.",
      "Wrong note is third. A paragraph about you, a Calendly link, or \"quick question\" that is not a question. Also: notes that claim you loved a post they wrote in 2019. They know you did not.",
      "Fix in that order: list, profile, note, then volume. Withdrawing stale pending invites helps the account. It will not make the next 100 strangers care. For the spam-filter side of this, [how LinkedIn spam filters work](/blogs/linkedin-spam-filters-how-they-work) is the longer read.",
    ],
    faqItems: [
      {
        question: "They viewed my profile and still ignored the invite. Why?",
        answer:
          "They looked, judged, and passed. That is useful. Your profile or the implied pitch lost. Rewrite the headline before you rewrite the sequencer.",
      },
      {
        question: "Does sending more invites fix a low accept rate?",
        answer:
          "It makes the math worse and can shrink next week's cap. Send fewer, better ones.",
      },
      {
        question: "Could they have never seen it?",
        answer:
          "Yes. Focused versus Other, busy weeks, and people who do not check LinkedIn. That is why pending piles grow. After two to four weeks, withdraw and move on.",
      },
      {
        question: "Should I switch to InMail instead?",
        answer:
          "InMail is for people you cannot connect with, or for a tighter paid shot. It will not rescue a bad offer. It will spend credits on the same ignore.",
      },
    ],
    relatedSlugs: [
      "what-is-a-good-linkedin-acceptance-rate",
      "what-does-i-dont-know-this-person-do-on-linkedin",
      "how-to-write-a-linkedin-connection-request",
    ],
  },
  {
    slug: "can-i-send-linkedin-requests-to-people-i-dont-know",
    question: "Can I send LinkedIn connection requests to people I do not know?",
    description:
      "You can. LinkedIn still asks you to connect with people you know, and strangers can mark that you do not. Cold invites work when the reason is obvious and the volume stays low.",
    keywords: [
      "connect with people I don't know on LinkedIn",
      "cold LinkedIn connection requests",
      "LinkedIn connect with strangers",
    ],
    cluster: "requests",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "The user agreement and invite screens push you toward people you know. In practice, B2B sellers send cold invites every day. LinkedIn also lets recipients mark \"I don't know this person,\" which is a penalty box you should take seriously.",
      "Cold is legal in the platform sense if you are not scraping, automating against the rules, or spamming. Cold is still rude if the note is a pitch. The workable version of cold is: public trigger, short reason, no ask, profile that looks like a peer.",
      "People you went to school with, worked with, or met at an event are the easy yes. People who posted about the exact pain you solve this week are the next best. People who merely match a title filter are the ones who hit Ignore.",
      "If a segment needs a long explanation of why you are reaching out, that segment is not ready for an invite. Use email, or wait until they publish something you can point at. Silence is cheaper than a report.",
      "Keep cold volume inside a conservative daily cap so a few flags cannot take the week down. Omentir is built around sending from your own account at a human pace. It does not make a stranger obligated to accept.",
    ],
    faqItems: [
      {
        question: "Is cold inviting against LinkedIn's rules?",
        answer:
          "LinkedIn wants relevant requests and gives people a way to mark strangers. Mass cold inviting with the same pitch is how accounts get limited. Selective cold inviting with a real reason is how most outbound teams actually work.",
      },
      {
        question: "Should I only invite 2nd-degree connections?",
        answer:
          "2nd-degree often accepts better because a mutual name appears. It is not a rule. A 3rd-degree with a fresh, specific trigger can still be the right person.",
      },
      {
        question: "What if we share a group?",
        answer:
          "Mention the group only if you actually participate in it. Fake group camaraderie is easy to spot.",
      },
      {
        question: "Can I invite customers of a competitor?",
        answer:
          "You can invite employees of a competitor company. Do not pretend you are a customer. Be honest later if the conversation starts. See [how to reply when they already use a competitor](/help/how-to-reply-when-prospect-already-uses-a-competitor).",
      },
    ],
    relatedSlugs: [
      "what-does-i-dont-know-this-person-do-on-linkedin",
      "should-i-include-a-note-with-linkedin-connection-request",
      "is-linkedin-automation-allowed",
    ],
  },
  {
    slug: "what-does-i-dont-know-this-person-do-on-linkedin",
    question: "What does \"I don't know this person\" do on LinkedIn?",
    description:
      "It is a recipient report that you sent an invite to a stranger. A few of these can shrink your invitation room. It is one of the louder spam signals.",
    keywords: [
      "I don't know this person LinkedIn",
      "LinkedIn IDK button",
      "LinkedIn invitation marked as I don't know",
    ],
    cluster: "requests",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "When someone gets your invite, they can accept, ignore, or say they do not know you. That last option exists because LinkedIn asked members to connect with people they know. Using it is a vote that your request felt like spam from a stranger.",
      "You do not get an email that says \"Jane reported you.\" You infer it when limits tighten after a sloppy week, or when LinkedIn talks about invitations being marked as spam in its help articles. Treat every cold invite as something a busy stranger might flag.",
      "The defense is not a cleverer opener. It is fewer, more relevant asks, a profile that looks like a colleague, and notes that do not pitch. If your accept rate is already low, you are closer to this button than you think.",
      "Do not retaliate. Do not send a follow-up email that says \"why did you ignore me.\" Withdraw stale pending invites so fewer people have a stale stranger request sitting in their queue where they might hit the flag later.",
      "If you got a restriction after a campaign to a purchased list, assume IDK and ignores were part of it. Throw the list out. Build the next one from a trigger you can point at.",
    ],
    faqItems: [
      {
        question: "Is it the same as marking a message as spam?",
        answer:
          "It is specific to invitations. Messages and InMail have their own spam marks, which can also restrict sending. None of these are compliments.",
      },
      {
        question: "How many IDKs does it take to get restricted?",
        answer:
          "LinkedIn does not publish a count. You do not want to find it. A handful on a small send volume is already a bad week.",
      },
      {
        question: "Should I only invite people I have met in person?",
        answer:
          "That is the safest reading of the button. Most B2B outbound will still include people you have not met. Make the reason obvious so they do not feel tricked.",
      },
      {
        question: "Can they still accept later if they clicked it?",
        answer:
          "Treat IDK as a no. Do not keep a sequence running at them. Leave them alone.",
      },
    ],
    relatedSlugs: [
      "can-i-send-linkedin-requests-to-people-i-dont-know",
      "why-are-my-linkedin-connection-requests-ignored",
      "why-was-my-linkedin-account-restricted",
    ],
  },
];
