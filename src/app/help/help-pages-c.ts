import type { HelpPageDraft } from "./types";

const DATE = "August 19, 2026";

export const HELP_PAGES_C: HelpPageDraft[] = [
  {
    slug: "how-to-message-someone-on-linkedin-without-connecting",
    question: "How do I message someone on LinkedIn without connecting first?",
    description:
      "Use InMail credits, Open Profile when you see a Message button on a non-connection, or message through a shared group. Regular DMs still need a first-degree connection.",
    keywords: [
      "message LinkedIn without connecting",
      "LinkedIn message without connection",
      "Open Profile vs InMail",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A normal LinkedIn DM is for first-degree connections. If you are not connected, the Message button is either missing, it starts an InMail, or it works because they turned on Open Profile.",
      "InMail is the paid path. You spend a credit from Premium or Sales Navigator. Write a short subject and a short body. If they reply, LinkedIn often returns the credit. If they ignore you, the credit is gone.",
      "Open Profile is the free-looking path. Some Premium members let anyone message them. You will see Message on their profile even though you are not connected. LinkedIn still rate-limits how many of those you can send. It is not an unlimited back door.",
      "Shared groups and some event attendee surfaces have also allowed messages without a connection. Those rules change. If the UI offers Message in a group you both belong to, keep it as short as an invite note and do not paste a sequence.",
      "Sponsored InMail (ads) is a different product with a different inbox feel. Do not confuse a paid ad unit with a 1:1 conversation. For most outbound, connect with a reason or spend InMail on the few names that are worth a credit. See [what is LinkedIn Open Profile](/help/what-is-linkedin-open-profile) and [what is LinkedIn InMail](/help/what-is-linkedin-inmail).",
    ],
    faqItems: [
      {
        question: "Can I email their LinkedIn.com address?",
        answer:
          "Do not harvest or guess LinkedIn email aliases as a workaround. That is a ToS and deliverability mess. Use a verified work email from a proper data flow, or stay on the platform.",
      },
      {
        question: "Does following them let me DM?",
        answer:
          "No. Follow is one-way. You still need a connection, InMail, Open Profile, or another allowed surface.",
      },
      {
        question: "Is a connection request with a long note the same as a DM?",
        answer:
          "No. The note is tiny and public-ish in the invite. The DM after accept is the conversation. Do not try to hold the whole pitch in the invite.",
      },
      {
        question: "Should I InMail everyone I cannot connect with?",
        answer:
          "No. Credits are scarce. Spend them on people with a trigger and a title that can buy, not as a substitute for a bad list.",
      },
    ],
    relatedSlugs: [
      "what-is-linkedin-open-profile",
      "what-is-linkedin-inmail",
      "how-to-write-a-linkedin-connection-request",
    ],
  },
  {
    slug: "what-is-linkedin-open-profile",
    question: "What is LinkedIn Open Profile?",
    description:
      "Open Profile is a Premium setting that lets anyone send that member a message without using InMail credit. It is not unlimited, and not everyone has it on.",
    keywords: [
      "LinkedIn Open Profile",
      "Open InMail",
      "message Premium member for free",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "If a Premium member enables Open Profile, other members can contact them without spending InMail. On their profile you will see Message even though you are not connected. LinkedIn's own help calls this out, and also says it limits how many Open Profile messages you can send in a period to keep the product usable.",
      "You cannot turn Open Profile on for other people. You can only notice it. Do not build a whole campaign that assumes every VP left the door open. Most have not.",
      "The message should still read like a DM, not like a banner ad. You got a free shot at their inbox. Use one trigger, one question, no deck. Length can be longer than an invite note. It should not be longer than a polite email.",
      "If your credit card on a Premium account is expired, LinkedIn may block you from sending Open Profile messages until billing works. That is a boring operational failure, not a strategy issue.",
      "Open Profile does not replace connection requests. It is a bypass for a subset of Premium users. Mix it with conservative invites and, when it is worth it, paid InMail.",
    ],
    faqItems: [
      {
        question: "How do I turn on Open Profile for myself?",
        answer:
          "It is a Premium subscriber setting. LinkedIn documents how to manage it in the Open Profile help article. Turning it on means strangers can message you too. Decide if you want that.",
      },
      {
        question: "Do Open Profile messages land in the main inbox?",
        answer:
          "Practitioners treat them as closer to a normal message than a filtered InMail. Recipients still ignore weak ones. Inbox placement is not a substitute for a reason to reply.",
      },
      {
        question: "Is there a weekly cap on Open Profile sends?",
        answer:
          "Yes, LinkedIn says there is a limit per time period and does not publish a number you should treat as a quota. If the button stops working, stop. Do not rotate accounts.",
      },
      {
        question: "Can I sequence five follow-ups on Open Profile?",
        answer:
          "You can technically send more than one message if the thread allows it. You should not. One or two thoughtful notes. Then leave it.",
      },
    ],
    relatedSlugs: [
      "how-to-message-someone-on-linkedin-without-connecting",
      "what-is-linkedin-inmail",
      "linkedin-premium-vs-sales-navigator",
    ],
  },
  {
    slug: "how-long-should-a-linkedin-cold-message-be",
    question: "How long should a LinkedIn cold message be?",
    description:
      "Aim for two or three short sentences, roughly 150 to 300 characters, with one ask. LinkedIn will let you write 8,000 characters. Nobody wants that from a stranger.",
    keywords: [
      "LinkedIn message length",
      "how long should a LinkedIn DM be",
      "LinkedIn cold message character count",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A first-degree DM can be up to about 8,000 characters. That limit is for real conversations, not for the first cold note. InMail bodies are much shorter, often cited around 1,900 to 2,000 characters, with a short subject. Write the first touch as if it were a text, not a landing page.",
      "Operator datasets disagree on the exact peak. Expandi's 2026 outreach report put a lot of replies in the 150 to 200 character band for sequence steps. Other message studies like the 200 to 300 band. Both agree that 500-plus characters on a first touch get ignored. Stay in the two-sentence range and you are in the overlap.",
      "One reason to reply is enough: a trigger, a question, or a useful observation. Two reasons in one block make the reader hunt for the point. Put the product name in the second or third message, not in the first, unless they asked.",
      "After they reply, length can grow. A thread that is already alive can hold a paragraph, a link, or a booking window. That is not cold anymore.",
      "Mobile is the formatting test. If your message needs a scroll on a phone before the question appears, cut it. The question should be visible without effort.",
    ],
    faqItems: [
      {
        question: "Should follow-ups be even shorter?",
        answer:
          "Yes. A follow-up can be one sentence plus a new fact or a breakup line. Re-pasting the original novel is how you get muted.",
      },
      {
        question: "Do voice notes change the length rule?",
        answer:
          "Voice notes are for people you already know well enough that a voice from a stranger is not creepy. Most cold outbound should stay text. If you use voice, keep it under 30 seconds and still have a point.",
      },
      {
        question: "What about C-suite?",
        answer:
          "Shorter, not longer. Executives do not need your series A story. One business observation and a yes/no question.",
      },
      {
        question: "Can I send a carousel of screenshots?",
        answer:
          "Not in the first message. Attachments and multi-bubble dumps look like a campaign. Earn the right.",
      },
    ],
    relatedSlugs: [
      "how-long-should-a-linkedin-connection-note-be",
      "what-is-a-good-linkedin-reply-rate",
      "how-many-linkedin-follow-up-messages-should-i-send",
    ],
  },
  {
    slug: "what-is-a-good-linkedin-reply-rate",
    question: "What is a good LinkedIn message reply rate?",
    description:
      "On cold lists, a few percent is common. On signal-based outreach after an accept, double digits is a healthier target. Measure replies after accept, not replies per invite sent.",
    keywords: [
      "LinkedIn reply rate",
      "good LinkedIn message response rate",
      "LinkedIn outreach benchmarks",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Decide the denominator. Reply rate after they accept is the useful one for DMs. Reply rate on InMail is a different funnel. Mixing them with invite sends will make a bad campaign look even worse, or a good one look mysterious.",
      "Cold list DMs after a weak accept often sit in the low single digits. Signal-based notes (job change, post, hire, funding) can land much higher, sometimes in the teens or better, because the person already had a reason to care. InMail reply rates are often quoted in a 10 to 25 percent band for targeted sends, and lower for spray.",
      "Vendor benchmarks disagree, and 2026 reports showed replies getting harder even when accepts held up. Use someone else's percentage as a sanity check, not a KPI you promise the board. Your ICP, price, and whether you asked for a meeting in line one will move the number more than the tool.",
      "If replies are near zero after 50 to 100 first messages, stop. The offer, the list, or the first line is wrong. Sending 500 more of the same will not find a hidden 8 percent.",
      "Count positive replies separately from \"not now\" and \"unsubscribe.\" A 12 percent reply rate that is all \"take me off this\" is not a win. Pipeline is booked conversations, not inbox activity.",
    ],
    faqItems: [
      {
        question: "Should I include \"stop\" replies in the rate?",
        answer:
          "Track them. Do not celebrate them. They are data that the list or the pitch was off. Honor them immediately.",
      },
      {
        question: "Is a high accept rate enough?",
        answer:
          "No. 2026 operator writeups kept saying accepts can hold while replies fall. The first DM has to earn a conversation, not repeat the invite.",
      },
      {
        question: "How many sends before I judge a campaign?",
        answer:
          "Enough that one lucky thread cannot fool you. For a tight segment, 40 to 80 first messages is a fair look. For a messy segment, you will know sooner that it is messy.",
      },
      {
        question: "Do AI-written messages reply better?",
        answer:
          "Only if they are edited and tied to a real trigger. Generic AI notes can accept worse than a human template. We would rather a short human sentence than a fluent paragraph that could fit anyone.",
      },
    ],
    relatedSlugs: [
      "what-is-a-good-linkedin-acceptance-rate",
      "how-to-follow-up-on-linkedin-without-being-spammy",
      "linkedin-vs-cold-email-for-b2b-outreach",
    ],
  },
  {
    slug: "when-to-send-first-linkedin-message-after-accept",
    question: "When should I send the first message after someone accepts?",
    description:
      "Wait a day or two. A pitch in the same hour as the accept reads as automated and drops replies. Use that first DM to start a conversation, not to book a demo.",
    keywords: [
      "when to message after LinkedIn accept",
      "first LinkedIn message after connection",
      "LinkedIn accept then pitch timing",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "They accepted a connection, not a meeting. If your first DM lands 30 seconds later with a Calendly link, you taught them the accept was a mistake. Wait a business day, sometimes two. Same-week is fine. Same-minute is not.",
      "Reference the same trigger you used in the invite, or something they can see you actually looked at. If the invite was blank, the first DM has to introduce a reason from scratch. Keep it to two sentences and a question they can answer without a budget review.",
      "Do not recap your whole company. Do not send a loom in message one unless they asked. Curiosity first, proof later.",
      "If they message you first after accepting, answer that thread. Do not fire the sequence on top of a human hello. That collision is how \"automated\" becomes obvious.",
      "Omentir can wait and draft. You still decide whether the first line is a pitch. If you want more on the copy, [hooking the prospect](/blogs/hooking-the-prospect-linkedin-intro-lines-that-drive-40-percent-reply-rates) is a longer piece on openers.",
    ],
    faqItems: [
      {
        question: "What if they accepted three weeks later?",
        answer:
          "Still send a first DM, but do not pretend it happened yesterday. A short \"thanks for connecting, still looking at X?\" is enough. The original trigger may be stale. Pick a new one or keep it light.",
      },
      {
        question: "Is commenting on their post a substitute for waiting?",
        answer:
          "A real comment before or after the accept helps. It is not a license to pitch in the same hour as the accept.",
      },
      {
        question: "Should the first DM repeat the invite note?",
        answer:
          "Do not paste it. Advance it. The invite got you in. The DM should ask something or offer one useful observation.",
      },
      {
        question: "What if I only have time to send immediately?",
        answer:
          "Then skip the DM that day. An empty new connection is better than a spammy one. Queue it for tomorrow.",
      },
    ],
    relatedSlugs: [
      "should-i-add-a-calendly-link-in-the-first-linkedin-message",
      "how-long-should-a-linkedin-cold-message-be",
      "how-to-book-a-meeting-from-a-linkedin-message",
    ],
  },
  {
    slug: "how-many-linkedin-follow-up-messages-should-i-send",
    question: "How many LinkedIn follow-up messages should I send?",
    description:
      "Plan on a connection note, one real first DM, and one or two follow-ups. Three total messages is a common sweet spot. Five or more often performs worse.",
    keywords: [
      "how many LinkedIn follow-ups",
      "LinkedIn sequence length",
      "LinkedIn follow-up cadence",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Expandi's 2026 dataset put three-message campaigns at the top for replies, with the second message doing a lot of the work. Five or more messages dropped below even a single message. That matches what it feels like as a recipient: the fourth \"just bumping this\" is when you mute.",
      "A simple shape: invite (with or without a note), a first DM a day or two after accept, a follow-up three to five days later with a new angle, then a short breakup. If they never accepted, you do not have a DM sequence. You have a pending invite. Withdraw it later. Do not InMail-spam the same person as punishment.",
      "Each follow-up needs a new piece of value or a new question. \"Checking if you saw this\" is empty. A relevant metric, a tighter question, or an honest \"I'll close the loop\" is a reason to look.",
      "Space them. Daily pings feel like a collection agency. Three to seven days between DMs is enough for a busy buyer to surface without you living in their notifications.",
      "Stop when they say no, when they go silent after a breakup, or when you have nothing new to say. Persistence is not the same as seven bubbles.",
    ],
    faqItems: [
      {
        question: "Where should the pitch live?",
        answer:
          "Usually in the second DM, once they have seen you once without a calendar link. The invite opens the door. The first DM starts a thread. The second can name what you do.",
      },
      {
        question: "Do breakup messages really work?",
        answer:
          "Sometimes. They work when they are polite and final, not sarcastic. \"I'll assume this is not a priority and stop here\" gets a surprising number of \"actually, now is fine.\"",
      },
      {
        question: "Should email follow-ups count in the three?",
        answer:
          "Multi-channel is a different sequence. A LinkedIn DM plus an email is two touches, not two LinkedIn messages. Keep each channel short on its own.",
      },
      {
        question: "What if they viewed the message and did not reply?",
        answer:
          "One follow-up is fair. Two is the edge. After that, they saw you and chose silence. Leave.",
      },
    ],
    relatedSlugs: [
      "how-to-follow-up-on-linkedin-without-being-spammy",
      "when-to-send-first-linkedin-message-after-accept",
      "how-to-combine-linkedin-and-cold-email",
    ],
  },
  {
    slug: "how-to-follow-up-on-linkedin-without-being-spammy",
    question: "How do I follow up on LinkedIn without sounding spammy?",
    description:
      "Add a new fact, ask a smaller question, or close the loop. Do not bump. Do not guilt. Do not send the same paragraph again.",
    keywords: [
      "LinkedIn follow up without being spammy",
      "LinkedIn bump message",
      "polite LinkedIn follow-up",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Spammy follow-ups have a tell: they could be sent to anyone, they reference the previous email as if the person failed you, and they ask for a meeting again. \"Just floating this to the top of your inbox\" is that tell.",
      "A useful follow-up introduces something that was not in the last note. A public hire you just noticed. A one-line observation about their market. A question that is easier than \"got 15 minutes?\" If you cannot add anything, wait or send a breakup.",
      "Match tone to the thread. If they never replied, stay short and lowercase. If they said \"send more info,\" send the info, not another hook. If they said \"not now,\" see [what to say when a LinkedIn lead says not right now](/help/what-to-say-when-a-linkedin-lead-says-not-right-now).",
      "Do not stack channels on the same morning. A DM, an InMail, and a cold email within two hours is a pile-on. Pick one surface per day.",
      "Stop words: \"gentle reminder,\" \"per my last message,\" \"circling back\" with no payload. Those phrases are fine inside a company. They are rude from a stranger.",
    ],
    faqItems: [
      {
        question: "Can I follow up on a Friday afternoon?",
        answer:
          "You can. Many people clear LinkedIn then. Keep it even shorter. Do not send four bubbles because you had leftover sequence steps.",
      },
      {
        question: "Is a meme or GIF better?",
        answer:
          "Almost never in cold B2B. It reads as a growth hack. A plain sentence ages better.",
      },
      {
        question: "Should I mention that I saw they viewed my profile?",
        answer:
          "No. It feels like surveillance. They already know they looked.",
      },
      {
        question: "How do I follow up after a conference?",
        answer:
          "Name the event and one specific moment. \"We met at the booth\" only works if you did. Fake memory is worse than a cold note.",
      },
    ],
    relatedSlugs: [
      "how-many-linkedin-follow-up-messages-should-i-send",
      "what-to-say-when-a-linkedin-lead-says-not-right-now",
      "best-time-to-send-linkedin-outreach-messages",
    ],
  },
  {
    slug: "best-time-to-send-linkedin-outreach-messages",
    question: "What is the best time to send LinkedIn outreach messages?",
    description:
      "Weekday mornings in the prospect's time zone are a reasonable default. The bigger lever is whether the note is worth opening, not Tuesday at 9:07.",
    keywords: [
      "best time to send LinkedIn messages",
      "when to send LinkedIn outreach",
      "LinkedIn message timing",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "People check LinkedIn in gaps: commute, first coffee, lunch, late afternoon. Vendor reports often like Tuesday and Wednesday mornings. Weekends are quieter for B2B and easier to ignore. None of this will save a bad list.",
      "Send in their time zone, not yours. A 9 a.m. send from Lisbon to California arrives in the middle of the night and then sits under twenty other notifications. If you cannot map time zones, stay inside a conservative daytime window and accept some waste.",
      "Avoid blasting the whole campaign at 9:00:00. A 40-invite spike on the hour looks like a job, because it is. Spread across the morning with gaps. That is also healthier for the account.",
      "If your buyers are operators who live in Slack, LinkedIn might get checked at night. If they are executives with assistants, mornings still win. Watch your own reply timestamps for a few weeks and copy that, not a blog's heatmap.",
      "Do not wait three weeks for the \"perfect\" slot. A good note on Thursday afternoon beats a perfect Tuesday you never ship.",
    ],
    faqItems: [
      {
        question: "Is it bad to send at night?",
        answer:
          "It can look odd, and it can also catch people who scroll in bed. If night sends are a pattern from a \"always on\" bot, that is the problem, not the hour itself. Keep a human window.",
      },
      {
        question: "Should I pause around holidays?",
        answer:
          "Yes, around the obvious ones in that country. Your sequence will still be there in January. Their patience might not be if you pitch on Christmas Eve.",
      },
      {
        question: "Do connection requests and DMs share a best time?",
        answer:
          "Invites often get processed in batches when someone opens My Network. DMs are more like email. Both still prefer weekdays. Do not overfit.",
      },
      {
        question: "Can I A/B test send times?",
        answer:
          "Only if the copy and list stay fixed. Otherwise you will attribute a better segment to \"Wednesday.\" Most small teams should pick a window and spend the energy on targeting.",
      },
    ],
    relatedSlugs: [
      "how-many-linkedin-connection-requests-per-day",
      "when-to-send-first-linkedin-message-after-accept",
      "how-to-follow-up-on-linkedin-without-being-spammy",
    ],
  },
  {
    slug: "should-i-add-a-calendly-link-in-the-first-linkedin-message",
    question: "Should I add a calendar link in the first LinkedIn message?",
    description:
      "Usually no. A calendar link in the first DM asks for a meeting before they agreed there is a problem. Offer a time after they show interest.",
    keywords: [
      "Calendly in LinkedIn message",
      "calendar link first LinkedIn DM",
      "when to send booking link LinkedIn",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "A stranger with a booking link is a billboard. Some people will click. More people will decide you are running a process at them. The first DM should be easy to answer in a sentence. \"Here's my calendar\" is not a question.",
      "Put the link in after they say they are open to a chat, or after they ask how it works. Then a calendar is courtesy, not an ambush. Offer two windows in text as well, because some buyers will not click trackers.",
      "If your motion is high-volume and low-ticket, you will see people preach \"always Calendly.\" That motion also trains buyers to ignore LinkedIn. If your ACV needs trust, wait.",
      "Shorten the landing. A 30-minute default with a long intake form is a second obstacle. 15 minutes, few fields, a human name on the event.",
      "If they book and no-show, follow up once on the same thread. Do not start a new sequence that pretends you never met.",
    ],
    faqItems: [
      {
        question: "What if they asked for a meeting in their accept note?",
        answer:
          "Then send the link. They already voted. Do not make them wait for your seven-step cadence.",
      },
      {
        question: "Is a video link better than a calendar in message one?",
        answer:
          "A three-minute loom nobody asked for is the same tax. Offer to send a video if they want it.",
      },
      {
        question: "Can I mention that I have a calendar without pasting it?",
        answer:
          "You can say you are easy to find 15 minutes with, then wait for a yes. That is still an ask. Use it in message two if the first got silence.",
      },
      {
        question: "Do tracking links hurt?",
        answer:
          "Many buyers notice. Use a clean URL. Skip the seven UTM parameters in a DM.",
      },
    ],
    relatedSlugs: [
      "how-to-book-a-meeting-from-a-linkedin-message",
      "when-to-send-first-linkedin-message-after-accept",
      "how-long-should-a-linkedin-cold-message-be",
    ],
  },
  {
    slug: "how-to-book-a-meeting-from-a-linkedin-message",
    question: "How do I book a meeting from a LinkedIn message?",
    description:
      "Get a reply first, confirm there is a fit, then make scheduling easy. The meeting is the third step, not the opener.",
    keywords: [
      "book a meeting on LinkedIn",
      "LinkedIn DM to demo",
      "how to schedule call from LinkedIn",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "The thread has jobs in order. First, they answer a question. Second, you both agree the problem is real enough to talk. Third, you pick a time. Skipping to third is why threads die.",
      "When interest shows up (\"tell me more,\" \"we are looking at this,\" \"send a link\"), reply the same day. Speed matters more here than in the cold step. Give one or two concrete outcomes for the call, a realistic length, and a way to book.",
      "Confirm who should be there. A practitioner may need their manager. Do not insist on the CRO in the first calendar invite. Ask \"is there anyone else who should hear this?\" after they pick a slot.",
      "Send a calendar invite with a clear title, your name, and a short agenda. LinkedIn messages disappear in people's heads. The invite is the artifact.",
      "If they go quiet after saying yes, one bump with the same link is enough. Then treat it as a maybe-later and put them in a longer nurture, not a daily DM.",
    ],
    faqItems: [
      {
        question: "Should I hop to email to book?",
        answer:
          "If they offer an email, yes. Calendar tools and assistants live there. Ask once. Do not demand email as a filter.",
      },
      {
        question: "What if they want async instead of a call?",
        answer:
          "Respect it. Send a short written walkthrough or a video. A forced demo on a buyer who asked for async is how you lose the deal before it starts.",
      },
      {
        question: "How long should the first call be?",
        answer:
          "15 to 20 minutes is easier to accept than 45. You can always extend if it is going well.",
      },
      {
        question: "Do I need a discovery script in the DM?",
        answer:
          "No. Save discovery for the call. The DM only has to make the call feel low-risk.",
      },
    ],
    relatedSlugs: [
      "should-i-add-a-calendly-link-in-the-first-linkedin-message",
      "what-to-say-when-a-linkedin-lead-says-not-right-now",
      "how-to-reply-when-prospect-already-uses-a-competitor",
    ],
  },
  {
    slug: "what-to-say-when-a-linkedin-lead-says-not-right-now",
    question: "What do I say when a LinkedIn lead says not right now?",
    description:
      "Ask one clarifying question about timing, then stop pitching. Put them on a longer follow-up. \"Not now\" is not \"never,\" and it is also not \"keep selling.\"",
    keywords: [
      "LinkedIn not right now objection",
      "nurture LinkedIn leads",
      "what to say when prospect says later",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "\"Not right now\" is a gift because they replied. Do not punish that with three more bubbles of proof. Thank them, ask whether it is timing, budget, or priority, and accept a short answer.",
      "If they name a quarter or a project, write it down and come back then with a new reason, not the old thread dumped on them. If they are vague, ask if you can check in in 60 or 90 days. Then actually wait.",
      "A useful check-in later is a new public signal (they hired, they shipped, they posted) or a single useful artifact with no form. \"Bumping this\" in month three is how you become the person they mute.",
      "Keep them in a list you trust. CRM, a spreadsheet, or Omentir, as long as a human can see the last note. Sequences that ignore \"not now\" and keep asking for 15 minutes are how you earn spam marks.",
      "There is a longer playbook in [how to nurture LinkedIn leads who say not right now](/blogs/how-to-nurture-linkedin-leads-who-say-not-right-now).",
    ],
    faqItems: [
      {
        question: "Should I offer a discount when they delay?",
        answer:
          "Not in the same breath. A random discount trains them to wait for one. Revisit price when timing is real.",
      },
      {
        question: "What if \"not now\" is a polite no?",
        answer:
          "If they also say they are happy with the current setup and do not want mail, treat it as a no. Close cleanly.",
      },
      {
        question: "Can I keep commenting on their posts in the meantime?",
        answer:
          "If the comments are real, yes. If they are a pretext to DM again next week, no.",
      },
      {
        question: "Do I send a breakup or a nurture?",
        answer:
          "Nurture if they gave a time. Breakup if they went vague and you already asked once. Do not run both.",
      },
    ],
    relatedSlugs: [
      "how-to-follow-up-on-linkedin-without-being-spammy",
      "how-to-book-a-meeting-from-a-linkedin-message",
      "how-to-reply-when-prospect-already-uses-a-competitor",
    ],
  },
  {
    slug: "how-to-reply-when-prospect-already-uses-a-competitor",
    question: "How should I reply when they already use a competitor?",
    description:
      "Name the competitor, ask about one known gap, and do not trash them. \"We already use X\" is often an opening, not a closed door.",
    keywords: [
      "prospect uses competitor LinkedIn",
      "how to reply we already use",
      "LinkedIn competitor objection",
    ],
    cluster: "messages",
    publishedDate: DATE,
    updatedDate: DATE,
    paragraphs: [
      "Do not pretend you did not read it. Do not say \"we are so much better\" without a fact. A clean reply sounds like: you know the tool, you know one job it is weak at, and you are asking whether that job hurts them.",
      "If they are happy, believe them. Ask if you can stay in touch for renewal season. Then leave. Pushing a rip-and-replace on a happy account is how threads go cold and stay cold.",
      "If they mention a pain (reporting, seats, data freshness, LinkedIn sending, onboarding), stay on that pain. Offer a short working session or a teardown, not a 12-slide war. Let them ask for the comparison.",
      "Never lie about being a customer of the competitor. Never imply their contract is invalid. Keep screenshots honest.",
      "On LinkedIn, keep the whole exchange short. Long competitive essays belong on a call or in an email they requested. The DM only has to decide whether a call is worth it.",
    ],
    faqItems: [
      {
        question: "Should I send a comparison page in the DM?",
        answer:
          "Only if they ask. Unsolicited \"us vs them\" pages feel like an attack on a choice they already made.",
      },
      {
        question: "What if I do not know the competitor?",
        answer:
          "Say so, and ask what they use it for. Fake fluency is obvious. You can still be useful by asking about the job to be done.",
      },
      {
        question: "Is \"we integrate with them\" a good line?",
        answer:
          "If it is true and it solves the overlap, yes. If it is a stretch, no. Buyers will check.",
      },
      {
        question: "Can I keep them in sequence anyway?",
        answer:
          "Pause the sequence. A competitor reply is a live conversation. Automation that keeps pitching on top of it is how you lose the thread.",
      },
    ],
    relatedSlugs: [
      "what-to-say-when-a-linkedin-lead-says-not-right-now",
      "how-to-book-a-meeting-from-a-linkedin-message",
      "linkedin-vs-cold-email-for-b2b-outreach",
    ],
  },
];
