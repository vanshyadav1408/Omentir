import type { HelpPageDraft } from "./types";

const DATE = "August 19, 2026";

export const HELP_PAGES_J: HelpPageDraft[] = [
  {
    slug: "how-to-qualify-a-linkedin-lead",
    question: "How do I qualify a LinkedIn lead?",
    description:
      "Check fit, problem, timing, and whether they can buy or champion. A reply is not a qualified lead. A title match is not either.",
    keywords: [
      "qualify LinkedIn lead",
      "lead qualification outbound",
      "how to qualify B2B LinkedIn prospect",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Qualification is a filter you apply before you spend the next hour. ICP fit: right company, right role. Problem: they feel the thing you fix, in their words. Timing: something makes this quarter different. Path to money: they buy, or they can get you to the person who does.",
      "A LinkedIn accept is none of those. It is permission to talk. Ask one qualifying question in the DM if the thread is alive. Save the rest for a 15-minute call.",
      "Disqualify out loud when you should. \"We only work if you have more than five AEs\" is a gift to both of you. Fake pipeline from curious non-buyers wastes the week.",
      "Score lists before you send, not only after. If the profile cannot pass a 20-second fit check, they should not have gotten the invite.",
      "Omentir scores against the ICP you put in My Product. You still decide who is worth a manual conversation. A high score with a \"please unsubscribe\" reply is not a win.",
    ],
    faqItems: [
      {
        question: "Should I use a form on LinkedIn?",
        answer:
          "No. Ask in conversation. Forms belong on landing pages they chose to visit.",
      },
      {
        question: "What if they fit but have no budget?",
        answer:
          "That is a nurture, not this week's demo. Ask when they revisit budget. Then wait.",
      },
      {
        question: "Can I qualify from the profile alone?",
        answer:
          "You can disqualify from the profile. You rarely can fully qualify. You still need their problem in their words.",
      },
      {
        question: "Is BANT required?",
        answer:
          "BANT is one checklist. Use it if it fits. Do not recite it in a DM. See [what is BANT](/help/what-is-bant-in-b2b-sales).",
      },
    ],
    relatedSlugs: [
      "what-is-an-icp-for-b2b-sales",
      "what-is-bant-in-b2b-sales",
      "what-is-sql-vs-mql",
    ],
  },
  {
    slug: "what-is-bant-in-b2b-sales",
    question: "What is BANT and should I use it?",
    description:
      "BANT is Budget, Authority, Need, Timeline. It is a qualification checklist, not a script to fire into a first LinkedIn DM.",
    keywords: [
      "what is BANT",
      "BANT qualification",
      "BANT vs MEDDIC",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "BANT is an old IBM-era checklist: can they pay, can they sign, do they have the problem, when will they act. It still works as a mental filter. It fails as a first-message interrogation.",
      "On LinkedIn, you might learn Need from a post and Authority from a title. Budget and Timeline usually need a conversation. Asking for budget in line one of a cold DM is how the thread ends.",
      "Other checklists exist (MEDDIC, SPICED, your own four bullets). Pick one the team will actually use. Mixing three frameworks in a CRM is how nothing gets filled in.",
      "If the deal is small and founder-sold, you do not need a 12-field scorecard. If the deal is committee-heavy, BANT alone is thin. You will care about champions and process.",
      "Use BANT to decide whether to book the next call, not to grade strangers who have not spoken yet.",
    ],
    faqItems: [
      {
        question: "Should I ask BANT in order?",
        answer:
          "Need first, then timing, then who else, then money. Budget first from a stranger feels like a shakedown.",
      },
      {
        question: "Is BANT outdated?",
        answer:
          "The letters are old. The questions are still the deal. Use newer names if your team hates the acronym.",
      },
      {
        question: "Does inbound use BANT too?",
        answer:
          "Yes, often faster because they already showed Need. Outbound has to earn the other three.",
      },
      {
        question: "Can a tool score BANT automatically?",
        answer:
          "It can guess from firmographics. It cannot hear a \"we have no budget until FY27\" unless a human wrote it down.",
      },
    ],
    relatedSlugs: [
      "how-to-qualify-a-linkedin-lead",
      "what-is-sql-vs-mql",
      "how-to-book-a-meeting-from-a-linkedin-message",
    ],
  },
  {
    slug: "how-to-get-past-a-gatekeeper-on-linkedin",
    question: "How do I get past a gatekeeper on LinkedIn?",
    description:
      "Treat assistants and chiefs of staff as people with power. Ask how they prefer to route you. Going around them in a rude DM is how you never get the meeting.",
    keywords: [
      "LinkedIn gatekeeper",
      "message executive assistant LinkedIn",
      "get past gatekeeper B2B",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "On LinkedIn the gatekeeper is often an EA, a chief of staff, or a busy operator who filters the exec's requests. They can kill the deal with one Ignore. They can also book the 15 minutes if you are clear and polite.",
      "If they reply, thank them, state the outcome in one line, and ask who owns it and how they like to schedule. Do not pitch the product at them as if they were a dummy switch.",
      "Do not connect with the exec and the EA on the same morning with the same note. Do not tell the exec their assistant is blocking innovation. That email gets forwarded.",
      "Sometimes the \"gatekeeper\" is the real buyer. A Head of Ops who said \"I'll take a look\" may be the champion. Stay with them.",
      "If nobody answers, a short note to a practitioner in the same team can be a better path than a fifth exec InMail.",
    ],
    faqItems: [
      {
        question: "Should I InMail the assistant?",
        answer:
          "If they are the person who schedules, a short InMail can work. Make it about routing, not a full sales pitch.",
      },
      {
        question: "Can I use their personal email I found?",
        answer:
          "If they did not give it to you, that is a bad surprise. Prefer the channel they already used.",
      },
      {
        question: "What if the EA asks for a one-pager?",
        answer:
          "Send a one-pager. That is their job. See [send me more information](/help/how-to-handle-send-me-more-information).",
      },
      {
        question: "Is calling the switchboard better?",
        answer:
          "Sometimes, after a LinkedIn touch, if you have a real reason. Cold calling the EA with no context is just another interrupt.",
      },
    ],
    relatedSlugs: [
      "how-to-reach-c-suite-on-linkedin",
      "how-to-ask-for-a-referral-on-linkedin",
      "how-to-find-decision-makers-on-linkedin",
    ],
  },
  {
    slug: "should-founders-do-their-own-outbound",
    question: "Should founders do their own outbound?",
    description:
      "Yes at the start. You learn the ICP from the replies. Hire an SDR after the message and the buyer are repeatable, not to avoid the learning.",
    keywords: [
      "should founders do outbound",
      "founder-led sales LinkedIn",
      "founder vs SDR outbound",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Early outbound is research with a calendar link at the end. A founder hears objections a hired SDR will soften or miss. That is why founder-led LinkedIn still books the first customers for a lot of B2B tools.",
      "You do not need to live in the inbox forever. You need enough conversations to write the ICP in a sentence that survives contact with the market.",
      "Handing a vague ICP to an agency or an SDR in month one produces spam in your name. That is expensive in two ways: money, and the market's memory of you.",
      "When replies repeat, the offer is clear, and you are the bottleneck, add help. Until then, a short daily cadence on your own account is the job. We wrote [outbound for solo founders](/blogs/outbound-sales-for-solo-founders-a-practical-guide) for that motion.",
      "Omentir exists because founders got tired of stitching databases and sequencers. It still sends as you. It does not replace listening.",
    ],
    faqItems: [
      {
        question: "What if I hate selling?",
        answer:
          "You can still send a curious question instead of a pitch. You cannot outsource the first 20 conversations without losing the plot.",
      },
      {
        question: "Can a cofounder do it instead?",
        answer:
          "Yes, if they will talk to users anyway. Split by who sounds like a peer to the buyer.",
      },
      {
        question: "How much time per day?",
        answer:
          "Thirty focused minutes beats a once-a-month binge. See the 15-minute routine post if you want a smaller version.",
      },
      {
        question: "When do I hire the first SDR?",
        answer:
          "When you can hand them a list definition, a message that already works, and a way to pass interested replies back to you. Not before.",
      },
    ],
    relatedSlugs: [
      "how-to-start-outbound-with-no-sdr",
      "what-is-an-icp-for-b2b-sales",
      "how-to-measure-linkedin-outreach-roi",
    ],
  },
  {
    slug: "how-to-start-outbound-with-no-sdr",
    question: "How do I start outbound with no SDR team?",
    description:
      "Pick one ICP, one channel, a conservative daily cap, and a simple cadence. Ship 20 conversations before you buy a stack.",
    keywords: [
      "start outbound with no SDR",
      "solo outbound LinkedIn",
      "first outbound campaign founder",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Write the one-sentence ICP. Connect LinkedIn. Finish the profile. Build a list for this week only. Send a handful of invites a day with a real reason. DM after accept. Follow up once. Book or learn.",
      "Skip the six-tool stack. You do not need a waterfall, a sequencer, a separate inbox, and an intent product to learn if anyone cares. You need replies.",
      "Cap volume so you cannot ruin the account while you are still bad at this. New seats should look like warmup, not like a hired floor.",
      "Log what people say. After 20 honest conversations, rewrite the sentence and the first line. That loop is the whole early motion.",
      "When the loop is boringly repeatable, add software or a person. Omentir is built for that founder path: ICP-fit names, drafts, paced sends, one inbox. It is optional until the manual version is too slow.",
    ],
    faqItems: [
      {
        question: "LinkedIn or email first?",
        answer:
          "LinkedIn if you are the face of the product and buyers live there. Email if you already have verified addresses and a domain you will not mind warming. See [LinkedIn vs cold email](/help/linkedin-vs-cold-email-for-b2b-outreach).",
      },
      {
        question: "Do I need Sales Navigator on day one?",
        answer:
          "No. Buy it when search is the bottleneck. A free graph plus a tight ICP is enough to start.",
      },
      {
        question: "What if I get zero replies in two weeks?",
        answer:
          "Change the list or the first line, not the tool. Zero after a tiny, relevant list means the offer is unclear.",
      },
      {
        question: "Should I outsource to an agency immediately?",
        answer:
          "Only if they will use your voice and your ICP, and you will still hear the calls. Most early agencies just spend your graph.",
      },
    ],
    relatedSlugs: [
      "should-founders-do-their-own-outbound",
      "how-to-warm-up-a-linkedin-account-for-outreach",
      "how-to-build-a-linkedin-prospecting-list",
    ],
  },
  {
    slug: "linkedin-vs-cold-calling-for-b2b",
    question: "Is LinkedIn or cold calling better for B2B?",
    description:
      "Calls convert live conversations at a high rate and do not scale like LinkedIn or email. Use the phone on warmed names. Use LinkedIn to create the context.",
    keywords: [
      "LinkedIn vs cold calling",
      "cold call or LinkedIn DM",
      "B2B phone vs LinkedIn",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A live call can handle objections in ninety seconds. Most cold calls still die at the screen. Cost per conversation is high. Conversion per conversation is often the best of the three channels.",
      "LinkedIn is slower, capped, and visible. The buyer can see you. That is the point. It is a poor replacement for a phone motion if your ACV is huge and your buyers still pick up.",
      "The combination that works: LinkedIn or email first, call after they opened or accepted, with a reference to the last touch. A true cold call into a 2,000-row CSV is a different sport, with different data needs (real mobiles).",
      "If you hate the phone, you can still build pipeline on LinkedIn. You will book fewer meetings per live conversation and more per hour of async work. Pick the constraint you can live with.",
      "Do not call because a sequence step said \"day 4 call\" and you have no number. Skip the step. Empty switchboard attempts are not a cadence. They are noise.",
    ],
    faqItems: [
      {
        question: "Should I mention the LinkedIn in the opener?",
        answer:
          "Yes, if you actually sent it. \"Calling about the note I sent Tuesday\" is a warmer open than a fake survey.",
      },
      {
        question: "Do executives prefer calls?",
        answer:
          "Some do. Many still screen. A short InMail plus a later call to a published office line can work. A mobile you guessed can backfire.",
      },
      {
        question: "Is leaving voicemail worth it?",
        answer:
          "One short voicemail plus a text or email with the same reason. A three-minute voicemail is a burden.",
      },
      {
        question: "Can I autodial from a LinkedIn list?",
        answer:
          "Only with numbers you obtained lawfully and dialer rules you follow. LinkedIn URLs are not phone numbers.",
      },
    ],
    relatedSlugs: [
      "linkedin-vs-cold-email-for-b2b-outreach",
      "how-to-combine-linkedin-and-cold-email",
      "how-many-touches-to-book-a-b2b-meeting",
    ],
  },
  {
    slug: "how-to-measure-linkedin-outreach-roi",
    question: "How do I measure LinkedIn outreach ROI?",
    description:
      "Count meetings and revenue against time, seats, and tools. Do not count sends as ROI. A busy week with no conversations is a cost.",
    keywords: [
      "LinkedIn outreach ROI",
      "measure LinkedIn outbound",
      "ROI of LinkedIn sales",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Pick a window (four weeks). Add tool cost, paid LinkedIn, and hours at a honest rate. Add meetings that came from the motion, and closed revenue if the cycle is short enough. Divide. That is an ROI sketch, not a PhD.",
      "Sends, views, and SSI are not the numerator. Pipeline is. If you must have an activity metric, use accepts and positive replies as leading indicators, then distrust them when meetings do not follow.",
      "Attribute a meeting to LinkedIn if the first conversation started there, even if you booked on email. Do not double-count the same demo in three channels.",
      "Compare against the next best use of the hours. If founder time is worth more in product, the ROI bar is higher. That is a real trade, not a motivational poster.",
      "Omentir's $49 Pro plan is easy math if one extra customer covers it. It still fails if the ICP is fiction. The guarantee page is the honest version of that bet.",
    ],
    faqItems: [
      {
        question: "How do I count brand from posting?",
        answer:
          "Separately, or not at all, until inbound DMs show up. Mixing content brand with outbound ROI muddies both.",
      },
      {
        question: "What if deals close six months later?",
        answer:
          "Track meetings now and revenue in a later cohort. Do not pretend week-two ROI includes those deals.",
      },
      {
        question: "Should I include restriction risk as a cost?",
        answer:
          "Yes, as a qualitative cost. A banned founder profile is expensive. Conservative volume is part of ROI.",
      },
      {
        question: "Is vanity URL click-tracking enough?",
        answer:
          "No. People book off a thread with no click. Ask \"how did you hear about us\" on the call.",
      },
    ],
    relatedSlugs: [
      "what-metrics-to-track-for-linkedin-outbound",
      "what-is-a-good-outbound-meeting-booked-rate",
      "what-is-a-good-linkedin-reply-rate",
    ],
  },
  {
    slug: "what-metrics-to-track-for-linkedin-outbound",
    question: "What metrics should I track for LinkedIn outbound?",
    description:
      "Watch acceptance, reply rate, positive replies, meetings, and pending pile. Sends only tell you that you were busy.",
    keywords: [
      "LinkedIn outbound metrics",
      "KPIs for LinkedIn outreach",
      "what to track LinkedIn sales",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Minimum set: invites sent, accept rate, first DMs sent, reply rate, positive reply rate, meetings booked, pending invites. Optional: InMail spend and refunds, bounce-equivalent (IDK reports you can only infer), time to first reply.",
      "If accept rate falls, fix targeting and profile before you write a new sequence. If accepts hold and replies fall, fix the first DM. If replies hold and meetings fall, fix the ask or the qualification.",
      "Do not make SSI a team KPI. Do not make profile views a team KPI. They are side mirrors.",
      "Look at these weekly, on the same definitions. Changing the denominator every Friday is how you always \"win.\"",
      "A simple sheet is enough until you have multiple reps. Then the CRM has to store source = LinkedIn and the last message, or you will argue about credit.",
    ],
    faqItems: [
      {
        question: "What is a positive reply?",
        answer:
          "Interested, referral, or a meeting. \"Not now\" is useful but not positive. \"Unsubscribe\" is a stop.",
      },
      {
        question: "Should I track time of day?",
        answer:
          "Only after the basics are healthy. It is a weak lever.",
      },
      {
        question: "How soon can I judge a campaign?",
        answer:
          "After enough first DMs that one thread cannot swing the rate. Often 40 to 80. See the A/B testing page.",
      },
      {
        question: "Do I track competitor mentions?",
        answer:
          "Yes, in notes. It teaches you the real alternatives. It is not a vanity chart.",
      },
    ],
    relatedSlugs: [
      "how-to-measure-linkedin-outreach-roi",
      "what-is-a-good-linkedin-acceptance-rate",
      "what-is-a-good-linkedin-reply-rate",
    ],
  },
  {
    slug: "how-many-touches-to-book-a-b2b-meeting",
    question: "How many touches does it take to book a B2B meeting?",
    description:
      "Often several, across a couple of weeks, not one perfect note. Most teams that book meetings use more than one channel. They still stop before they become a nuisance.",
    keywords: [
      "how many touches to book a meeting",
      "B2B outreach touchpoints",
      "how many follow ups to get a demo",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "There is no sacred number. Multi-channel writeups often talk about 8 to 12 touches over two weeks if you count email, LinkedIn, and a call. LinkedIn-only data in 2026 still liked about three messages on the platform itself. Those numbers are different jobs. Do not mash them into one KPI.",
      "A touch is a real attempt they could see: invite, DM, email, call, a comment that was actually about their post. An auto-like is not a touch you should count.",
      "Meetings still cluster on the first few quality touches. Extra steps pick up stragglers and also pick up complaints. Stop when you have nothing new to say.",
      "If you book most meetings on touch one, your list is warm. If you never book before touch eight, your first line is weak or your offer is.",
      "Coordinate channels so two touches are not two copies of the same paragraph on the same morning. See [combine LinkedIn and email](/help/how-to-combine-linkedin-and-cold-email).",
    ],
    faqItems: [
      {
        question: "Does a profile view count?",
        answer:
          "Not as a meaningful touch. They may not even see it. Count things with words.",
      },
      {
        question: "What if they book on the breakup?",
        answer:
          "That still counts. It does not mean every sequence should be nine steps long to chase that tail.",
      },
      {
        question: "Should inbound leads get a cadence too?",
        answer:
          "A shorter one. They already raised a hand. Speed matters more than step count.",
      },
      {
        question: "Is more always more pipeline?",
        answer:
          "No. LinkedIn data on long sequences often got worse replies. Email has a similar complaint curve.",
      },
    ],
    relatedSlugs: [
      "what-is-a-linkedin-outreach-cadence",
      "how-many-linkedin-follow-up-messages-should-i-send",
      "how-many-cold-email-follow-ups-should-i-send",
    ],
  },
  {
    slug: "what-is-a-good-outbound-meeting-booked-rate",
    question: "What is a good outbound meeting booked rate?",
    description:
      "As a share of sends, meetings are a small number. A percent or two of delivered email, or a healthy share of positive LinkedIn replies, is a more honest target than a fantasy conversion chart.",
    keywords: [
      "outbound meeting booked rate",
      "good demo booking rate outbound",
      "LinkedIn meetings per invite",
    ],
    cluster: "targeting",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Define it. Meetings booked divided by first touches in a channel, or divided by positive replies. Those two rates tell different stories. Mixing them makes you look like a genius or a failure at random.",
      "Cold email at scale often books well under 2 percent of delivered mail. LinkedIn can look higher on a small, sharp list because volume is capped. Neither number is a promise.",
      "If positive replies do not become meetings, the ask is too big, the calendar is too heavy, or you are talking to people who cannot buy. Fix that before you buy more leads.",
      "No-shows sit after this metric. Track them separately or you will celebrate bookings that never happened.",
      "Compare this month to last month on the same ICP. A blog's \"we book 40 percent\" is usually a different funnel (inbound, or replies only, or a tiny n).",
    ],
    faqItems: [
      {
        question: "Should I count reschedules as new meetings?",
        answer:
          "No. One meeting, maybe moved. Count the show.",
      },
      {
        question: "What if I book on a call that started from LinkedIn?",
        answer:
          "Credit LinkedIn as source. The booking rate still uses the original denominator you picked.",
      },
      {
        question: "Is a high meeting rate with low close rate good?",
        answer:
          "You are booking the wrong people. Tighten qualification even if the calendar looks full.",
      },
      {
        question: "How does Omentir's three-booking guarantee fit?",
        answer:
          "That is a hosted-plan promise with rules. It is not a universal outbound benchmark. Read [the guarantee](/minimum-booking-guarantee).",
      },
    ],
    relatedSlugs: [
      "how-to-measure-linkedin-outreach-roi",
      "how-to-book-a-meeting-from-a-linkedin-message",
      "what-is-a-good-linkedin-reply-rate",
    ],
  },
];
