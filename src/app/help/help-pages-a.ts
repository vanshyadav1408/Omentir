import type { HelpPageDraft } from "./types";

const DATE = "August 19, 2026";

export const HELP_PAGES_A: HelpPageDraft[] = [
  {
    slug: "how-many-linkedin-connection-requests-per-week",
    question: "How many LinkedIn connection requests can I send per week?",
    description:
      "LinkedIn does not publish a fixed weekly invite number. Here is what it does say, what operators usually see, and a safer pace to plan around.",
    keywords: [
      "LinkedIn connection requests per week",
      "LinkedIn weekly invitation limit",
      "how many LinkedIn invites per week",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "LinkedIn does not publish a weekly invitation quota. The help pages say invitations have a limit, Basic and Premium accounts both sit under it, and the point of the limit is to cut spam. They do not say 100 a week, 20 a day, or any other number you can treat as a budget.",
      "Tool blogs still repeat 100 a week because that is where a lot of aged, healthy accounts seem to bump the wall. It is a cluster of operator reports, not a published cap. A five-year personal profile with strong acceptance often has more room than a two-week sales seat on the same plan. Copying someone else's number onto a new account is how the new account spends the next week locked.",
      "If you need a planning number, use 40 to 60 thoughtful invites a week on a warmed account, and far fewer on a new or recently recovered one. Spread them across weekdays. A burst of 80 requests on Monday still looks like a burst even if you stay under a rumored weekly total.",
      "Acceptance matters more than the send count. A week of ignored requests, a pile of pending invites, and a few \"I don't know this person\" marks will shrink the room you have next week. Hitting 99 to \"use the quota\" is how you discover your personal ceiling the hard way.",
      "Premium does not buy extra invitations. It lets you attach a note to more of them. The scarce object is still the invite. If you want the longer version of this, read [LinkedIn weekly connection limits](/blogs/linkedin-weekly-connection-limits).",
    ],
    faqItems: [
      {
        question: "Does the weekly limit reset on Monday?",
        answer:
          "Treat it as a rolling window, not a calendar week. If you send a large batch on Wednesday, do not expect a fresh pile on Monday morning. Spread volume so you never need to guess the reset.",
      },
      {
        question: "Does Sales Navigator raise the weekly invite cap?",
        answer:
          "No. Paid search and InMail credits are separate products. Invitation limits still follow account trust, acceptance, pending volume, and prior restrictions.",
      },
      {
        question: "Is 100 invites a week safe?",
        answer:
          "Only if your account already lives there without warnings, and even then it is a rumor, not a target. Most teams are safer at half that, with notes that give people a reason to accept.",
      },
      {
        question: "What should I do instead of sending more invites?",
        answer:
          "Follow the person, join a relevant group, spend InMail if you have credits, or message people you already know. LinkedIn lists those as alternatives. They do not replace a good invite. They keep you from spending one on a stranger with no context.",
      },
    ],
    relatedSlugs: [
      "how-many-linkedin-connection-requests-per-day",
      "what-happens-when-i-hit-linkedin-invitation-limit",
      "what-is-a-good-linkedin-acceptance-rate",
    ],
  },
  {
    slug: "how-many-linkedin-connection-requests-per-day",
    question: "How many LinkedIn connection requests can I send per day?",
    description:
      "There is no official daily LinkedIn invite quota. A weekday pace with idle time beats dumping a week's worth of requests in one sitting.",
    keywords: [
      "LinkedIn connection requests per day",
      "how many LinkedIn invites per day",
      "LinkedIn daily invitation limit",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "LinkedIn does not publish a daily invitation number either. What gets people restricted is less \"21 instead of 20\" and more a quiet account that suddenly behaves like a bot: dozens of Connect clicks in a few minutes, identical notes, and search behavior no person would do by hand.",
      "A workable weekday pace for a warmed account is about 8 to 15 invites, sent with gaps, during hours you would actually be at a laptop. New accounts should start lower, often 5 to 8, and stay there until acceptance looks healthy for a couple of weeks.",
      "Do not bank unused days. Sending zero Tuesday through Thursday and 60 on Friday is worse than sending 10 each weekday. The product watches patterns, not only totals.",
      "Profile views in a tight burst can add to the same risk, even if you send few invites. If you research 200 profiles in 20 minutes, then fire invites from that list, you have already looked automated before the first note lands.",
      "If a campaign needs more volume than one profile can send safely, the honest move is another real person with their own warmed account, not a higher slider on the first profile. [Omentir](/signup) caps daily invites on purpose so a campaign cannot dump a week's work at 9:01.",
    ],
    faqItems: [
      {
        question: "Can I send all my weekly invites in one day?",
        answer:
          "You can try. That is one of the faster ways to earn a checkpoint or a temporary invite lock. Spread them. Leave idle time. Look like a person who has other work.",
      },
      {
        question: "Is there a difference between mobile and desktop sending?",
        answer:
          "The invite still counts. Mobile can look slightly more human because people actually use the app that way, but blasting from either surface still stacks the same limit and the same spam signals.",
      },
      {
        question: "Should weekends count?",
        answer:
          "Most B2B buyers are quieter then, and a Saturday burst from a weekday-only account looks odd. If you send on weekends, keep the volume low and the notes specific.",
      },
      {
        question: "What if I already sent too many today?",
        answer:
          "Stop. Do not withdraw 40 invites in a panic. Wait, do normal account things, and resume at a lower daily pace tomorrow. A cleanup binge on top of a send binge is still a binge.",
      },
    ],
    relatedSlugs: [
      "how-many-linkedin-connection-requests-per-week",
      "how-to-warm-up-a-linkedin-account-for-outreach",
      "is-linkedin-automation-allowed",
    ],
  },
  {
    slug: "what-is-a-good-linkedin-acceptance-rate",
    question: "What is a good LinkedIn connection acceptance rate?",
    description:
      "Aim above 30 percent, treat 40 percent and up as healthy, and fix targeting before you rewrite the note if you are stuck in the teens.",
    keywords: [
      "LinkedIn connection acceptance rate",
      "good LinkedIn accept rate",
      "why LinkedIn requests are ignored",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Count acceptance as accepted invites divided by invites sent in the same window, after you ignore the ones still pending that are only a few days old. A request from this morning is not a failure yet.",
      "Below 20 percent, LinkedIn is hearing that strangers do not want to hear from you. That is the danger zone for throttling. 30 percent is a minimum you can live with on a cold B2B list. 40 to 60 percent is what a tight list with a real reason to connect usually hits. Numbers above that usually mean the list was already warm: same event, same group, same company, or a mutual connection they actually know.",
      "If acceptance is low, the note is rarely the first problem. The first problem is who you asked. A generic \"I'd love to connect\" sent to every VP in an industry will sit in Other and die there. A short note that names a post, a hire, a shared group, or a mutual person has a reason to leave Other.",
      "Your profile is the landing page for the invite. If the headline is a slogan and the photo is a logo, people click Ignore even when the note was decent. Fix the profile before you raise volume. See [how to write a LinkedIn connection request](/help/how-to-write-a-linkedin-connection-request).",
      "Do not chase 80 percent by only inviting friends. That protects the account and starves the pipeline. Keep a mix: some people you already have a thread with, some people with a fresh public trigger, and very few true cold titles with no context.",
    ],
    faqItems: [
      {
        question: "Should I count pending invites as rejections?",
        answer:
          "Not for the first two weeks. After that, treat a silent pending invite as a no for planning purposes, and withdraw it so it stops sitting on the account.",
      },
      {
        question: "Does a blank invite get a better accept rate?",
        answer:
          "Sometimes, on a warm or semi-warm list, because a blank request looks less like a pitch. On a true cold list, a one-line reason usually wins. Test both on the same audience instead of copying a Twitter thread.",
      },
      {
        question: "How fast should I expect accepts?",
        answer:
          "Many land in the first 48 hours. Some trickle in for a week. After two weeks, the rest are mostly gone. That is why stale pending piles are dead weight.",
      },
      {
        question: "Can a low accept rate restrict the account even under the rumored weekly cap?",
        answer:
          "Yes. Volume is one signal. Quality is another. A small number of ignored or flagged requests can hurt more than a larger number of accepted ones.",
      },
    ],
    relatedSlugs: [
      "why-are-my-linkedin-connection-requests-ignored",
      "should-i-include-a-note-with-linkedin-connection-request",
      "what-does-i-dont-know-this-person-do-on-linkedin",
    ],
  },
  {
    slug: "what-happens-when-i-hit-linkedin-invitation-limit",
    question: "What happens when I hit the LinkedIn weekly invitation limit?",
    description:
      "You stop sending invites, usually for about a week. Withdrawing pending requests does not lift it, and you cannot buy more invitations while you wait.",
    keywords: [
      "LinkedIn invitation limit reached",
      "LinkedIn weekly invite restriction",
      "cannot send LinkedIn connection requests",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "When you see Invitation limit reached, you cannot send new connection requests until the restriction lifts. LinkedIn Help says that wait is typically one week. You cannot buy more invitations. Support will not shorten the wait, and they will not give you a precise reason.",
      "Withdrawing pending invitations does not remove the restriction. People do this in a panic and then wonder why nothing changed. The restriction is a cooldown on sending, not a pending-queue puzzle.",
      "The rest of the account usually still works. You can message first-degree connections, comment, follow, finish the profile, and take InMail if you have credits. Use the week that way. Do not open a second profile to keep blasting. LinkedIn is not confused about who you are.",
      "When the lock lifts, do not resume at the volume that caused it. Cut daily sends, tighten the list, and watch acceptance for two quiet weeks. A second restriction is harder to talk your way out of than the first.",
      "LinkedIn's own alternatives while you wait are follow, groups, InMail, and conversations you already have. Those are listed in [Alternatives to inviting someone to connect](https://www.linkedin.com/help/linkedin/answer/a551295). For the cooldown playbook, see [how to warm up a LinkedIn account](/blogs/how-to-warm-up-linkedin-account).",
    ],
    faqItems: [
      {
        question: "Can I still use LinkedIn during the restriction?",
        answer:
          "Usually yes, minus new invitations. If search, messaging, or the whole login is blocked, you are looking at a broader restriction. Stop all automation and read the notice before you appeal.",
      },
      {
        question: "Will Premium support get me unblocked faster?",
        answer:
          "Paid members can reach a faster support channel. LinkedIn still says it will not shorten a standard invitation restriction. Use support for a restriction you believe is an error, not to beg for extra invites.",
      },
      {
        question: "Does this mean I am banned?",
        answer:
          "An invitation limit is a temporary send pause, not a permanent ban. Repeated limit hits, scraping, or a pile of \"I don't know this person\" reports can escalate. Treat the first lock as a warning you needed.",
      },
      {
        question: "Should I switch tools the week I get locked?",
        answer:
          "Switching tools during a restriction often makes it worse because the new tool will try to send anyway. Pause everything. Come back slower, with limits you can see.",
      },
    ],
    relatedSlugs: [
      "how-long-does-a-linkedin-restriction-last",
      "why-was-my-linkedin-account-restricted",
      "how-many-linkedin-connection-requests-per-week",
    ],
  },
  {
    slug: "how-to-withdraw-pending-linkedin-invitations",
    question: "How do I withdraw pending LinkedIn invitations?",
    description:
      "Open My Network, manage sent invitations, and withdraw stale ones in small batches. LinkedIn does not tell the other person.",
    keywords: [
      "withdraw LinkedIn invitations",
      "pending LinkedIn connection requests",
      "how to cancel LinkedIn invites",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "On desktop, go to My Network, then Manage next to invitations, then the Sent tab. That list is every request still waiting. Newest sit at the top, so scroll for the old ones. Click Withdraw, confirm, and move to the next stale invite.",
      "LinkedIn does not notify the person when you withdraw. They will not get a \"Vansh cancelled\" email. If they never opened the invite, they likely never knew it existed.",
      "Withdraw in small batches over several days, not 400 clicks in 20 minutes. A cleanup binge is still a bulk action. If you are already restricted, withdrawing will not lift the restriction. Do it anyway, slowly, so the pile is smaller when sending returns.",
      "A practical rule: withdraw invites older than two to four weeks. A request that sat ignored for a month is not about to convert. Keeping it pending only tells the product your targeting is sloppy.",
      "Withdraw does not refund the weekly send. The invite was already spent. You are cleaning reputation, not minting new slots. Plan next week's sends as if those people were never asked, because they effectively were not.",
    ],
    faqItems: [
      {
        question: "Can I withdraw an invite after they accepted?",
        answer:
          "No. Once they are a connection, you remove them as a connection instead. That is a different action, and they may notice. Do not do it as a volume trick.",
      },
      {
        question: "Is there a mobile path?",
        answer:
          "Yes, through My Network and the invitation manager, but the Sent list is easier on desktop when you have hundreds to review. Use the surface you will not rush on.",
      },
      {
        question: "Should I withdraw invites that are only a few days old?",
        answer:
          "Leave them. Plenty of people accept later in the week. Withdraw the ones that have gone cold, not the ones that just have not opened LinkedIn yet.",
      },
      {
        question: "Will withdrawing raise my weekly limit?",
        answer:
          "Not immediately, and not as a published mechanic. A smaller pending pile is a healthier signal over time. It does not print extra invites today.",
      },
    ],
    relatedSlugs: [
      "how-many-pending-linkedin-invitations-is-too-many",
      "does-linkedin-notify-when-you-withdraw-a-request",
      "what-happens-when-i-hit-linkedin-invitation-limit",
    ],
  },
  {
    slug: "how-many-pending-linkedin-invitations-is-too-many",
    question: "How many pending LinkedIn invitations is too many?",
    description:
      "Keep pending invites well under a thousand. A large ignored pile is a spam signal, and around 1,500 LinkedIn may block new invites entirely.",
    keywords: [
      "pending LinkedIn invitations limit",
      "too many LinkedIn connection requests pending",
      "LinkedIn pending invite cap",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Pending invitations are requests you sent that nobody accepted or ignored yet. They are a second limit, separate from the weekly send. A few dozen is normal. A few hundred means you have been asking people who are not answering.",
      "LinkedIn has warned members as the outstanding pile grows, and operators regularly report a hard stop somewhere near 1,500 pending invites. Some older accounts stretch further. Do not test that. Stay well under 1,000, and treat 500 as a \"clean this week\" trigger.",
      "The weekly cap and the pending cap fail in different ways. You can have send room left and still be blocked because too many old asks are sitting there. You can also hit the weekly wall with a small pending pile if you sent too fast.",
      "The fix is boring. Withdraw stale invites. Tighten who you ask. Raise acceptance so fewer requests rot. If you need a habit, calendar a 15-minute pending review every Friday.",
      "A high pending count also poisons how you read results. A campaign that \"sent 400\" with 320 still pending did not reach 400 people. It reached the people who opened the invite. Measure accepts and replies, not sends.",
    ],
    faqItems: [
      {
        question: "Do ignored invites count as pending?",
        answer:
          "If they clicked Ignore, the invite is gone from your Sent list. Pending means they have not acted. Both outcomes are a no for your pipeline. Only pending keeps occupying the cap.",
      },
      {
        question: "Can I see an official pending maximum in LinkedIn Help?",
        answer:
          "Not as a clean published number the way the 30,000 connection cap is published. Plan around operator reports and keep the pile small enough that you never have to find the true ceiling.",
      },
      {
        question: "Does withdrawing 200 invites in one sitting help?",
        answer:
          "It lowers the count, and it can also look like another bulk action. Spread withdrawals. The goal is a healthy account, not a speedrun.",
      },
      {
        question: "Should I pause new invites while I clean pending?",
        answer:
          "If you are near 1,000, yes. Clean first. New sends onto a bloated pile make the math worse.",
      },
    ],
    relatedSlugs: [
      "how-to-withdraw-pending-linkedin-invitations",
      "what-is-a-good-linkedin-acceptance-rate",
      "how-many-linkedin-connection-requests-per-week",
    ],
  },
  {
    slug: "does-linkedin-notify-when-you-withdraw-a-request",
    question: "Does LinkedIn notify someone if I withdraw a connection request?",
    description:
      "No. Withdrawing a pending invitation does not send the other person a notification. If they already accepted, you cannot withdraw it.",
    keywords: [
      "does LinkedIn notify withdraw connection",
      "withdraw LinkedIn invite notification",
      "cancel LinkedIn request secretly",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "If the invitation is still pending, withdraw does not ping them. LinkedIn does not email \"this person cancelled.\" If they never opened My Network, they will never know you asked.",
      "If they already accepted, withdraw is not available. You are connected. Removing the connection is visible in the sense that you disappear from their first-degree network. Do not use that as a stealth move.",
      "People worry about this because they sent a bad note at 1 a.m. Withdraw the pending one, write a better reason next time, and move on. The embarrassment is almost always one-sided.",
      "The person can still see that you visited their profile if they check viewers and you are not using a private mode. Withdraw hides the invite, not every trace that you exist. If you need to disappear from a mistake, private mode and a better list are the real tools, not the withdraw button.",
      "Use withdraw for hygiene, not for A/B testing the same person twice in a week. Re-inviting quickly after a withdraw looks worse than leaving a quiet pending invite for a few more days.",
    ],
    faqItems: [
      {
        question: "Can I send a new invite right after withdrawing?",
        answer:
          "LinkedIn often makes you wait before you can invite the same person again. Do not treat withdraw as an undo for copy tweaks. Wait weeks, and only retry if you have a new reason.",
      },
      {
        question: "What if they accepted while I was withdrawing?",
        answer:
          "Then you are connected. Send a normal first message or say nothing. Do not explain the withdraw attempt. They did not see it.",
      },
      {
        question: "Does withdraw show up in their notifications later?",
        answer:
          "Not as a standard notification. If they had the invite sitting unopened, it simply vanishes from that list.",
      },
      {
        question: "Should I message them after withdrawing to explain?",
        answer:
          "No. You cannot message a non-connection without InMail or Open Profile, and an explanation of a cancelled invite is a strange first impression.",
      },
    ],
    relatedSlugs: [
      "how-to-withdraw-pending-linkedin-invitations",
      "how-many-pending-linkedin-invitations-is-too-many",
      "can-i-send-linkedin-requests-to-people-i-dont-know",
    ],
  },
  {
    slug: "why-was-my-linkedin-account-restricted",
    question: "Why was my LinkedIn account restricted for outreach?",
    description:
      "Most outreach restrictions come from volume spikes, low acceptance, \"I don't know this person\" reports, scraping extensions, or looking like a bot. Stop sending, then diagnose.",
    keywords: [
      "LinkedIn account restricted",
      "LinkedIn outreach restriction",
      "LinkedIn temporary restriction",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Read the banner. Invitation limit reached is a send pause. A broader restriction can block invites, InMail, search, or the whole session. Those are different problems. Guessing which one you have wastes the first day.",
      "Common outreach triggers: a quiet profile that suddenly sent a day's worth of actions in minutes, a week of ignored connection requests, recipients marking \"I don't know this person,\" a Chrome extension clicking through linkedin.com, bulk profile views, or a CSV blast with the same note. LinkedIn also flags unusual logins and location jumps.",
      "Paid plans do not make you immune. Sales Navigator Help says unusual activity can restrict InMail, invitations, search, or profile views, and that temporary blocks often last about 24 hours. Invitation-limit screens are often about a week. Identity checks and permanent bans are rarer and more serious.",
      "Immediate response: disconnect automation and unused apps, sign out of unknown sessions, stop scraping, and do not appeal five times. One clear appeal is enough if the notice asks for one. During the wait, use the account like a person: read, comment lightly, talk to people you already know.",
      "When access returns, resume at a fraction of prior volume for several weeks. If you need software again, pick something with visible daily caps and a send log, and keep the list tight. Omentir will not promise the account is safe. No vendor can. We do keep invite and message ceilings in the product so a campaign cannot run away from you.",
    ],
    faqItems: [
      {
        question: "Should I create a new LinkedIn account?",
        answer:
          "Almost never, and not while the first one is restricted. LinkedIn connects identities. A second profile to evade a restriction is a good way to lose both.",
      },
      {
        question: "Is a VPN a good idea during a restriction?",
        answer:
          "No. New IPs and devices on top of a restriction look like evasion. Stay on your usual network and wait.",
      },
      {
        question: "How do I know if an extension caused it?",
        answer:
          "If you installed a scraper, auto-connect tool, or \"export to CSV\" plugin, assume it contributed. Remove it. LinkedIn Help specifically calls out extensions that scrape profiles or cause a high number of profile views.",
      },
      {
        question: "Can I keep messaging people I already know?",
        answer:
          "If messaging still works, yes, slowly, to real conversations. Do not use the inbox as a new blast channel while invites are locked.",
      },
    ],
    relatedSlugs: [
      "how-long-does-a-linkedin-restriction-last",
      "what-happens-when-i-hit-linkedin-invitation-limit",
      "is-linkedin-automation-allowed",
    ],
  },
  {
    slug: "how-long-does-a-linkedin-restriction-last",
    question: "How long does a LinkedIn account restriction last?",
    description:
      "Invitation limits often last about a week. Some Sales Navigator activity blocks lift in about 24 hours. Identity holds and permanent bans take longer, and sometimes they do not lift.",
    keywords: [
      "how long LinkedIn restriction lasts",
      "LinkedIn temporary restriction duration",
      "LinkedIn ban how long",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Match the timer to the notice. LinkedIn Help on invitation limits says you typically wait one week, and that Support will not shorten it. Sales Navigator's usage page says some feature restrictions from unusual activity generally lift after about 24 hours. Those two sentences describe different products of the same company. Read yours.",
      "A checkpoint that asks you to confirm a phone number or photo can clear in minutes once you finish it, or it can stall if the photos do not match. Do the check once, correctly. Fake documents are how people turn a warning into a closed account.",
      "Repeated restrictions last longer in practice because the account is now in a hole. The official timer might still say a week. The unofficial reality is that your safe volume after the third lock is much lower than after the first.",
      "Permanent restrictions are uncommon relative to invite pauses, and they are the ones that follow scraping, bought accounts, or a long pattern of spam. Appeals sometimes work when the cause was a tool you have since removed. They rarely work when you argue with the policy.",
      "After any timed restriction, run a quieter month: complete the profile, talk to existing connections, send fewer invites, and keep pending low. If you jump back to the old cadence on day eight, you will meet the same wall.",
    ],
    faqItems: [
      {
        question: "The banner disappeared but I still cannot send invites. Why?",
        answer:
          "The UI can lag, or you may still be inside a rolling window. Wait, try one invite to someone you actually know, and if it fails, stay paused. Do not retry 30 times.",
      },
      {
        question: "Does paying for Premium shorten the wait?",
        answer:
          "Not for a standard invitation restriction. LinkedIn is explicit that you cannot acquire more invitations while restricted.",
      },
      {
        question: "Should I keep appealing every day?",
        answer:
          "No. Multiple appeals get the ticket treated as noise. Send one factual note if the form asks, then wait.",
      },
      {
        question: "What should I do on day one of a restriction?",
        answer:
          "Stop outbound tools. Export nothing. Comment on a few real posts if the feed still works. Write down what you sent in the last seven days so you do not repeat it.",
      },
    ],
    relatedSlugs: [
      "why-was-my-linkedin-account-restricted",
      "how-to-warm-up-a-linkedin-account-for-outreach",
      "what-happens-when-i-hit-linkedin-invitation-limit",
    ],
  },
  {
    slug: "how-to-warm-up-a-linkedin-account-for-outreach",
    question: "How do I warm up a LinkedIn account before outreach?",
    description:
      "Finish the profile, use the product like a person for a couple of weeks, then raise invites slowly. A new or recovered account should not start at a seasoned seller's volume.",
    keywords: [
      "warm up LinkedIn account",
      "LinkedIn account warmup for outreach",
      "new LinkedIn account connection limits",
    ],
    cluster: "limits",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Warmup is not a mystical score. It is a stretch of normal use so the account has a photo, a headline, some real connections, and a history of clicks that look like a person. LinkedIn is harsher on empty profiles that immediately scrape and invite.",
      "Week one: complete About, experience, a real photo, and a headline that names who you help. Connect with people you actually know. Comment on a few posts in your space. Do not buy connections. Do not import a 2,000-row CSV.",
      "Week two: a handful of invites per day to people with a clear reason, plus more genuine comments. Watch acceptance. If it is ugly, stop adding strangers and fix targeting. Only then raise toward a conservative weekday pace.",
      "Recovered accounts need the same patience. A restriction is not a hall pass to \"make up volume.\" Start below whatever you were sending before, and stay there until a couple of clean weeks pass.",
      "Software that offers a warmup toggle cannot invent trust. It can only slow the sends. Use that. The longer write-up is [how to warm up a LinkedIn account](/blogs/how-to-warm-up-linkedin-account).",
    ],
    faqItems: [
      {
        question: "How long does warmup take?",
        answer:
          "For a brand new profile, plan on two to four weeks before anything that looks like a campaign. An aged personal profile that you are turning toward sales can move faster, but still should not jump from 2 invites a week to 80.",
      },
      {
        question: "Does posting every day replace warmup?",
        answer:
          "Posting helps the profile look real. It does not excuse invite spam. Do both at a human pace, or skip the posts and still keep invites conservative.",
      },
      {
        question: "Can I warm up with automation?",
        answer:
          "If the tool is firing likes and views at machine speed, that is not warmup. That is a different fingerprint. Manual use, then paced sending, is the boring path that still works.",
      },
      {
        question: "What if I need pipeline this week?",
        answer:
          "Use email, communities, and people you already know. Burning a LinkedIn account for seven days of extra invites is an expensive trade.",
      },
    ],
    relatedSlugs: [
      "how-many-linkedin-connection-requests-per-day",
      "why-was-my-linkedin-account-restricted",
      "how-to-increase-linkedin-ssi",
    ],
  },
];
