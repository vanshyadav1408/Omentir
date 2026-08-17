import type { GuidePage } from "./types";

export const LINKEDIN_GUIDES: GuidePage[] = [
  {
    slug: "automation-for-linkedin",
    title: "What automation for LinkedIn actually means",
    description:
      "People use this phrase for invites, DMs, scrapers, and ads. This page names those jobs, then covers account risk and pacing that keeps sends from looking like a bot.",
    query: "automation for LinkedIn",
    kicker: "LinkedIn automation",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "automation for LinkedIn",
      "LinkedIn automation meaning",
      "safe LinkedIn outreach",
      "human paced LinkedIn",
    ],
    sections: [
      {
        heading: "The phrase is a pile of jobs",
        paragraphs: [
          "When someone says they want automation for LinkedIn, they rarely mean one product. They might mean a script that sends connection requests while they sleep. They might mean a scraper that dumps search results into a spreadsheet. They might mean a company-page tool that schedules posts. They might mean ads in Campaign Manager. Those are different purchases, different risk profiles, and different people who should own them.",
          "The consumer product (your personal profile, your inbox, your network) is the one that gets people in trouble. LinkedIn sells its own advertising and partner APIs for some company-page work. It does not sell you a public switch that blasts invites from your name. If the work happens as you, from your profile, you are asking software to imitate a person. That is the category this page is about.",
        ],
      },
      {
        heading: "Account risk is not a footnote",
        paragraphs: [
          "[LinkedIn's user agreement](https://www.linkedin.com/legal/user-agreement) restricts unauthorized bots, scraping, and automated use of the consumer product. Enforcement is uneven, which is why so many tools still exist, but the account is still theirs. A restriction, a checkpoint, or a permanent lock does not come with an appeals department that cares about your pipeline. If the profile is your own name, the cost is personal, not just a seat in a tool.",
          "The failure mode is rarely a single extra invite. It is a pattern: a quiet account that suddenly fires a day's worth of actions in twenty minutes, identical notes, searches that no human would click that fast, or a Chrome extension clicking through the DOM of linkedin.com. New and recently recovered accounts are less forgiving. Bought or rented profiles are a bad idea even when the software's pacing looks careful.",
        ],
      },
      {
        heading: "Human pacing is a schedule",
        paragraphs: [
          "Pacing means the software spreads invites and messages across the day, respects a daily ceiling you set, and leaves idle time the way a person would. It is not a marketing badge. Ask where the limit lives (workspace setting versus buried default), whether a new account ramps instead of jumping to peak volume, and whether you can see a send log after the fact. If the vendor will not show you those controls, they are asking you to trust a black box with your identity.",
          "A useful starting posture is conservative: complete the profile, have some real conversations, then start well below whatever the tool's maximum is. Raise volume only after a clean week. If you need software that sends from your own profile with limits you can tighten, [Omentir](/signup) is built around that motion. It is not official LinkedIn, and it cannot promise the account will never be restricted.",
        ],
      },
      {
        heading: "Leave some of it manual",
        paragraphs: [
          "Automation is a poor fit for the first reply that contains a real question, a pricing exception, or anything you would not put in writing on your own letterhead. Drafts can wait in a queue. The close, the custom security answer, and the 'are you the right person?' thread still belong to a human. Software that removes that judgment is not saving time. It is transferring risk onto copy you did not read.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is any LinkedIn automation allowed?",
        answer:
          "LinkedIn documents official APIs for ads, some company-page work, and partner programs. Personal-profile invite and DM automation sits outside that. Tools still ship it. You own the account outcome.",
      },
      {
        question: "What does human pacing look like in practice?",
        answer:
          "A daily invite and message cap, delays between actions, send windows, and a ramp on a quiet profile. Bursting a hundred requests at 9:01 is the opposite, even if the copy is good.",
      },
    ],
  },
  {
    slug: "linkedin-automation-software",
    title: "LinkedIn automation software, extensions, and the official API",
    description:
      "Software in this category is not one thing. Cloud apps, Chrome extensions, and LinkedIn's own APIs have different jobs and different ways to get you restricted.",
    query: "LinkedIn automation software",
    kicker: "Software category",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "LinkedIn automation software",
      "LinkedIn Chrome extension",
      "LinkedIn official API",
      "cloud LinkedIn automation",
    ],
    sections: [
      {
        heading: "Three architectures, three failure modes",
        paragraphs: [
          "Most 'LinkedIn automation software' search results mix three kinds of product. A Chrome extension sits in the browser, drives the LinkedIn web app, and often stores a session in a place you cannot audit. A cloud app asks you to connect the account, then runs sequences from a server. LinkedIn's own developer platform issues tokens for approved use cases such as ads and some organization-page features. Calling all three 'software' is accurate and still useless as a buying decision.",
          "Extensions fail in ways that are easy to miss until they are not. They break when LinkedIn changes markup. They can over-click because the tab is open. Some have been caught shipping session cookies to a vendor you did not intend to trust. Cloud apps move the session off your laptop, which removes that tab-click pattern and introduces a different one: a datacenter sending as you. Official APIs fail in a boring way. If your use case is not in the docs, the answer is no, not 'try a workaround.'",
        ],
      },
      {
        heading: "What the official platform actually sells",
        paragraphs: [
          "The [LinkedIn Developer docs](https://learn.microsoft.com/en-us/linkedin/) describe Marketing APIs, Community Management for organization pages, Sign In with LinkedIn, and partner-only Sales Navigator integrations. They do not describe a public endpoint for bulk connection requests from a member profile. If a vendor says they use 'the LinkedIn API' for outbound DMs, ask which product and which partnership. Many mean a third-party messaging gateway or a reverse-engineered session, not a Microsoft-issued outreach API.",
          "That distinction matters for procurement. An ads integration that posts campaigns through Marketing Developer Platform is a different legal and technical object than a sequencer that sends invites. Do not let a slide titled 'API-based' collapse them. Read the partner page. If there is no partner page, you are looking at unofficial automation with extra vocabulary.",
        ],
      },
      {
        heading: "How to read a software category page",
        paragraphs: [
          "Ask where the session lives, what actions the product takes (search, invite, message, scrape, post), and whether replies land in an inbox you can open. Ask what happens if LinkedIn presents a checkpoint. A serious product will tell you that you still own the account and that volume has a ceiling. A category page that only lists logos is selling a directory, not a decision.",
          "If the job is sending from a profile you control, you want software with visible limits, a send log, and a way to pause. Cloud versus extension is a starting filter, not the whole RFP. Plenty of cloud sequencers will still get an account restricted if you paste a thousand-row CSV and max the slider on day one.",
        ],
      },
      {
        heading: "What this category is not",
        paragraphs: [
          "It is not Sales Navigator. Navigator is paid search and InMail packaging from LinkedIn. It is not a CRM. It is not an official endorsement. LinkedIn can change detection, markup, and terms without asking any of these vendors. Buy software you can shut off in one click, and keep a copy of the people you contacted outside the vendor's database.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Are Chrome extensions always worse than cloud software?",
        answer:
          "They have a worse detection surface on the LinkedIn DOM and a worse cookie story. Cloud is not automatically safe. It still automates a personal account. Pick on job, session handling, and limits you can see.",
      },
      {
        question: "Can I build this on the official API instead?",
        answer:
          "Not for bulk personal invites and DMs. Official APIs cover ads, some page management, auth, and partner programs. See the LinkedIn API guide on this site and Microsoft's docs before you budget an engineering sprint around outreach.",
      },
    ],
  },
  {
    slug: "linkedin-automation-tools",
    title: "How to shortlist LinkedIn automation tools by job",
    description:
      "Find, send, and scrape are different LinkedIn automation tools. Shortlist by the job you actually have, not by a roundup that treats every logo as interchangeable.",
    query: "LinkedIn automation tools",
    kicker: "Tool shortlist",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "LinkedIn automation tools",
      "LinkedIn sequencer",
      "LinkedIn scraper",
      "LinkedIn lead finder",
    ],
    sections: [
      {
        heading: "Start with the job, not the aisle",
        paragraphs: [
          "A roundup titled 'best LinkedIn automation tools' usually dumps sequencers, scrapers, and inboxes into one grid. That grid is how you buy the wrong thing. Write the job in a sentence before you open a tab. Examples that stay honest: 'I have a CSV and I need invites plus two follow-ups.' 'I do not have a list and I need people who match an ICP.' 'I need a one-off export of a search I already ran.' Those three sentences point at three shelves. [LinkedIn](https://www.linkedin.com) is the network. The tools sit on top of it, they are not a substitute for it.",
        ],
        bullets: [
          "Find: build or refill a list from an ICP, filters, or a signal such as comments on a post.",
          "Send: connection requests, messages, and follow-ups from connected profiles, with a cap.",
          "Scrape: copy what is already on a page or search into a file. That is extraction, not a conversation.",
        ],
      },
      {
        heading: "Find tools assume the list is the product",
        paragraphs: [
          "If your calendar is empty because the names are wrong, a sequencer will only send the wrong names faster. Finding looks like Sales Navigator filters you actually run, a contact graph you already pay for, or software that watches a signal (hiring, comments, a competitor's audience) and writes people into a group. The output should be a list you can reject. If you cannot look at twenty rows and say 'these are the buyers,' do not attach a campaign.",
          "Commenter and ICP finder products are still automation. They create activity on the account that does the looking. Treat discovery volume with the same caution you treat send volume. A finder that pages through search all day is not a free action just because no invite went out.",
        ],
      },
      {
        heading: "Send tools assume you already have names",
        paragraphs: [
          "Sequencers (cloud products in the [Expandi](/expandi) and [Dripify](/dripify) aisle, agency sender pools, some workspace tools) take a list and run steps: view, invite, wait, message if accepted. That is a real job. It is also the job most 'LinkedIn automation tools' pages are actually selling. If you do not have the list, you will spend the first month importing CSVs and wondering why reply rates are a rounding error.",
          "When the job is send from your own profile, ask for daily limits, a pause button, and an inbox. [Omentir](/signup) is in that send-from-profile class, with the extra claim that it can also find the list. Do not buy it as a forty-seat agency rotator. Do not buy a rotator if you still needed the names.",
        ],
      },
      {
        heading: "Scrape tools are a compliance conversation",
        paragraphs: [
          "Extraction tools copy profiles, search results, or group members into a sheet. LinkedIn's terms restrict scraping. Some vendors wrap the same job in friendlier language ('export,' 'audience builder'). If the value is a file of people who did not ask to be in your CRM, you need a lawyer and a retention policy, not just a faster Phantom-style phantom. Scraping also tends to be the noisiest activity pattern: many profile views, fast, from one session.",
          "Use scrape when you already have a legitimate reason to hold the data and you will send later through a motion you can defend. Do not use it as a substitute for a finder you could brief in language. A stale CSV of titles is how outbound gets a reputation.",
        ],
      },
      {
        heading: "A shortlist of two is enough",
        paragraphs: [
          "Pick one finder path and one send path, or one product that honestly does both. Adding a third 'just in case' scraper usually means nobody owns the list. Run a two-week test on one segment. Measure replies and restrictions, not logos collected.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Can one tool do find, send, and scrape well?",
        answer:
          "Some products claim all three. Treat that as a prompt to demo each job, not as a spec. If the finder is a CSV upload with extra marketing, you still needed a list. If the send path has no cap, the scrape path will get the account in trouble first.",
      },
      {
        question: "Where do Chrome extensions sit on this map?",
        answer:
          "Usually send or scrape, running on the LinkedIn tab. They are a delivery mechanism, not a job. Filter them the same way: what action, whose list, what limit.",
      },
    ],
  },
  {
    slug: "best-linkedin-automation-tools",
    title: "Buying criteria for LinkedIn automation, not a ranked ten",
    description:
      "There is no honest public ranking of the best LinkedIn automation tools. Buy on the job, the session, limits you can see, the inbox, and who still reads replies.",
    query: "best LinkedIn automation tools",
    kicker: "Buying criteria",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "best LinkedIn automation tools",
      "LinkedIn automation buying criteria",
      "LinkedIn sequencer comparison",
    ],
    sections: [
      {
        heading: "A numbered list of ten is an ad unit",
        paragraphs: [
          "Search this query and you will get a table with ranks, scores, and a new logo in slot seven every quarter. Those pages are usually affiliate roundups. They cannot know your list quality, your account age, or whether you needed discovery instead of another sequencer. This page will not invent a ranking. If two vendors could swap names in a sentence and the sentence stayed true, that sentence does not belong in a 'best of' article.",
          "What you can do in public is name criteria, then go verify them on the vendor's site and in a trial. Criteria age slower than feature grids. Feature grids go stale when a sequencer adds email or an agency plan.",
        ],
      },
      {
        heading: "Criteria that change the purchase",
        paragraphs: [
          "Job: find versus send versus scrape, as the [tools shortlist](/linkedin-automation-tools) lays out. Architecture: extension, cloud, or official API. Whose list: you upload, or the product builds it. Limits: can you see and lower them. Inbox: do replies land where a person will actually answer. Inspectability: send log, pause, export. Seat math: one founder profile versus a pool of senders. License: hosted only, or source you can read.",
          "Safety copy is the weakest criterion if you take it at face value. Every vendor claims safe automation. LinkedIn still owns enforcement. Prefer products that talk about caps, ramps, and what they will not do (no unlimited invites, no purchased accounts) over products that talk about 'military-grade' anything. Ask what happens on a checkpoint. If the answer is 'that never happens,' leave the demo. Read [LinkedIn's user agreement](https://www.linkedin.com/legal/user-agreement) yourself instead of a vendor paraphrase.",
        ],
      },
      {
        heading: "How to run a trial that can fail",
        paragraphs: [
          "Connect one real profile you are allowed to use. Use a segment you already understand, twenty to fifty people, not a 5,000-row dump. Set limits below the default. Read every first-touch note before it sends, at least for a week. Count replies that a human would call interesting, not connection accepts. If the account gets a warning, stop. A trial that only measures 'actions sent' will crown the noisiest tool.",
          "If the missing piece was the list, a sequencer trial will look like a product failure. If the missing piece was follow-up after accept, a finder-only trial will look empty. Write the hypothesis on a sticky note before you start the card.",
        ],
      },
      {
        heading: "When 'best' is a different aisle",
        paragraphs: [
          "Agencies rotating many senders are shopping a different object than a founder sending from one profile. Recruiters sourcing candidates are shopping a different object than a SaaS team booking demos. Official ads software is a different object than any of those. [Omentir](/signup) belongs in a shortlist when the job is LinkedIn send from your own profile, with discovery you can brief, and an inbox you can open. It does not belong on a fake top-ten that also ranks Chrome scrapers.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Why won't you name a number one?",
        answer:
          "Because the number one for an agency sender pool is the wrong buy for a founder who still needs the list. A public rank hides that. Criteria plus a two-week test are slower to read and harder to game.",
      },
      {
        question: "Are paid review sites usable at all?",
        answer:
          "Use them for 'this product exists' and for complaint patterns (billing, support, sudden restrictions). Do not use the score as a decision. Cross-check claims on the vendor site the same week you read the review.",
      },
    ],
  },
  {
    slug: "linkedin-outreach-automation",
    title: "Automating LinkedIn outreach: invites and follow-ups",
    description:
      "Outreach automation is connection requests plus the messages after accept. Volume, note quality, and follow-up timing decide whether you get replies or a restriction.",
    query: "LinkedIn outreach automation",
    kicker: "Outreach",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "LinkedIn outreach automation",
      "automated connection requests",
      "LinkedIn follow-up sequence",
    ],
    sections: [
      {
        heading: "Outreach is a sequence, not a blast",
        paragraphs: [
          "LinkedIn outreach automation usually means: find or import people, send a connection request (with or without a note), wait for accept, then send one or more messages. Some tools add a profile view or a post like before the invite, on the theory that familiarity helps. Treat those extra steps as more account activity, not as free warming. Each step is an action LinkedIn can see.",
          "The invite is the scarce step. People who do not know you have a limited appetite for requests, and LinkedIn has a limited appetite for accounts that mint them all day. A note on the invite is optional. A note that reads like a pitch deck is worse than no note. If you cannot name a specific reason (a post they wrote, a role, a comment), skip the note and earn the first message after they accept.",
        ],
      },
      {
        heading: "Follow-ups are where automation earns its keep",
        paragraphs: [
          "Most of the work is not the first invite. It is remembering to write after someone accepts, then stopping when they reply. A human forgets. Software should not. A simple motion is: invite, wait, thank-you or premise message after accept, one follow-up a few days later if they stay silent, then stop. Infinite nudges train people to ignore you and look like spam to the network. The composer itself is still [LinkedIn](https://www.linkedin.com). Automation is only the schedule around it.",
          "Branching on 'accepted / not accepted / replied' is the useful kind of smart sequence. Branching that keeps talking after a 'not interested' is the useless kind. If the tool cannot stop on reply, you will double-send while you are already in a thread. That is how you look like a bot even when a person is watching the inbox.",
        ],
      },
      {
        heading: "Volume that a person could have done",
        paragraphs: [
          "There is no public LinkedIn number that stays true for every account and every week. New profiles, profiles that just came off a restriction, and profiles with few real conversations should stay far below whatever a vendor's slider allows. Spread actions through the working day. Do not dump the week's invites into one hour because you sat down at the tool. If you use [Omentir](/signup), set the workspace ceilings first and raise them only after a clean stretch. Other sequencers have their own caps. The principle is the same.",
          "Personal branding still matters. An automated motion on a hollow profile (no photo, headline that is only 'CEO | Visionary | Ninja', empty About) gets ignored even when the account stays open. Fix the profile before you attach a campaign. The [profile setup guide](/how-to-create-a-linkedin-profile) is the unglamorous prerequisite.",
        ],
      },
      {
        heading: "What not to automate in outreach",
        paragraphs: [
          "Do not automate a calendar link in the connection request. Do not automate a PDF dump. Do not automate the same paragraph to a VP of Sales and an intern because the CSV said 'decision maker.' Do not keep the campaign running on a profile you borrowed. Outreach automation is a paced outbox. It is not a license to industrialize bad manners.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Should every connection request include a note?",
        answer:
          "Only if the note is specific and short. A generic pitch in the invite is a common way to get ignored. Many operators send a clean invite and put the premise in the first message after accept.",
      },
      {
        question: "How many follow-ups after someone accepts?",
        answer:
          "One thoughtful message and one bump is enough for most cold outreach. If they did not answer, the offer or the targeting is the problem. More bumps will not fix it, and they raise complaint risk.",
      },
    ],
  },
  {
    slug: "linkedin-marketing-automation",
    title: "LinkedIn marketing automation is not 1:1 outbound",
    description:
      "Company-page posting, ads, and employee content are marketing jobs. Personal DMs are outbound. Mixing them in one tool budget is how both motions get worse.",
    query: "LinkedIn marketing automation",
    kicker: "Marketing vs outbound",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "LinkedIn marketing automation",
      "LinkedIn company page scheduling",
      "LinkedIn ads vs outreach",
    ],
    sections: [
      {
        heading: "Marketing owns the page and the ad account",
        paragraphs: [
          "LinkedIn marketing automation, when the words are used carefully, means work on the company Page, Campaign Manager, and sometimes employee advocacy (people sharing approved posts). Scheduling a Page post, routing Page comments, syncing lead-gen forms into a CRM, and pausing ads on budget are operations jobs. LinkedIn documents APIs and partner tools for pieces of that. See [LinkedIn Marketing Solutions](https://business.linkedin.com/marketing-solutions) for the first-party ads and Page products. A social scheduler that posts to the Page is in this aisle. A sequencer that DMs strangers from a personal profile is not.",
          "Teams blur the language because both happen 'on LinkedIn' and both can be automated. The buyer is different. Marketing cares about impressions, form fills, and brand-safe copy on a Page the company owns. Sales cares about accepts, replies, and meetings on a profile a person owns. When you fund one budget line for both, you usually get a mediocre scheduler plus a reckless inbox.",
        ],
      },
      {
        heading: "Content automation has a different risk",
        paragraphs: [
          "A scheduled Page post that is too salesy gets ignored. It rarely locks the CEO's personal account. A personal-profile DM campaign that is too salesy can restrict the human who connected the session. That is why 'marketing automation' vendors who quietly add personal-invite features deserve a separate review. Ask which identity the action runs as: organization Page, ad account, or member profile. If the answer is 'all of them,' split the demo in two and kill the half you did not intend to buy.",
          "Employee advocacy tools that prompt staff to share a post are closer to marketing. They still create member activity. Make participation optional. Never auto-share from someone's profile without them knowing. That is a trust problem inside the company before it is a LinkedIn problem.",
        ],
      },
      {
        heading: "Ads are already a machine",
        paragraphs: [
          "Campaign Manager is LinkedIn's own automation for paid distribution. Lead-gen forms, audience templates, and conversion tracking belong there. Buying a third-party 'LinkedIn marketing automation' product to replace ads usually means you wanted reporting or creative workflow, not a new media channel. Keep the ad account in LinkedIn. Pipe leads to the CRM with a documented integration. Do not launder paid leads into a personal DM sequence on day zero. People who just filled a form do not need a cold invite from a stranger on the same day.",
        ],
      },
      {
        heading: "When outbound still belongs in the plan",
        paragraphs: [
          "Outbound from personal profiles can support marketing when the Page has no audience yet, or when the deal is high-touch and the buyer lives in LinkedIn DMs. It remains a sales motion. Staff it like sales: limits, a human on replies, an offer that matches the Page's public story. If marketing wants meetings from DMs, they are asking sales to run outreach. Call it that. Do not hide it under a content calendar.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Can I schedule posts and automate DMs in one product?",
        answer:
          "You can find vendors who sell both. You should still evaluate them as two products. Page scheduling and personal outreach fail differently and are owned by different people.",
      },
      {
        question: "Is a LinkedIn newsletter marketing automation?",
        answer:
          "A newsletter is publishing. Some tools help you draft or schedule. It is not invite automation. Keep the subscriber promise. Do not use a newsletter send as cover for a scrape of the reader list into a cold sequence.",
      },
    ],
  },
  {
    slug: "linkedin-message-automation",
    title: "InMail, connection notes, and messages after accept",
    description:
      "LinkedIn message automation mixes three channels with different limits and manners. InMail, the invite note, and the after-accept DM are not interchangeable.",
    query: "LinkedIn message automation",
    kicker: "Messages",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "LinkedIn message automation",
      "LinkedIn InMail vs message",
      "automated LinkedIn DMs",
    ],
    sections: [
      {
        heading: "Three boxes that look like 'a message'",
        paragraphs: [
          "A connection note rides on the invite. It is short. LinkedIn caps the length in the composer (confirm the current limit there; it has been tight for years). The person has not accepted you yet. A pitch in that box is asking a stranger to approve a salesperson. An after-accept message is a normal DM in the thread that opens when they say yes. You have more room, and they opted into a conversation by accepting. InMail is a paid or credit-based message to someone you are not connected to, packaged with Sales Navigator, Recruiter, or purchased credits. It has a subject line. It is closer to email than to a handshake. Confirm current InMail packaging on [Sales Navigator](https://business.linkedin.com/sales-solutions/sales-navigator).",
          "Automation tools love to collapse these into one 'step' called Message. That is how you burn InMail credits on a template that belonged in a DM, or stuff a 1,200-character manifesto into an invite note and watch it get truncated. Configure the step for the box it actually writes to.",
        ],
      },
      {
        heading: "What to put in each box",
        paragraphs: [
          "Invite note: one specific reason, or nothing. After-accept: the premise and a small ask (a question, a resource, not a 30-minute hold). InMail: use it when the person is the right buyer and you cannot connect, or when their settings block invites. InMail copy should still sound like a person. A subject line that reads like a banner ad wastes a credit.",
          "If you automate any of these from your own profile, you still own the words. [Omentir](/signup) can draft and send campaign messages from a connected account with reply modes you choose. It will not invent InMail credits LinkedIn did not give you. Other sequencers that advertise InMail steps will spend whatever credits sit on that seat. Check the seat before you turn the step on.",
        ],
      },
      {
        heading: "Replies are not a channel. They are a stop condition.",
        paragraphs: [
          "Message automation that cannot see an inbound reply will keep talking. That is the classic double-send. The product needs to pull the thread, classify 'they answered,' and pause that person. Human review on the first few dozen replies teaches you whether the model (or the template) is overclaiming. After that, you can loosen. You cannot skip the week where you read them.",
          "Group messages, event messages, and Open Profile extras are more boxes with more rules. Do not assume a sequencer that handles DMs also handles those correctly. If the campaign targets event attendees, confirm that the step is the event's own message path, not a generic DM that LinkedIn will reject.",
        ],
      },
      {
        heading: "Credits, caps, and complaints",
        paragraphs: [
          "InMail unused credits and refill rules are a LinkedIn packaging question. Confirm them in Sales Navigator or Recruiter, not in a vendor blog post from 2022. DM volume still counts as account activity even when InMail is not involved. Complaints ('I don't know this person, they pitched me') are how accounts get a reputation. Automation makes it easier to create that reputation at scale. The fix is targeting and copy, not a friendlier send time.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is InMail better than a connection request?",
        answer:
          "It is different. InMail reaches people you are not connected to and costs a credit. A request is a network action. For most cold outbound, a clean invite plus a DM after accept is the default. Save InMail for people you cannot reach that way.",
      },
      {
        question: "Can I automate Open Profile messages the same way?",
        answer:
          "Only if the tool supports that path and the member has Open Profile. Treat it as another unofficial automation surface with the same account risk. Do not assume every sequencer implements it.",
      },
    ],
  },
  {
    slug: "linkedin-lead-generation-automation",
    title: "Lists, commenters, and filters: automating LinkedIn lead gen",
    description:
      "Lead generation automation on LinkedIn is how the names get into the campaign. Uploaded lists, search filters, and commenters are three different inputs.",
    query: "LinkedIn lead generation automation",
    kicker: "Lead generation",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "LinkedIn lead generation automation",
      "LinkedIn commenter leads",
      "Sales Navigator filters",
    ],
    sections: [
      {
        heading: "The list is the campaign",
        paragraphs: [
          "Automating lead generation on LinkedIn is not the same as automating the send. Generation is how people enter the bucket. If the bucket is a purchased CSV of titles, you have a list, not a signal. If the bucket is a saved Sales Navigator search you refresh, you have filters. If the bucket is people who commented on a competitor's post, you have a reason to write. Sequencers will happily run all three. Only one of them usually explains why the person should hear from you this week.",
          "Teams skip this distinction because uploading a file feels like progress. It is progress for the send tool. It is not progress for the market. Measure the source: reply rate by origin (CSV versus filter versus commenters) after two weeks. Kill the source that produces polite ignores.",
        ],
      },
      {
        heading: "Filters are a craft",
        paragraphs: [
          "Sales Navigator and LinkedIn search let you combine title, geography, company headcount, and other fields. That craft is real. It is also how people build lists that look precise and still miss the buying moment. 'VP of Sales at 50 to 200 person SaaS in the US' is a query. 'VP of Sales who just hired two SDRs' is a moment. Filters will not always see the moment. Do not throw away filters. Do not worship them. Exporting a perfect Boolean into a sequencer does not make the Boolean a conversation. [Sales Navigator](https://business.linkedin.com/sales-solutions/sales-navigator) is the paid search product. It still does not send the note for you.",
          "Automation on top of filters usually means: rerun the search, drop new people into a group, de-dupe against who you already contacted. That is a fair use of software. Crawling search result pages at inhuman speed to capture everyone is the scrape version of the same idea. The second version is louder on the account.",
        ],
      },
      {
        heading: "Commenters are a reason",
        paragraphs: [
          "Someone who commented on a post about a problem you solve has done you a favor: they raised their hand in public. Automating the capture of those names (post URL in, people out) is a finder job. The message should mention the post, not a generic ICP line. If you cannot see the comment, you do not have the reason. Do not pretend a commenter list is 'intent' in the marketing-ops sense. It is a warmer cold than a title dump. It is still outreach.",
          "Volume still matters. A viral post can throw thousands of names. You will not write a good note to thousands this week. Cap the intake. Quality of comment (a real sentence versus a pile of emojis) is a filter a human can apply faster than most models.",
        ],
      },
      {
        heading: "What not to automate in generation",
        paragraphs: [
          "Do not scrape emails off profiles and drop them into a cold email tool as if LinkedIn were a data vendor you licensed. Do not auto-add every connection's coworker. Do not treat 'viewed my profile' as a buying signal worth a sequence by itself. Lead gen automation should make the next twenty names better, not make the CRM larger. If the CRM is already a graveyard, stop generating until you can say why the last fifty were in there.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is a Sales Navigator export automated lead gen?",
        answer:
          "It is a filtered list. Automating the rerun and the de-dupe is the automation. The export button is not a strategy. Pair it with a send motion you can pace, or the export sits in a spreadsheet.",
      },
      {
        question: "Are commenter tools allowed?",
        answer:
          "They automate activity on LinkedIn. That sits in the same unofficial bucket as other profile automation. Use conservative volume and a real reason in the note. LinkedIn can still restrict the looking account.",
      },
    ],
  },
  {
    slug: "linkedin-api",
    title: "Official LinkedIn APIs versus unofficial access",
    description:
      "LinkedIn's developer platform covers ads, some Page features, auth, and partner programs. Personal invite bots and scrapers are a different, riskier category.",
    query: "LinkedIn API",
    kicker: "Developer APIs",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "LinkedIn API",
      "LinkedIn Marketing API",
      "LinkedIn unofficial API",
      "Sales Navigator API",
    ],
    sections: [
      {
        heading: "Start in the docs, not in a GitHub gist",
        paragraphs: [
          "The [LinkedIn Developer docs](https://learn.microsoft.com/en-us/linkedin/) are the source of truth for what Microsoft will issue tokens for. Today that public story includes Sign In with LinkedIn (OpenID), Marketing Developer Platform for ads and related advertising objects, Community Management APIs for organization Pages, and other products that require a developer application and, often, an access request. Sales Navigator has a partner program (SNAP) for approved integrations. None of that is a secret. None of that is a personal-inbox takeover.",
          "If you are building a product, you apply, you scope permissions, you pass review for the APIs that require it, and you live inside rate limits. If your product idea is 'send 200 connection requests a day from the user's profile,' the docs will not hand you that endpoint. That is the whole article for a lot of startups, and it is the one they skip.",
        ],
      },
      {
        heading: "What official APIs are for",
        paragraphs: [
          "Marketing APIs are how a legitimate ads tool creates campaigns, pulls reporting, and syncs audiences without scraping Campaign Manager. Community Management is how a social inbox might read and reply to comments on a company Page the company administers. Sign In with LinkedIn is how a member proves who they are to your app without you storing a password. Partner Sales APIs, where granted, are how a CRM might show Navigator data to a rep who already pays for Navigator.",
          "Those are integrations. They assume the user or the company already has the LinkedIn product (an ad account, a Page admin role, a Navigator seat). They do not replace LinkedIn. They sit next to it.",
        ],
      },
      {
        heading: "What unofficial usually means",
        paragraphs: [
          "Unofficial access means a session cookie, a mobile-app protocol, a browser bot, or a third-party 'LinkedIn API' vendor that is not in Microsoft's partner list for that action. The engineering can be tidy. The terms are still LinkedIn's. Detection, checkpoints, and account restriction are the enforcement mechanisms. A wrapper that encrypts the cookie is a security choice. It is not permission.",
          "Libraries on GitHub that 'just work' against linkedin.com will break when LinkedIn changes an internal endpoint. They also tend to concentrate risk: one shared integration pattern becomes easy to fingerprint. If you ship that in a SaaS, you are in the automation-software business, with all of the account-risk honesty that category requires. Do not tell customers it is official.",
        ],
      },
      {
        heading: "How to ask a vendor the only useful question",
        paragraphs: [
          "Ask: 'Which LinkedIn product and which documented API, or is this session-based automation?' Demand a docs URL. If they say 'we use an API partner' for member DMs, ask whether that partner is a Microsoft-listed SNAP or Marketing partner for that use case, or a messaging gateway that holds sessions. The second can be a reasonable architecture for a sequencer. It is still unofficial relative to LinkedIn's public developer platform. Your security review should treat it that way: token handling, data residency, and what you will do when LinkedIn locks a profile.",
        ],
      },
      {
        heading: "What not to build",
        paragraphs: [
          "Do not scrape the graph to resell contacts. Do not store member passwords. Do not market a reverse-engineered client as 'the LinkedIn API.' If your use case fits Marketing or Community Management, build that and apply. If it does not, you are choosing unofficial automation on purpose. Write that down for your users instead of hiding it in a compliance footnote.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is there an official API for connection requests?",
        answer:
          "Not as a public, self-serve outreach API for member profiles. If a partner program exists for a narrow use case, it will be documented and gated. Assume no until Microsoft's docs say yes.",
      },
      {
        question: "Does using OAuth mean my outreach tool is official?",
        answer:
          "OAuth for Sign In with LinkedIn proves identity. It does not authorize bulk invites. Official status is about the product and permission, not about whether a token looks like OAuth.",
      },
    ],
  },
  {
    slug: "expandi",
    title: "What Expandi is and who it fits",
    description:
      "Expandi is cloud LinkedIn sequence software for lists you typically already have. This page covers the job it sells, who buys it, and the account risk that stays yours.",
    query: "Expandi",
    kicker: "Product explainer",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["Expandi", "Expandi LinkedIn", "cloud LinkedIn sequences"],
    sections: [
      {
        heading: "A cloud sequencer, not a Chrome tab",
        paragraphs: [
          "[Expandi](https://expandi.io) sells cloud LinkedIn automation: you connect accounts, import or build audiences, and run sequences (invites, messages, follow-ups, and other steps they document on their site) from their infrastructure instead of a browser extension sitting on linkedin.com. Their public story also includes email follow-up, a shared inbox, agency-style roles, and 'smart sequences' that branch on prospect behavior. Confirm what ships today on expandi.io. Cloud LinkedIn products change, and a frozen feature grid on someone else's blog goes stale.",
          "The important architectural claim is cloud versus extension. The session is not a tab you left open. That removes one class of DOM-click failures. It does not make LinkedIn an official partner for personal outreach. The account is still a member profile acting at machine pace.",
        ],
      },
      {
        heading: "Who it fits",
        paragraphs: [
          "Expandi fits teams that already have a list (CSV, search export, agency supply) and want a sequencer with branching, reporting, and a place to answer replies. Their site talks to lead-gen agencies, sales teams, and recruiters. Agency packaging (roles, white-label mentions, many seats) is part of how they sell. If your pitch to clients is 'we run LinkedIn sequences on the names you give us,' you are in their aisle.",
          "It is a weaker fit if the problem is that you do not know who to contact. A sequencer will not invent an ICP. It is also a weaker fit if you needed official Marketing APIs for ads, or a workflow tool that talks to twenty internal systems and only incidentally posts a Slack message. That is [n8n](/n8n), not Expandi.",
        ],
      },
      {
        heading: "How to evaluate it without a fan page",
        paragraphs: [
          "On a trial: connect one account you own, import a small list you understand, set limits below whatever they recommend for a warmed profile, and read the first-touch copy. Ask how they handle checkpoints, duplicate suppression, and pausing on reply. Ask where email sits if you do not want a second channel yet. Do not treat their comparison tables against other sequencers as scripture. Those tables are marketing.",
          "Account risk remains. LinkedIn can restrict a profile that uses any unofficial automation, including cloud. Warm a quiet account. Do not max seats on day one. If a recent restriction is on the profile, wait. Expandi's own help content, historically, has told people to ramp. Listen to that even if a sales call talks about scale.",
        ],
      },
      {
        heading: "Same aisle, different logo",
        paragraphs: [
          "HeyReach, Dripify, and other cloud sequencers compete for the same job: steps on a list. Shopping Expandi versus those products on UX, price per seat, inbox, and current safety packaging is legitimate. Shopping them as if one were a lead-finding workspace is not. For that contrast, see the [HeyReach versus Expandi](/comparisons/heyreach-vs-expandi) page on this site, which exists to stop people averaging two sequencers with a discovery tool.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Does Expandi use the official LinkedIn API?",
        answer:
          "Treat it as cloud automation of member accounts unless Expandi points you at a Microsoft-documented partnership for the exact action (invite, DM). Cloud is not the same as official. Ask them, then read LinkedIn's developer docs.",
      },
      {
        question: "Do I need Sales Navigator to use Expandi?",
        answer:
          "Expandi's own FAQ has said Navigator is optional. Navigator helps some teams build lists. It is not the sequencer. Confirm the current answer on their site.",
      },
    ],
  },
  {
    slug: "dripify",
    title: "What Dripify is and who it fits",
    description:
      "Dripify is LinkedIn (and email) outreach automation aimed at sequences you can build visually. It sits in the sequencer aisle, not the official API aisle.",
    query: "Dripify",
    kicker: "Product explainer",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["Dripify", "Dripify LinkedIn", "LinkedIn drip campaigns"],
    sections: [
      {
        heading: "A sequencer with a drip-campaign pitch",
        paragraphs: [
          "[Dripify](https://dripify.io) markets itself as LinkedIn automation for outreach, with email campaigns in the same product story: a visual builder, steps and conditions, a dedicated inbox, team roles, and personalization variables. Their homepage also talks about finding business emails for LinkedIn prospects and about multiple lead sources. That is the aisle. You bring or collect names, then you run a drip: invite, wait, message, maybe email.",
          "The name is the honest part. Drip campaigns are timed follow-ups. If your current process is a spreadsheet and a calendar reminder, Dripify is trying to be that machine. If your current process is 'we do not know who the buyer is,' a prettier drip will not help.",
        ],
      },
      {
        heading: "Who it fits",
        paragraphs: [
          "It fits individual reps and small teams who want a campaign UI that is easier to explain than a pile of Chrome extensions, and who will actually live in the inbox when people reply. Team features (shared templates, not hitting the same lead twice) matter once two people send from the same market. It also fits operators who want email in the same sequence after they have a address. Confirm current connectors and limits on dripify.io. Do not freeze a pricing page from a third-party roundup.",
          "It is a weaker fit for companies that need a white-label agency platform as the core buy (other sequencers lean harder into that), for people who only needed Page posting, and for engineering teams that wanted a general workflow engine. Dripify is not [n8n](/n8n). It is not Campaign Manager.",
        ],
      },
      {
        heading: "What their marketing will not decide for you",
        paragraphs: [
          "Like every sequencer, Dripify publishes outcome numbers from customers. Those numbers are not your numbers. Reply rate follows list quality and offer quality. A  trial on a bad CSV will look like a product defect. Run a small, honest list. Watch whether the builder matches the boxes you actually need (invite note versus after-accept DM versus email). Watch whether the inbox makes it obvious when someone replied so the drip stops.",
          "Account risk is the same family as [Expandi](/expandi) and every other unofficial LinkedIn sender. Conservative daily volume, a complete profile, and a human on messy threads. LinkedIn can still restrict the account. No vendor in this aisle can honestly sell immunity.",
        ],
      },
      {
        heading: "Dripify versus 'we will just use an extension'",
        paragraphs: [
          "People land here after Dux-Soup, Linked Helper, or a free extension got a warning. Moving to a dedicated SaaS sequencer can be a session-handling upgrade. It is not a strategy upgrade. You still need a list, a premise, and a cap. If the extension failed because the copy was spam, Dripify will send the same spam more reliably.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is Dripify a Chrome extension?",
        answer:
          "They sell a SaaS outreach product with a campaign builder and inbox. Confirm how you connect LinkedIn and whether any browser component is required on their current setup docs. Do not assume it is the same object as a DOM-click extension.",
      },
      {
        question: "Can Dripify replace my CRM?",
        answer:
          "No. It is an outreach sequencer with integrations. Keep the CRM as the record of the deal. Use Dripify (or any sequencer) as the LinkedIn and email outbox, then sync what you must.",
      },
    ],
  },
  {
    slug: "n8n",
    title: "n8n is workflow automation, not a LinkedIn sequencer",
    description:
      "n8n is an open workflow tool: triggers, nodes, and code when you need it. You can call official APIs you already have. It is not a LinkedIn invite product.",
    query: "n8n",
    kicker: "Workflow tools",
    cluster: "general",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["n8n", "n8n workflow automation", "n8n LinkedIn"],
    sections: [
      {
        heading: "What you actually install",
        paragraphs: [
          "[n8n](https://n8n.io) is a workflow automation platform for technical teams. You build graphs: a trigger (webhook, schedule, app event), then nodes that transform data, call APIs, write to a database, or ping Slack. You can write JavaScript or Python in a step when the visual node is not enough. You can self-host (Docker is the common path) or use their hosted product. The source is public. That is the object. It is closer to Zapier or Make in job-to-be-done, with more of an engineering bias: git, environments, code in the graph.",
          "People search 'n8n LinkedIn' because they want a cheap sequencer. n8n will not give you a LinkedIn warmup policy, a native invite inbox, or a campaign UI that understands connection notes versus InMail. It will give you HTTP Request nodes and a community of packages. Those are different gifts.",
        ],
      },
      {
        heading: "Where n8n is the right tool",
        paragraphs: [
          "Ops examples that fit: a form fill hits a webhook, n8n enriches the row, writes the CRM, and opens a Slack message for a human. A won deal in Salesforce provisions a seat in another system. A support ticket gets a lookup in three tools and a drafted reply for review. Security and IT teams use it for the same pattern with different systems. If you can describe the work as 'when X, do Y in Z, then tell a person,' n8n is in the shortlist.",
          "AI steps exist in the product story (calling models, evaluating outputs). Treat those as nodes with failure modes, not as a salesperson. Keep a human on anything that leaves your company as a message to a customer.",
        ],
      },
      {
        heading: "Where LinkedIn enters, and where it should not",
        paragraphs: [
          "You can call official LinkedIn APIs from n8n if you have an app, tokens, and a use case the [developer docs](https://learn.microsoft.com/en-us/linkedin/) allow: ads reporting into a warehouse, Page comment routing, Sign In callbacks. That is integration work. It is allowed to the extent LinkedIn granted the scopes.",
          "Community nodes or DIY cookie flows that log into a member profile and send invites are unofficial automation with the same account risk as any sequencer, plus you are now the vendor. n8n will not save you from a restriction. It will make the restriction more reproducible. Do not run that on a profile you care about unless you are deliberately in the LinkedIn automation business and you understand the terms.",
        ],
      },
      {
        heading: "n8n versus a sequencer versus a workspace",
        paragraphs: [
          "Buy n8n when the bottleneck is glue between systems you already pay for. Buy a LinkedIn sequencer when the bottleneck is paced invites on a list. Buy a LinkedIn workspace when the bottleneck is finding the people and sending from a profile with an inbox. Forcing n8n to be the sequencer usually means a weekend of nodes that recreate 10% of Expandi and 0% of the safety UI. Use n8n to push 'reply received' into the CRM after a real LinkedIn tool did the sending.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is n8n free?",
        answer:
          "The software can be self-hosted under its license terms, which you should read on n8n's site and GitHub. Hosted n8n is a paid product. Self-hosting still costs your time, servers, and the credentials of every app you connect.",
      },
      {
        question: "Can n8n replace Zapier for a non-technical team?",
        answer:
          "Sometimes, if someone on the team will own the graphs. n8n rewards people who debug JSON. If nobody will, a simpler hosted connector tool may fail less often, at the cost of flexibility.",
      },
    ],
  },
  {
    slug: "workflow-automation",
    title: "Workflow automation: the ops definition, then sales",
    description:
      "Workflow automation is trigger, steps, and a system of record. In sales it might mean CRM hygiene or a Slack ping. It is not a synonym for LinkedIn sequencers.",
    query: "workflow automation",
    kicker: "Operations",
    cluster: "general",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "workflow automation",
      "sales workflow automation",
      "ops automation",
    ],
    sections: [
      {
        heading: "A workflow is a path with an owner",
        paragraphs: [
          "Workflow automation means a repeatable path: something happens (a form, a status change, a clock), software does steps that used to live in someone's head or in a SOP, and a system of record ends in a known state. The point is not 'bots.' The point is that the tenth time a deal is marked Closed Won, provisioning does not depend on who was in Slack that afternoon. IT, finance, support, and sales all have these paths. The tools differ. The shape does not. Open-source builders such as [n8n](https://n8n.io) sit in this aisle. LinkedIn sequencers do not.",
          "Good workflow design names the trigger, the happy path, the failure path, and the human exception. If you cannot name the exception ('legal has to look at this,' 'the customer asked for a custom DPA'), you will automate a lie and then staff a person to clean it up. Write the exception first.",
        ],
      },
      {
        heading: "What it is not",
        paragraphs: [
          "It is not RPA as a personality. Screen-scraping a vendor's UI because they have no API is a last resort, brittle, and often against that vendor's terms. It is not an AI agent that 'handles email' with no audit trail. It is not a LinkedIn sequencer, even though sequencers contain a workflow (invite, then message). Collapsing every sequence into 'workflow automation' is how you get an n8n graph pretending to be Expandi, or a sequencer pretending to be your CRM.",
          "It is also not a replacement for a process you have not agreed on. Automating a messy handoff between marketing and sales just makes the mess faster. Sit the two teams down. Then draw the graph.",
        ],
      },
      {
        heading: "Sales examples that are actually workflows",
        paragraphs: [
          "A lead-gen form in Campaign Manager creates a CRM contact, assigns an owner by territory, and posts a Slack line with the form answers. A LinkedIn reply that a sequencer marked as interested creates a task with the thread link, not a second automated pitch. A closed-won deal creates the customer workspace, the invoice, and a kickoff event. A no-show on the calendar waits one day, then asks the rep to send a human note, not a four-step guilt sequence.",
          "Notice what those examples share: the system of record is the CRM or the calendar, and LinkedIn is an input or an output, not the workflow engine. [n8n](/n8n), Zapier, Make, Workato, and native CRM automation (HubSpot workflows, Salesforce Flow) all compete for this glue. Pick based on who will maintain the graph, where the data must live, and whether you need on-prem.",
        ],
      },
      {
        heading: "How to introduce automation without boiling the company",
        paragraphs: [
          "Pick one path that already happens ten times a week and hurts when it fails. Measure the failure (missed follow-up, duplicate contact, forgotten provision). Automate that path. Leave the adjacent paths manual for a month. If nobody can explain the graph in standup, it is too clever. If the graph cannot be paused, it is too dangerous. Workflow automation that cannot be turned off is just a new outage type.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is a LinkedIn sequence workflow automation?",
        answer:
          "It contains a workflow, but the product category is outreach automation. You buy it for invites and DMs, with account risk attached. You buy workflow software to move records between systems you already trust.",
      },
      {
        question: "Should we start with AI in the workflow?",
        answer:
          "Start with deterministic steps (copy this field, if status is X then Y). Add a model where the input is messy language and a human reviews the output. Putting a model on a clean status change is how you get expensive randomness.",
      },
    ],
  },
  {
    slug: "how-to-create-a-linkedin-profile",
    title: "How to create a LinkedIn profile people will accept",
    description:
      "A practical LinkedIn profile setup: photo, headline, About, experience, custom URL, and the settings that affect whether strangers accept a request from you.",
    query: "how to create a LinkedIn profile",
    kicker: "Profile setup",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "how to create a LinkedIn profile",
      "LinkedIn profile setup",
      "LinkedIn headline examples",
    ],
    sections: [
      {
        heading: "Create the account like a person, not a brand sockpuppet",
        paragraphs: [
          "Go to [LinkedIn](https://www.linkedin.com), register with an email you control, and use your real name. Profiles that exist only to send invites get reported. If you are setting this up for work, it is still your name. Add a current role you actually hold. If you are a founder, say founder at the company, not 'Visionary.' LinkedIn will ask for location and a few interests. Pick the location buyers would expect. You can change it later. Confirm the email so you are not locked out on the first checkpoint.",
          "Turn on two-step verification in Settings. Recovering a sales profile without it is a miserable afternoon. Review sign-in notifications. If you later connect any outreach software, you want to know when a new session appears.",
        ],
      },
      {
        heading: "Photo, banner, and the first screen",
        paragraphs: [
          "Use a recent headshot where your face is visible. No logo as the avatar. No group photo. No sunglasses. The banner can be simple: product, city, or a plain field. People decide in a second whether you look like a real counterpart. A hollow visual is a filter for 'this invite is automated,' even when it is not.",
          "The headline is not a job title dump. It is the line under your name in search and in the invite. State who you help and what you work on. 'Head of sales at Acme' is acceptable. 'Helping Series A ops teams cut month-end close' is more useful if that is true. Keyword stuffing ('CEO | Speaker | Investor | Ninja') reads as 2014. LinkedIn shows a limited number of characters here. Write the important clause first.",
        ],
      },
      {
        heading: "About, experience, and proof",
        paragraphs: [
          "Write the About section in first person, in sentences you would say on a call. First three lines matter because they show before 'see more.' Say what you sell or what you do, who it is for, and how to reach you if you want inbound. Skip the novel. Skip the quote from a famous founder.",
          "Experience should match reality. For each role, a few bullets with outcomes beat a paragraph of duties. Link the company Page if it exists so the logo shows. Add the Featured section only if you have a URL worth clicking (a product, a talk, a post that explains the offer). Empty Featured is better than a random Zoom recording. Skills and recommendations are optional. A couple of specific recommendations from people you worked with help more than fifty self-assigned skills.",
        ],
      },
      {
        heading: "URL, buttons, and privacy",
        paragraphs: [
          "Set a custom public URL (linkedin.com/in/yourname) in the profile settings so you can put it on a calendar invite and a slide. Open the contact info box and add a work email you read. On the profile, LinkedIn may show a button (visit website, book an appointment) depending on current features and your role. Use a website if you have one. Do not paste a calendar link as the only identity.",
          "In Settings, look at profile viewing options, who can see your email, and whether you want to broadcast every profile edit to your network. For a new profile, turning off 'share profile updates' keeps you from notifying people while you still have 'Student at' leftover from an old draft. Read LinkedIn's own help for Open Profile, creator mode, and 'Open to work' versus 'Providing services.' Those toggles change how you appear. They are not a lead-gen strategy by themselves.",
        ],
      },
      {
        heading: "Before you send any invites",
        paragraphs: [
          "Connect with people you actually know first. A new graph that is only strangers is a pattern. Comment in your own words on a few posts in your market. Then, if you do outbound, start slow. A complete profile will not save a spam note, but an incomplete one will sink a good note. This is setup, not a campaign.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Should I use a company Page instead of a personal profile?",
        answer:
          "A Page is for the company. People connect with people. Outbound DMs and connection requests run on a member profile. Keep both. Do not try to send personal invites as the Page.",
      },
      {
        question: "How long should the About section be?",
        answer:
          "Long enough to say who you help and what is true, short enough that a stranger will finish it. If you need a scroll, move detail into Featured or a website. The first three lines do most of the work.",
      },
    ],
  },
  {
    slug: "linkedin-news",
    title: "How to follow LinkedIn news without the rumor mill",
    description:
      "LinkedIn news is a mix of official product posts, the LinkedIn News editorial feed, and Twitter threads about 'the algorithm.' Here is how to tell them apart.",
    query: "LinkedIn news",
    kicker: "Product news",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "LinkedIn news",
      "LinkedIn product news",
      "LinkedIn News editorial",
    ],
    sections: [
      {
        heading: "There are several things called news",
        paragraphs: [
          "LinkedIn News is an editorial product: journalists and editors on LinkedIn package headlines, often with a daily briefing, in the app and on the web. That is journalism about the world, distributed on LinkedIn. It is not a changelog of the LinkedIn app. Separately, LinkedIn the company publishes product and policy posts on its own blog, in the Help Center, in the app's What's New surfaces, and on organization Pages such as LinkedIn for Marketing or LinkedIn Engineering. Those are first-party. Then there is the rumor mill: creators posting 'LinkedIn just killed DMs' because their impression count dipped on a Tuesday.",
          "If you sell on LinkedIn or you build on LinkedIn, you need the first-party channel. The editorial News feed is optional, the way any newspaper is optional. The rumor mill is optional and expensive in attention.",
        ],
      },
      {
        heading: "A small list of first-party places",
        paragraphs: [
          "Bookmark [LinkedIn Help](https://www.linkedin.com/help) and search before you believe a screenshot. Bookmark the [developer docs](https://learn.microsoft.com/en-us/linkedin/) if you build integrations. Follow LinkedIn's official company Page and the marketing/sales Pages they operate. The [LinkedIn blog](https://blog.linkedin.com) is where they still put a lot of product narrative. News.linkedin.com is the editorial News brand, useful if you wanted world headlines, easy to confuse with product news if you only remember the word 'news.'",
          "In the product, open Settings and look for What's New, and watch the announcements LinkedIn shows when they roll a feature to your account. Rollouts are staggered. Your UI can differ from a creator's screenshot in another country for weeks. That gap is how rumors start.",
        ],
      },
      {
        heading: "How to read a viral 'LinkedIn changed' post",
        paragraphs: [
          "Ask whether the author links a Help article, a blog post, or a developer changelog. If the evidence is 'my impressions fell 40%,' that is their account, their content mix, and a feed that was never a stable contract. Feeds optimize for time spent. They do not publish a spec that says your carousel will always win. Seasonal usage, topic fatigue, and a single bad hook explain more dips than a secret penalty.",
          "If the claim is about automation or scraping, treat it as likely directionally true that LinkedIn dislikes unofficial bots, and still verify the specific mechanic. Detection changes. A thread that says 'cloud tools are safe now' is not a policy. LinkedIn's user agreement is the policy. Enforcement is the weather.",
        ],
      },
      {
        heading: "A weekly habit that stays small",
        paragraphs: [
          "Once a week, skim Help search for a feature you actually use (InMail, Pages, ads, Search). Skim the blog if you run ads or a Page. Ignore algorithm Twitter unless a first-party post confirms it. If you run outbound, do not rewrite your sequence on a rumor. Change copy when replies drop, not when a creator needs a hook. For product-by-product change tracking, the [LinkedIn updates](/linkedin-updates) guide is the companion to this one.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is LinkedIn News the same as LinkedIn's product blog?",
        answer:
          "No. LinkedIn News is an editorial headlines product. The company blog and Help Center are where product and policy usually land. People confuse them because both use the word news.",
      },
      {
        question: "Should I follow LinkedIn engineers on the platform?",
        answer:
          "Useful for infrastructure and sometimes for feature context. Still second to Help and official blog posts when you need to know what shipped for customers. Engineers post opinions. Docs post behavior.",
      },
    ],
  },
  {
    slug: "linkedin-updates",
    title: "LinkedIn updates: changelog versus algorithm gossip",
    description:
      "Real LinkedIn updates live in Help, What's New, and developer notes. Algorithm gossip is a content genre. Do not rebuild your outbound motion on the genre.",
    query: "LinkedIn updates",
    kicker: "Product changes",
    cluster: "linkedin",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "LinkedIn updates",
      "LinkedIn changelog",
      "LinkedIn algorithm changes",
    ],
    sections: [
      {
        heading: "Updates are shipped features, not vibes",
        paragraphs: [
          "A LinkedIn update, in the useful sense, is a change to the product you can point at: a new ads object, a Help article that describes a setting, a What's New card in the app, a developer changelog entry, a Sales Navigator release note. Those have dates and surfaces. 'The algorithm hates carousels now' is not an update. It is a guess about a ranking system LinkedIn does not publish as a contract. You can believe the guess. You cannot QA it like a feature flag.",
          "Companies that depend on LinkedIn (ads teams, social teams, sales teams, app developers) should track the first kind in a shared doc: date, source URL, what changed, who it affects, what you will do. The second kind can live in a Slack channel you are allowed to mute.",
        ],
      },
      {
        heading: "Where changelogs actually appear",
        paragraphs: [
          "Help Center articles get revised. Search the feature name plus 'update' and check the article date. In-app What's New is the closest thing most members get to a changelog, and it is personalized, which means your teammate may see a card you do not. Marketing and Sales blog posts announce packaging (new Navigator UI, new Campaign Manager). Developer updates live next to the [LinkedIn Developer docs](https://learn.microsoft.com/en-us/linkedin/) and in the developer portal for apps you own. If you pay for Navigator or Recruiter, look at those products' own release notes rather than a generic 'LinkedIn updates 2026' roundup.",
          "Third-party 'LinkedIn changelog' newsletters can be a useful index. Click through to the first-party URL before you change a process. If they cannot cite one, it is an opinion piece.",
        ],
      },
      {
        heading: "What to do when something real ships",
        paragraphs: [
          "If LinkedIn adds a setting that affects invites, messages, or search, read the Help article, then test on one account. Do not roll a policy across twelve seats overnight. If they change InMail packaging, finance and sales ops need to see the seat math before reps feel it. If they change Page analytics, marketing needs a screenshot of the old dashboard for the board deck that still uses last quarter's chart.",
          "If you use unofficial automation, a real update to detection or to the web app can break a vendor without a press release. That is a vendor-risk item. Ask the vendor how they watch LinkedIn changes. 'We have AI' is not an answer. 'We paused sends last Tuesday because markup moved' is an answer.",
        ],
      },
      {
        heading: "Gossip that keeps costing people weeks",
        paragraphs: [
          "Recurring genres: 'text-only posts are dead,' 'LinkedIn is becoming TikTok,' 'dwell time is the only metric,' 'comment pods work,' 'comment pods are banned as of this morning.' Some of these have a grain of product direction (LinkedIn has shipped more video surfaces). None of them should rewrite a B2B outbound sequence. Outbound lives or dies on who you contacted and what you said. Creative format experiments belong on the Page and on your personal posts, measured with a simple A/B you can stand, not with a guru's carousel about carousels.",
          "When gossip and a real changelog collide, the changelog wins. When there is no changelog, wait. Feeds fluctuate. A two-week dip is not a strategy meeting. For how to subscribe to first-party news without drowning, see [LinkedIn news](/linkedin-news).",
        ],
      },
    ],
    faqItems: [
      {
        question: "Does LinkedIn publish an algorithm changelog?",
        answer:
          "Not in the way a developer would want. They publish product announcements and occasional research or engineering posts. Ranking details stay internal. Anyone selling a complete algorithm spec is guessing.",
      },
      {
        question: "Should outbound pause when LinkedIn ships a big UI change?",
        answer:
          "Pause if your tool breaks or if you see checkpoints. A cosmetic UI change is not a reason to stop a paced campaign. Watch the send log for errors, then continue.",
      },
    ],
  },
];
