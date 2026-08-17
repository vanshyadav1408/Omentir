import type { GuidePage } from "./types";

export const EMAIL_GUIDES_B: GuidePage[] = [
  {
    slug: "hubspot-email-marketing",
    title: "HubSpot email marketing",
    description:
      "How marketing email actually works inside HubSpot: lists, workflows, sales mail versus bulk sends, and the traps teams hit after they import contacts.",
    query: "hubspot email marketing",
    kicker: "HubSpot email",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "HubSpot email marketing",
      "HubSpot marketing email",
      "HubSpot email workflows",
    ],
    sections: [
      {
        heading: "The send button on a contact is not a campaign",
        paragraphs: [
          "[HubSpot](https://www.hubspot.com) stores people as CRM records. From a record, a salesperson can log a one-to-one note through a connected inbox. That mail uses the rep's mailbox, the rep's reputation, and usually no subscription center. Marketing email is a different object: a message HubSpot sends on a domain you authenticated, to people who have a subscription type that allows it, with an unsubscribe header HubSpot manages for you.",
          "Teams get hurt when they treat those as the same job. A founder imports a spreadsheet, selects everyone with a title, and hits send from a marketing email tool they barely configured. The CRM still shows the contacts. Deliverability does not care. If you want HubSpot for email, start by deciding which sends are sales follow-up and which are marketing. HubSpot will let you do both. It will not stop you from mixing them badly.",
        ],
      },
      {
        heading: "Lists, forms, and permission live on the contact",
        paragraphs: [
          "HubSpot lists are views of CRM properties, not a separate ESP audience you can throw away. A static list is a snapshot. An active list keeps matching people as properties change. That is useful for 'requested the pricing PDF this month' and dangerous for 'every contact we ever scraped.' Forms, meetings, and chat should write the properties you later segment on, including how the person opted in and which subscription types they want.",
          "If sales adds contacts by hand, give them a required field for source and a rule that marketing lists exclude records with no consent flag. HubSpot can enforce that with list filters. It cannot invent consent you never captured. Bought files do not become a HubSpot email program because you uploaded them into the CRM.",
        ],
      },
      {
        heading: "Workflows versus a scheduled blast",
        paragraphs: [
          "A one-off marketing email is a date, a list, a subject, and a preview. Use it for a launch, an event, or a monthly note you actually wrote. Workflows (HubSpot's automation) send when a person enters a set of criteria: form fill, deal stage, page view, or a date property. Welcome and nurture belong there so you do not re-blast the same file every Tuesday.",
          "Keep the first workflow short. One welcome, one useful follow-up, then stop unless the person does something new. Long HubSpot workflows that drip for twelve weeks are where copy goes stale and suppression gets forgotten. Review enrollment counts weekly. If a workflow is enrolling people who already bought, the enrollment criteria are wrong, not the template.",
        ],
      },
      {
        heading: "Where HubSpot email usually breaks",
        paragraphs: [
          "Domain authentication is still DNS work: SPF, DKIM, and a DMARC policy on the sending domain. HubSpot documents the records. Skipping them because 'the CRM send worked from Gmail' is how you train Gmail to distrust the marketing domain. Shared sending reputation inside a portal also means one sloppy blast can hurt the next campaign for everyone on that domain.",
          "The other break is reporting vanity. HubSpot will show opens, clicks, and influenced deals. Apple Mail privacy and image blocking make opens a weak number. Judge HubSpot email on replies, form fills, meeting bookings, and unsubscribes. If those look fine and opens look terrible, you probably do not have an email problem.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Do I need Marketing Hub to send email from HubSpot?",
        answer:
          "One-to-one sales email from a connected inbox can live on the free CRM. Marketing emails, subscription types, and serious automation sit in Marketing Hub. Confirm current limits on HubSpot's pricing page before you plan a program around the free tier.",
      },
      {
        question: "Can sales and marketing share the same HubSpot lists?",
        answer:
          "They share contacts. They should not share send rules. Filter marketing lists on subscription and source. Leave sales sequences on people who asked for a conversation, and keep those sends in the connected inbox so replies land with a human.",
      },
    ],
  },
  {
    slug: "how-to-do-email-marketing",
    title: "How to do email marketing",
    description:
      "A first email program in order: permission, one list, one offer, a sending tool, four messages, and a way to know if it worked.",
    query: "how to do email marketing",
    kicker: "Getting started",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "how to do email marketing",
      "start an email list",
      "first email campaign",
    ],
    sections: [
      {
        heading: "Do not start with a tool",
        paragraphs: [
          "People search 'how to do email marketing' and get a stack diagram. You need four decisions that fit on one page: who is allowed to hear from you, what you are allowed to offer them, which address you will send from, and what you will count as success. Software cannot invent those. If you cannot write them in plain sentences, you are not ready to pick an ESP.",
          "Success for a first program is usually 'people who asked for this reply or click through to one page.' It is not a revenue number you copied from a vendor webinar. Pick a window, often six weeks, and write down what would make you stop.",
        ],
      },
      {
        heading: "Collect names on purpose",
        paragraphs: [
          "Put one form on a page that already has a reason to exist: a guide, a waitlist, a store checkout, a webinar. Say what they will get and how often. Store the timestamp, the form, and the URL. That record is how you defend the list later under [CAN-SPAM](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) in the US and consent rules in the EU. A spreadsheet of conference badges is not a list.",
          "Until you have a few hundred people who opted in, do not buy lookalikes or scrape. A small clean file beats a large dirty one because mailbox providers watch complaint rates, not your ambition.",
        ],
      },
      {
        heading: "Pick a sender and authenticate it",
        paragraphs: [
          "Use a domain you control, not a free @gmail From address, once you are sending campaigns. Create a mailbox like hello@ or news@ that a human reads. In DNS, add the SPF, DKIM, and DMARC records your ESP prints for you. Send a test to Gmail, Outlook, and Apple Mail before the first real send. If the test lands in spam, fix that before you schedule anything.",
          "Connect the ESP to your site analytics so clicks have a destination you can see. You do not need a customer data platform on week one.",
        ],
      },
      {
        heading: "Write four emails, then stop inventing",
        paragraphs: [
          "Email one is the welcome you promised on the form. Email two is the useful thing (how-to, sample, or shipping note). Email three is the ask (buy, book, or reply with a question). Email four is a simple 'still want this?' with an honest unsubscribe. That is a program. A twelve-step funnel is a delay tactic.",
          "Keep layout boring: one column, real text, one link, a plain-text part. Save the fancy template for later. Send to yourself and to two people who will tell you if it sounds like a stranger.",
        ],
        bullets: [
          "Welcome: deliver what the form promised within a day",
          "Useful: one specific page or file, not a digest of your whole site",
          "Ask: one action, written like a person",
          "Check-in: permission to keep mailing, plus a working unsubscribe",
        ],
      },
      {
        heading: "Read the numbers that can fire you",
        paragraphs: [
          "Watch bounces, spam complaints, and unsubscribes after every send. If complaints spike, pause and look at how you got those addresses. Clicks and replies tell you if the offer is real. Opens are noisy since Apple started prefetching mail. Do not rebuild the program around open rate.",
          "After six weeks, keep the cadence that produced replies. Kill the rest. Expanding to segments and automation comes after a plain program works, not before.",
        ],
      },
    ],
    faqItems: [
      {
        question: "How often should a first list hear from you?",
        answer:
          "As often as you promised on the form, and not more. A monthly note you write is safer than a weekly send you scrape together. If people subscribed for shipping updates, do not add a thought-leadership newsletter on the same permission.",
      },
      {
        question: "Do I need automation on day one?",
        answer:
          "You need a welcome that fires when someone joins. Everything else can be a calendar invite to yourself. Automation multiplies a message. It should not exist until you like the message.",
      },
    ],
  },
  {
    slug: "crm-email-marketing",
    title: "CRM email marketing",
    description:
      "When to send from the CRM versus a dedicated email tool, how logging helps sales, and why marketing blasts inside a CRM still need ESP habits.",
    query: "crm email marketing",
    kicker: "CRM vs ESP",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "CRM email marketing",
      "send email from CRM",
      "CRM vs ESP",
    ],
    sections: [
      {
        heading: "Two different send paths share a contact record",
        paragraphs: [
          "A CRM's job is the person and the deal: who owns the account, what was promised, what happens next. An ESP's job is the campaign: authentication, throttling, templates, unsubscribes, bounce handling. CRM email marketing is what happens when companies try to do the second job from the first system because the contacts already live there. [Salesforce](https://www.salesforce.com) and [HubSpot](https://www.hubspot.com) both sell this overlap. The overlap is a product choice, not a law of nature.",
          "That can be the right call for sales follow-up. It is often the wrong call for a 40,000-person newsletter. The CRM will happily let you select a view and send. Mailbox providers still treat that traffic as bulk mail. You inherit ESP problems without ESP tooling unless the CRM vendor also runs a real sending stack.",
        ],
      },
      {
        heading: "What sending from the CRM gets you",
        paragraphs: [
          "Logged activity is the honest win. A rep sees that marketing already sent the case study, so they do not paste it again. Deal stages can suppress people who are in procurement. Territory rules can keep a campaign off someone else's accounts. If your marketing tool is a separate island, none of that is automatic.",
          "Sales sequences (HubSpot sequences, Salesforce emails, Outreach-style steps wired into the CRM) belong here when a human is in the thread. Those messages should look like they came from a person, because they did. Volume should stay closer to a mailbox than to a blast. When a sequence starts looking like a newsletter with merge fields, you have crossed into marketing send and should switch tools.",
        ],
      },
      {
        heading: "What a dedicated ESP still does better",
        paragraphs: [
          "Dedicated email tools obsess over placement: dedicated or shared IPs, complaint loops, seed lists, template rendering, and a subscription center that is not buried in CRM settings. Ecommerce ESPs also understand catalogs, inventory, and browse events. Most CRMs treat those as custom objects you have to build.",
          "Deliverability teams prefer one marketing sending domain with clean DNS, not every salesperson's CRM blast going out through a mix of Gmail API and a forgotten marketing add-on. If sales already sends from connected inboxes, keep marketing on a separate subdomain (news. or mail.) so a bad campaign does not sink the reps' one-to-one mail.",
        ],
      },
      {
        heading: "A split that holds up",
        paragraphs: [
          "Use the CRM to decide who is eligible and to log what happened. Use an ESP (or the CRM vendor's actual marketing-email product, which is an ESP with a CRM skin) to send anything that is not a personal reply. Sync unsubscribes and bounces both ways the same day. If a person hits unsubscribe in the ESP and the CRM still shows them as 'subscribed,' you will mail them again and they will complain.",
          "Do not run two competing newsletters, one from Salesforce and one from Mailchimp, against the same file. Pick a system of record for marketing permission. The CRM can be that system if you treat subscription as a first-class field, not a note on the record.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is HubSpot a CRM or an ESP in this split?",
        answer:
          "Both, which is why people get confused. The CRM record is the source of truth for the person. Marketing Hub email is still a bulk sender with DNS, lists, and unsubscribes. Use it like an ESP that happens to sit on the same contact. Do not use a logged sales email as a substitute for that product.",
      },
      {
        question: "Can I skip an ESP if my CRM has a send button?",
        answer:
          "For a few dozen personal follow-ups, yes. For campaigns, only if that send button includes authentication, list-unsubscribe, bounce handling, and a way to export suppressions. Many CRM 'send' features are wrappers around a mailbox. Wrappers do not give you a marketing reputation.",
      },
    ],
  },
  {
    slug: "small-business-email-marketing",
    title: "Small business email marketing",
    description:
      "How a tiny list actually gets run: time budget, cheap tools, one promise, and the mistakes that burn a local or early-stage sender.",
    query: "small business email marketing",
    kicker: "Small business",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "small business email marketing",
      "email marketing for small business",
      "email list for small business",
    ],
    sections: [
      {
        heading: "Your constraint is hours, not features",
        paragraphs: [
          "A bakery, a plumber, a five-person shop, and a bootstrapped SaaS all get sold the same automation suite. None of them have a lifecycle marketer. Small business email marketing works when it fits a recurring block on the calendar, often one hour a week, and dies when it needs a campaign manager. A free or cheap ESP such as [Mailchimp](https://mailchimp.com) is enough for that hour if the list is still small.",
          "Write that hour down. Thirty minutes to draft, fifteen to send a test and click every link, fifteen to look at bounces and replies. If a tool needs a two-week onboarding, it is the wrong tool. You can grow into complexity. You cannot skip the hour.",
        ],
      },
      {
        heading: "A few hundred names is a real list",
        paragraphs: [
          "Collect from checkout, booking, a paper sign-up at the counter, or a single form on the site. Ask for email and first name. Tell people what they are joining: 'new hours and a monthly special,' not 'stay in the loop.' Enter paper sign-ups the same day. If you cannot point to when and how someone joined, do not mail them.",
          "Ignore industry averages about list size. Two hundred locals who know the shop will outperform five thousand scraped addresses, and the scraped file will get you tagged as spam. Paid list brokers selling 'small business owners in your city' are not a shortcut. They are how small senders ruin a new domain.",
        ],
      },
      {
        heading: "Tools that match a tiny operation",
        paragraphs: [
          "You need a sender that will authenticate your domain, host a form, store unsubscribes, and send a campaign without a contractor. Free tiers are fine until they block the domain authentication or stamp their brand in a way that looks untrustworthy. When you outgrow free, pay for sending and support, not for AI subject-line packs you will not use.",
          "Skip the customer data platform, the deliverability consultant, and the separate design tool. One column in the ESP builder, your logo, and links that go to pages that load on a phone. If you already run a store on Shopify or a CRM you live in, prefer the email product that already has those customers. Switching later is possible. Running two lists is how people get double mailed.",
        ],
      },
      {
        heading: "Cadence and copy that a owner can sustain",
        paragraphs: [
          "Monthly is enough for most shops. Weekly only if you truly have weekly news (inventory, slots, a class schedule). Empty weekly sends teach people to ignore you. Put the useful part in the first two sentences. Subject lines can be the fact: 'Saturday hours change' beats a teaser.",
          "Answer replies. On a small list, a reply is the point. If you cannot answer, do not ask questions in the email. Keep a short suppression list for people who paid and then asked you to stop, even if they did not hit unsubscribe. That is reputation management you can do in a spreadsheet if the ESP makes it clumsy.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Should a small business buy a dedicated IP?",
        answer:
          "Almost never. Dedicated IPs need steady volume to stay warm. Shared IPs at a reputable ESP are the normal path until you are sending large daily volumes. Spend the money on a domain you control and on writing the email.",
      },
      {
        question: "Is it worth emailing if I already post on Instagram?",
        answer:
          "Yes, because you do not own the Instagram distribution. A list of people who asked for hours, stock, or a discount still reaches them if the app changes. Keep the email useful and rare so it does not feel like a copy of the grid.",
      },
    ],
  },
  {
    slug: "best-email-marketing-tools",
    title: "Best email marketing tools",
    description:
      "How to assemble an email stack (capture, send, auth, measure) without a fake top 10. Mailchimp, Klaviyo, and Brevo as examples of different jobs.",
    query: "best email marketing tools",
    kicker: "Email stack",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "best email marketing tools",
      "email marketing stack",
      "email tools comparison",
    ],
    sections: [
      {
        heading: "This page is about a stack, not a winner",
        paragraphs: [
          "Search results for 'best email marketing tools' are usually ten logos and affiliate links. A working setup is several jobs: a form or checkout that captures permission, a place that stores the person, a composer, a sender with DNS authentication, and a way to see bounces, complaints, and site conversions. One vendor might cover most of that. Many teams still add a form tool, Google Analytics, and [Google Postmaster Tools](https://postmaster.google.com) around the sender.",
          "If you are choosing a single ESP product, that is a software decision. If you are choosing a CRM-plus-CMS suite, that is a platform decision. Those are separate pages on this site: [best email marketing software](/best-email-marketing-software) and [best email marketing platforms](/best-email-marketing-platforms). Stay here when you are mapping the pieces.",
        ],
      },
      {
        heading: "Criteria that beat a ranked list",
        paragraphs: [
          "Start with the event that creates the contact. A newsletter site needs a form and a confirmed opt-in. A store needs checkout, browse, and shipment events. A B2B team needs CRM fields and a subscription type sales cannot override by accident. The 'best' tool is the one whose data model matches that event. A beautiful campaign builder on top of the wrong data model becomes a weekly CSV ritual.",
          "Then check export. You should be able to download subscribers, unsubscribes, and bounce reasons without a support ticket. Check DNS: the vendor must give you SPF, DKIM, and DMARC instructions for a domain you own. Check who else sends on shared infrastructure if you are small; a neighbor with a spam problem is a real risk. Price the stack on contacts plus extra channels you will actually use, not on a feature matrix you will not staff.",
        ],
      },
      {
        heading: "Three senders that illustrate different jobs",
        paragraphs: [
          "[Mailchimp](https://mailchimp.com) is the generalist audience-and-campaign tool a lot of small lists still start on. It is a reasonable stack core when you have a newsletter, a simple automation, and no heavy product catalog. It is a weaker core when your emails must know inventory, collections, and predicted next order.",
          "[Klaviyo](https://www.klaviyo.com) is built around store and catalog events. If browse, abandon, and post-purchase are the stack, Klaviyo is often the sender other tools plug into, not a side app. [Brevo](https://www.brevo.com) (formerly Sendinblue) is a common pick when email, SMS, and transactional API need to live together at a lower price band. None of these is 'number one.' They fail at different jobs. Put the job first, then see which one is already good at it.",
        ],
      },
      {
        heading: "What else belongs next to the sender",
        paragraphs: [
          "You may still want a form tool if the ESP's embed is ugly or blocked by your CMS. You may want a rendering check (Litmus or Email on Acid) once designers ship HTML. You may want a dedicated transactional sender (Postmark, Amazon SES, or the ESP's transactional API) so password resets do not share reputation with the Friday promo. Those are tools in the stack. They are not a reason to collect ten ESPs.",
          "Draw the stack on one diagram with arrows for consent and suppression. If unsubscribe has to hop through three products, you will miss it. The best stack is the one a tired person can still operate on a Tuesday.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Should I use Mailchimp and Klaviyo together?",
        answer:
          "Almost never on the same people. Two senders mean two reputations and a double-send risk. Pick one marketing sender. Use a second product only for a different job, such as transactional mail on a different subdomain.",
      },
      {
        question: "Is a spreadsheet plus Gmail a stack?",
        answer:
          "It is how many people start, and it fails at unsubscribes, authentication, and logging. Move to an ESP before the list is large enough that a mistake is public. Gmail is a mailbox, not a campaign tool.",
      },
    ],
  },
  {
    slug: "email-marketing-templates",
    title: "Email marketing templates",
    description:
      "When a template saves production time, when it makes every brand look the same, and the layout habits that read as spam.",
    query: "email marketing templates",
    kicker: "Templates",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "email marketing templates",
      "email templates",
      "HTML email template",
    ],
    sections: [
      {
        heading: "A template is a constraint, not a brand",
        paragraphs: [
          "Templates exist because HTML email is still a pile of tables, image blocking, and Outlook quirks. A good one gives you a one-column width, a type scale that survives dark mode, a footer with address and unsubscribe, and a place for the actual sentence you came to write. That constraint is the value. The stock hero image of smiling strangers is not. ESP galleries from [Mailchimp](https://mailchimp.com) or [Brevo](https://www.brevo.com) are a starting point. Strip the stock photo before you send.",
          "Use a template when several people will send and you need the footer to stay legal. Use one when you send often enough that rebuilding layout would steal the writing hour. Do not use one because the ESP dashboard opened on a gallery of seasonal themes. Those galleries are how unrelated brands ship the same purple banner and the same fake button.",
        ],
      },
      {
        heading: "When templates start looking like junk",
        paragraphs: [
          "Mailbox filters and humans both react to the same tells: a giant image and almost no live text, too many competing buttons, URL shorteners, 'click here' repeated, and a preview pane that says 'Having trouble viewing this email?' as the first line. If your template requires the images to load before the message makes sense, people on mobile with images off get nothing. That pattern still shows up in 'professional' themes.",
          "Identical structure every send can also train people to skim. If every campaign is hero, three columns, testimonial, CTA, you have built a banner ad. Vary the content even if the shell stays. A plain-text-looking note from a person should not wear the same chrome as a product drop.",
        ],
      },
      {
        heading: "What to lock versus what to rewrite",
        paragraphs: [
          "Lock the header logo, the footer, the unsubscribe, the physical address, and the max width. Rewrite the first screen every time: preheader, subject, and the opening paragraph. Those three decide whether anyone reaches the template at all. Locking them into 'This month from Acme' is how newsletters become wallpaper.",
          "Coded custom templates make sense when you have a designer who will test in Gmail, Outlook, and Apple Mail, including dark mode. Drag-and-drop templates make sense when the writer is also the sender. Mixing a custom HTML paste into a builder that then wraps it twice is how you get nested tables and broken buttons. Pick one production path.",
        ],
      },
      {
        heading: "Accessibility is part of the template",
        paragraphs: [
          "Real alt text, link underlines or a second cue besides color, type large enough on a phone, and a contrast that still works when the client inverts colors. Screen readers hit your email. So do people who never load images. If the template cannot survive both, it is a picture, not a message.",
          "Keep a text-only version. Many ESPs generate one. Read it. If it is a dump of links and leftover tracker URLs, fix the template until the text version is something you would send from a personal mailbox.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Are free template marketplaces safe to use?",
        answer:
          "Only after you strip unknown tracking, replace the footer with your legal bits, and send tests. A free file can include leftover merge tags or images hosted on someone else's server that will die. Treat marketplace HTML as a sketch, not as production.",
      },
      {
        question: "Should transactional mail use the marketing template?",
        answer:
          "Keep receipts and password resets much quieter. A shared header is fine. Promotional modules, social icon rows, and extra CTAs do not belong on a shipping notice. People should trust that message even if they never open a campaign.",
      },
    ],
  },
  {
    slug: "influencer-marketing",
    title: "Influencer marketing",
    description:
      "How creator deals actually work: disclosure, B2B versus consumer, and where newsletters fit compared with social posts.",
    query: "influencer marketing",
    kicker: "Creators",
    cluster: "general",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "influencer marketing",
      "creator partnerships",
      "B2B influencer marketing",
    ],
    sections: [
      {
        heading: "You are renting someone else's trust",
        paragraphs: [
          "Influencer marketing is a paid or gifted mention from a person whose audience already listens. The asset is not the follower count. It is whether those people still believe the person when a product appears. That belief dies fast if the deal is hidden or the product is a mismatch. Treat it like buying a recommendation, not like buying an ad slot with a face on it.",
          "The work is sourcing, briefing, contracting, disclosing, and measuring without pretending a screenshot of 'likes' is a pipeline. A creator who will not share how they collect addresses, or who only offers a story that disappears, is a brand-awareness buy. Price it that way.",
        ],
      },
      {
        heading: "Disclosure is not optional copy",
        paragraphs: [
          "In the US, the FTC expects material connections to be obvious. Their [Disclosures 101](https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers) is the document to hand talent. A #ad buried under hashtags, or a 'thanks to our partner' in a caption people skip, is the usual failure. Put the disclosure in the first lines of the post, video, or email. If the platform has a paid-partnership toggle, use it and still write the words.",
          "Contracts should state who writes the disclosure, who keeps comments civil, whether you can reuse the footage, and what happens if the creator posts late. Gifted product is still a material connection. Employee accounts posting about their employer are too.",
        ],
      },
      {
        heading: "Consumer creators and B2B creators are different trades",
        paragraphs: [
          "Consumer deals often live on Instagram, TikTok, YouTube, and affiliate links. Success looks like codes redeemed, site visits, or content you can reuse. B2B 'influencers' are usually operators with a newsletter, a podcast, or a LinkedIn audience in a niche: security, payments, logistics. They will not dance. They might introduce you to ten buyers who already trust their technical taste. Brief them with facts, limits, and who should not be pitched.",
          "A B2B creator who only offers a LinkedIn post and no way to see click-through is hard to judge. A newsletter swap or a sponsored issue is closer to email marketing: you can see unsubscribes and replies. That is still influencer marketing. It is just measured like a list, not like a viral clip.",
        ],
      },
      {
        heading: "Where email belongs in a creator deal",
        paragraphs: [
          "Ask whether you are buying a social post, an email to their list, or both. An email to a list they own is often worth more than a feed post, and creators price it that way because it costs them reputation with people who gave an address. Require a from-name that is obviously them, your disclosure, and a link you can tag. Do not demand they hand you the list. You are renting a send, not acquiring their file.",
          "If you run your own list, a creator can guest write an issue you send. That is content, not influencer marketing, unless you are also paying them to promote that issue to their audience. Keep the two invoices separate so you know which lever moved.",
        ],
      },
    ],
    faqItems: [
      {
        question: "How do I know a creator's audience is real?",
        answer:
          "Ask for a recent screenshot of email open and click from their ESP, or a live look at analytics, not a media kit PDF from last year. On social, look at comment quality and sudden follower jumps. If they refuse any proof, you are buying a screenshot.",
      },
      {
        question: "Is employee advocacy the same thing?",
        answer:
          "No. Employees posting branded content is internal communications with disclosure duties. It can help. It is not a substitute for a creator whose audience did not take the job.",
      },
    ],
  },
  {
    slug: "mailchimp",
    title: "Mailchimp",
    description:
      "What Mailchimp is, who still uses it well, and where a generalist audience tool stops fitting as the list and the data get more specific.",
    query: "mailchimp",
    kicker: "Mailchimp",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "Mailchimp",
      "what is Mailchimp",
      "Mailchimp email marketing",
    ],
    sections: [
      {
        heading: "A generalist sender with a long memory",
        paragraphs: [
          "[Mailchimp](https://mailchimp.com) is an email marketing product that grew up on newsletters and small-business campaigns. You keep an audience (their word for the list), send campaigns, and attach automations they now call customer journeys. Intuit owns the company. The product still shows up whenever someone says they need 'the normal email tool' and does not want a CRM project.",
          "Typical use looks like this: a form on a site, tags for what people asked for, a welcome automation, and a campaign when there is news. Agencies also sit on it because clients already have logins. That familiarity is the product as much as the editor.",
        ],
      },
      {
        heading: "What people actually do in it",
        paragraphs: [
          "Audiences hold subscribers and the fields you add. Segments are filters on those fields and on campaign behavior. Campaigns are the one-off sends. Automations cover welcome, some ecommerce triggers if you connect a store, and simple drips. The builder is aimed at people who will not write HTML. Reports show opens, clicks, bounces, and unsubscribes with the usual caveats about open tracking.",
          "Mailchimp also bolted on CRM-ish contact views, a website builder, and ads. Those extras matter only if you were going to use Mailchimp as the center of the business. Many customers ignore them and stay in audience plus campaign. That is a valid way to use the tool. Paying for a suite you treat as an ESP is a budget problem, not a moral one.",
        ],
      },
      {
        heading: "Where it still fits",
        paragraphs: [
          "A publisher, a local business, a community, or a B2B company with a simple newsletter and no catalog events. If your 'personalization' is first name and one interest tag, Mailchimp is in its original job. Connecting a basic store is possible. Confirm the current ecommerce features on their site rather than assuming Klaviyo-level catalog logic.",
          "Free and low tiers exist and change. They are useful for learning the workflow. Read the send limits and branding rules before you promise a client a paid-looking program on a free account. Domain authentication is worth doing even on a small plan so Gmail knows you are you.",
        ],
      },
      {
        heading: "Where teams leave",
        paragraphs: [
          "They leave when the money is in triggered store email that needs inventory, collections, and browse. They leave when the company already standardized on a CRM and does not want a second contact database to keep in sync. They leave when they need a dedicated IP, a complex preference center, or a transactional stream that Mailchimp is not how they want to run.",
          "Leaving hurts if tags were used as a junk drawer. Export audience, unsubscribes, and suppression before you switch. Rebuild segments from fields, not from folklore about what a tag meant in 2019. Mailchimp is not a trap. Messy audiences are.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is Mailchimp still only for email?",
        answer:
          "Email is still the reason most people log in. The company sells a broader marketing cloud around it. Judge the account by the features you will staff. A logo that says platform does not make your newsletter a platform.",
      },
      {
        question: "Can I use Mailchimp for password-reset mail?",
        answer:
          "Transactional mail can live in Mailchimp or in a specialist sender. If you mix resets with promotions on the same domain and reputation, a bad campaign can delay a login email. Many teams put transactional mail on a separate subdomain and tool.",
      },
    ],
  },
  {
    slug: "email-marketing-trends",
    title: "Email marketing trends",
    description:
      "Shifts that actually changed sending: bulk-sender rules, broken open rates, first-party lists, and machine-written drafts. No invented percentages.",
    query: "email marketing trends",
    kicker: "Trends",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "email marketing trends",
      "email sender requirements",
      "email marketing 2026",
    ],
    sections: [
      {
        heading: "Mailbox providers wrote the last few years",
        paragraphs: [
          "The trend that mattered was not a new subject-line trick. Gmail and Yahoo told bulk senders to authenticate, to keep spam complaints down, and to offer one-click unsubscribe. [Google's sender guidelines](https://support.google.com/mail/answer/81126) are the document, not a conference slide. If you send a lot of mail to Gmail, SPF, DKIM, and a DMARC policy are table stakes. Treat them as operations, not as a branding project.",
          "BIMI (the brand logo in supporting inboxes) showed up in more conversations. It needs DMARC at enforcement and, in some inboxes, a verified mark certificate. It is a real shift for companies that already authenticate well. It is not a growth hack for a dirty list.",
        ],
      },
      {
        heading: "Open rate stopped being a planning number",
        paragraphs: [
          "Apple Mail Privacy Protection prefetches pixels. Other clients block images. Opens still appear in ESP dashboards. They no longer mean a person looked at the message. Teams that still forecast from open rate are arguing with a prefetch bot. Clicks, replies, conversions, unsubscribes, and complaint rates are the numbers that still describe humans.",
          "That change pushed some programs toward shorter mail that states the link in text, and toward asking for a reply on purpose. It also made A/B tests on subject lines noisier if the 'winner' was chosen on opens. Test on clicks or on the downstream action when you can.",
        ],
      },
      {
        heading: "First-party lists and quieter acquisition",
        paragraphs: [
          "Cookies keep shrinking as a crutch. Email is one of the few places a company can talk to someone who raised a hand. The trend is boring: better forms, clearer promises, fewer purchased files, more preference centers. 'Growth' lists that never opted in are getting more expensive in complaint rate, which is now a number providers publish expectations around.",
          "Retail and media companies that used to rent third-party audiences are putting more weight on the list they already have. That only works if the mail is worth keeping. Frequency experiments (fewer sends, better ones) are more honest than adding a second daily blast to 'hit the number.'",
        ],
      },
      {
        heading: "Drafting got cheaper. Sending did not get safer.",
        paragraphs: [
          "Models will draft a campaign in seconds. Inbox providers did not relax authentication because the copy was generated. The trend to watch is review load: more variants, same brand-risk. Teams that paste AI output into a template and send are publishing claims nobody checked. Teams that use drafts as a first pass and keep a human on facts are just writing faster.",
          "Ignore infographics that recycle 'email ROI' figures from a decade ago. If a trend piece leads with a made-up open-rate benchmark, close it. The operational shifts above are enough work for a year.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Did one-click unsubscribe kill newsletters?",
        answer:
          "It made leaving easier, which is the point. Lists that relied on a buried link will look smaller. Lists people wanted will lose fewer readers than you fear, and the ones who leave would have complained instead.",
      },
      {
        question: "Where should I read about new rules without the hype?",
        answer:
          "Start with Google's sender guidelines, Yahoo's sender documentation, and your ESP's changelog. For a running list of those sources, see [email marketing news](/email-marketing-news).",
      },
    ],
  },
  {
    slug: "ecommerce-email-marketing",
    title: "Ecommerce email marketing",
    description:
      "Store email that follows the cart: browse, abandon, post-purchase, and replenishment, plus why catalog data matters more than campaign art.",
    query: "ecommerce email marketing",
    kicker: "Ecommerce",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "ecommerce email marketing",
      "abandoned cart email",
      "Klaviyo ecommerce email",
    ],
    sections: [
      {
        heading: "The store already has the events. Email should use them.",
        paragraphs: [
          "Ecommerce email marketing is not a monthly lookbook with a coupon code, though that send still exists. The mail that usually pays for the tool is triggered: viewed a product and left, started checkout and stalled, bought and needs a receipt plus a next useful item, bought a consumable and might need another. Those messages need product ID, price, image, inventory, and a cart URL that still works.",
          "If your ESP only knows an email address and a first name, you will fake that with 'you left something behind' and a generic homepage link. People ignore it. Connect the store so the email can show the thing they actually touched.",
        ],
      },
      {
        heading: "Browse, abandon, purchase",
        paragraphs: [
          "Browse abandonment is a reminder of a product view, usually after a quiet window so you do not mail someone still on the site. Cart abandonment fires on a checkout that did not finish. Keep it factual: the items, the price, a way back. Countdown timers and fake scarcity are how stores train filters and customers to distrust them. One or two follow-ups is enough. A five-step guilt sequence is how you get unsubscribes from people who still might have bought.",
          "Post-purchase should first confirm the order and shipping, without a hard sell on top of the receipt. Later, a request for a review, a care guide, or a complementary product can exist as a separate message. Mixing 'your package shipped' with three upsells makes the transactional mail look like a campaign. Keep receipts quieter than promotions, ideally on a subdomain that promotions cannot poison.",
        ],
      },
      {
        heading: "Why Klaviyo shows up in this aisle",
        paragraphs: [
          "[Klaviyo](https://www.klaviyo.com) became the default conversation for Shopify-heavy teams because it treats store events and catalog data as the core object, then hangs flows on those events. Other ESPs have added ecommerce features. If you evaluate them, ask to see a browse flow using live inventory, not a campaign template with a product block pasted in.",
          "Klaviyo is not mandatory. It is a poor fit if you do not have a store, or if your 'shop' is a few SKUs you would rather describe in a newsletter. It is also a lot of tool if you only wanted a receipt and a monthly sale. Match the product graph, not the logo on Twitter.",
        ],
      },
      {
        heading: "Consent still applies at checkout",
        paragraphs: [
          "Pre-checked marketing boxes are how stores collect addresses they cannot defend. Separate transactional permission (needed to fulfill) from marketing permission (needed to send the browse flow). A buyer who unticked marketing should still get the shipping email. They should not get the win-back campaign.",
          "Wholesale and DTC on the same file is another mess. A retailer who bought a case should not receive a consumer abandon flow for the same SKU. Use tags or lists that follow customer type from the commerce platform. Ecommerce email fails as operations before it fails as copy.",
        ],
      },
    ],
    faqItems: [
      {
        question: "How soon should an abandon email send?",
        answer:
          "Long enough that the person is not still checking out, short enough that the cart still exists. Many stores start around an hour for cart, longer for browse. Test with your own checkout. If the email arrives while you are on the payment page, it is too fast.",
      },
      {
        question: "Do I still need campaigns if flows run?",
        answer:
          "Yes, for launches, seasonal stories, and people who did not trigger a flow. Flows cover behavior you already observed. Campaigns cover news. Just suppress recent buyers from a blast that would repeat the same SKU they already own.",
      },
    ],
  },
  {
    slug: "email-marketing-course",
    title: "Email marketing course",
    description:
      "How to pick a course worth the hours: curriculum to demand, what to learn first, and which programs are just a vendor demo with a certificate.",
    query: "email marketing course",
    kicker: "Courses",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "email marketing course",
      "learn email marketing",
      "email marketing training",
    ],
    sections: [
      {
        heading: "A course is a syllabus, not a personality",
        paragraphs: [
          "Search 'email marketing course' and you get creators selling a community, ESPs selling certifications, and universities selling a module inside a digital marketing certificate. The useful test is the outline. You want permission and law, list hygiene, DNS authentication, writing, basic HTML constraints, measurement that is not open rate, and then automation. If the outline starts with 'my $10k funnel' and never mentions DMARC or unsubscribe, it is a sales page.",
          "Vendor certifications (HubSpot, Klaviyo, Mailchimp) teach that vendor's UI. They are worth it if you already chose the tool. They are a weak first course if you do not know whether you should be on an ESP or a CRM. Take them second.",
        ],
      },
      {
        heading: "What to learn before you pay anyone",
        paragraphs: [
          "You can learn the first layer without a cart. Read how a list is built, how [CAN-SPAM](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) treats commercial mail in the US, and how Gmail's [sender guidelines](https://support.google.com/mail/answer/81126) treat bulk senders. Send a campaign to yourself from a real ESP free tier. Authenticate a domain. Look at a bounce. That weekend will tell you more than a twelve-hour video that never leaves slides.",
          "Writing is the other unpaid layer. Practice a welcome, a plain announcement, and a one-link ask. If you cannot write those, a course on advanced segmentation will give you busywork. Copy is still the product.",
        ],
      },
      {
        heading: "How to judge a paid program",
        paragraphs: [
          "Look for homework on a list you control, not quizzes about definitions. Ask when the material was updated relative to Apple Mail privacy and the 2024 Gmail/Yahoo bulk rules. Ask whether they teach you to export unsubscribes. A teacher who will not talk about complaints is teaching you to hide.",
          "Beware lifetime communities that replace a curriculum with a feed. Beware 'done with you' upsells that appear after the course, where the same company wants to run your ESP. Training and agency delivery can coexist. They should be priced and contracted as different things so you know if you learned or just outsourced.",
        ],
      },
      {
        heading: "A sensible order of study",
        paragraphs: [
          "Permission and data, then deliverability basics, then writing and design constraints, then campaigns, then automation, then analytics. Ecommerce people insert catalog events before fancy brand newsletters. B2B people insert CRM hygiene before lead-scoring theater. Skipping to AI subject lines is how you get a certificate and a spam folder.",
          "After a course, the portfolio is three live sends with notes on what you changed. Employers and clients can read those. They cannot read a badge.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Do I need a degree in marketing first?",
        answer:
          "No. You need to be able to write clearly, follow DNS instructions, and respect consent. A general marketing degree that never sent mail is not a substitute. A short course plus a live list is.",
      },
      {
        question: "Are YouTube tutorials enough?",
        answer:
          "Enough to see a UI. Not enough for law, authentication, and judgment. Use videos to unstick a builder. Use primary docs and a real send for the rest.",
      },
    ],
  },
  {
    slug: "email-marketing-news",
    title: "Email marketing news",
    description:
      "Where to watch real changes: Gmail and Yahoo rules, Apple and Outlook clients, ESP changelogs. Not a rumor roundup.",
    query: "email marketing news",
    kicker: "News sources",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "email marketing news",
      "Gmail sender requirements",
      "email client updates",
    ],
    sections: [
      {
        heading: "News here means sender rules and client behavior",
        paragraphs: [
          "Most 'email marketing news' blogs recycle the same list of subject-line ideas. The news that can take a program down is narrower: a mailbox provider changing authentication or unsubscribe requirements, a client changing how pixels and HTML render, or an ESP changing how they pass List-Unsubscribe headers. Follow those, and the rest is optional reading.",
          "This is not the same job as [email marketing trends](/email-marketing-trends), which is about the shifts themselves. This page is a map of sources so you are not dependent on a newsletter that heard a rumor.",
        ],
      },
      {
        heading: "Providers and clients",
        paragraphs: [
          "Bookmark [Google's email sender guidelines](https://support.google.com/mail/answer/81126) and Google Postmaster Tools for spam-rate and authentication views on Gmail traffic. Yahoo publishes sender best practices for Yahoo and AOL mailboxes. When either vendor announces a bulk-sender change, read the primary post, then your ESP's translation. The translation is sometimes late or incomplete.",
          "Apple publishes enough about Mail Privacy Protection and Mail on iOS that you should watch Apple's release notes when a new OS ships. Microsoft documents Outlook rendering quirks; Word-as-engine still breaks layouts that looked fine in Gmail. Litmus and Email on Acid changelogs are useful when a client update starts slicing buttons. They are vendors, so treat their 'state of email' surveys as marketing, and their rendering notes as engineering.",
        ],
      },
      {
        heading: "ESPs, standards, and law",
        paragraphs: [
          "Every ESP has a status page and a product changelog. The changelog is how you learn they changed click tracking, sunset a classic builder, or finally added one-click unsubscribe. Subscribe to the status page if you send on their IPs. A quiet incident on a Thursday is still your incident.",
          "For standards, IETF work on one-click unsubscribe (RFC 8058) and DMARC is slow and then suddenly everywhere. For law, watch the FTC for CAN-SPAM guidance and your own counsel for GDPR, CASL, and state privacy rules. A marketing blog paraphrasing a law is not a source. If you send to more than one country, keep a lawyer in the loop when a rule changes. Do not wait for a Twitter thread.",
        ],
      },
      {
        heading: "A reading cadence that does not eat the week",
        paragraphs: [
          "Once a month, skim provider docs you already bookmarked for diffs, read your ESP changelog, and send a test to a seed list of Gmail, Outlook, Yahoo, and Apple Mail. When something looks different, screenshot it. That is news you can act on. Daily inbox-placement newsletters are optional. Many exist to sell monitoring.",
          "If a headline says 'email is dead' or quotes an ROI figure with no method, it is entertainment. Operational news has a date, a vendor, and a behavior that changed.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Do I need a paid deliverability newsletter?",
        answer:
          "Not to start. Primary docs plus Postmaster Tools plus a seed send catch most surprises. Paid monitoring helps when you have volume and a reputation you cannot afford to learn about from complaints.",
      },
      {
        question: "Where do Apple Mail changes show up first?",
        answer:
          "Often in iOS and macOS release notes, then in rendering tools, then in ESP blogs. If you send a lot of HTML, keep a physical iPhone on the current OS in the test rotation. Screenshots from last year lie.",
      },
    ],
  },
  {
    slug: "ai-email-marketing",
    title: "AI email marketing",
    description:
      "Using models to draft campaigns versus letting them send. Where they help, where they invent, and the review queue you still need.",
    query: "ai email marketing",
    kicker: "AI drafts",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "AI email marketing",
      "AI email copy",
      "generative email campaigns",
    ],
    sections: [
      {
        heading: "Draft is a feature. Send is a decision.",
        paragraphs: [
          "AI email marketing, in practice, is a model proposing subject lines, body copy, or segments, and a person deciding whether that proposal may leave the building. ESPs added 'generate' buttons because blank pages scare people. The button does not know your refund policy, your unpublished pricing, or which competitor you will not name. If the same button can also schedule the campaign, you have a brand incident waiting for a tired afternoon. [HubSpot](https://www.hubspot.com) and others ship this as a draft aid. Keep it as a draft aid.",
          "Keep generation inside a draft state. The send path should still require the same approvals you use for a human writer: facts, legal claims, audience, and a test to a real inbox. Speed is the benefit. Skipping the test is how a model ships 'we are #1 in Europe' to 80,000 people.",
        ],
      },
      {
        heading: "What models are decent at",
        paragraphs: [
          "Restating a brief you already wrote. Offering three subject variants when you already know the offer. Turning a shipping delay into a calmer paragraph. Summarizing a blog post you trust into a shorter email, if you check the summary against the post. Those are typing assistants.",
          "They are also decent at suggesting a structure: welcome, then proof, then ask. Structure is cheap. You still have to fill it with true specifics. If the brief is empty, the model will invent a customer named Sarah and a 40% lift. Delete Sarah.",
        ],
      },
      {
        heading: "Brand and legal risk",
        paragraphs: [
          "Models borrow tone from the internet, including other brands' slogans and leftover marketing cliches. They will claim certifications you do not have, quote reviews that do not exist, and offer discounts finance never approved. In regulated categories (health, finance, kids), that is not a quality problem. It is a compliance problem. Put prohibited claims in the instructions, and still read the output. Instructions are not a guarantee.",
          "Personalization from CRM fields is riskier than it looks. A model that writes 'sorry your deal stalled in legal' to the wrong person has created a story about a deal that might be confidential. Limit merge data. Do not dump the whole record into a prompt. For one-to-one sales mail, a human should still own the send.",
        ],
      },
      {
        heading: "Automation plus generation is the sharp edge",
        paragraphs: [
          "A flow that generates a unique body for every abandoner sounds personal. It also means nobody read the message. Unique HTML is harder to QA. Unique claims are harder to recall. If you use generation in a flow, constrain it to a template with locked legal lines and a short free-text slot, or generate once per campaign version and reuse.",
          "Measure the program the same way as before: complaints, unsubscribes, clicks, revenue. If generated mail gets more clicks and more complaints, you did not find a growth channel. You found a way to annoy people faster.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Should AI pick the audience too?",
        answer:
          "Not without a human looking at the resulting list. Models will optimize for who might click, which can include people who opted out of that topic or who are already in a sales dispute. Audience is a permission decision.",
      },
      {
        question: "Can I train a model on our best campaigns?",
        answer:
          "You can use past mail as examples if you have the rights and you strip personal data. That helps tone. It does not prove the next claim is true. Keep a fact sheet the model is not allowed to contradict.",
      },
    ],
  },
  {
    slug: "social-media-marketing",
    title: "Social media marketing",
    description:
      "Organic posts versus paid social, what you rent from an algorithm, and why email is still the channel you keep when the feed changes.",
    query: "social media marketing",
    kicker: "Social media",
    cluster: "general",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "social media marketing",
      "organic vs paid social",
      "social media vs email",
    ],
    sections: [
      {
        heading: "A feed is a landlord",
        paragraphs: [
          "Social media marketing is the work of getting attention inside someone else's product: Meta's apps, YouTube, TikTok, LinkedIn, X, and the rest. Organic reach is whatever the ranking system still shows to people who already followed you. Paid social is the auction for the rest. Both can work. Neither is a list you take with you if the app dies, the account gets restricted, or the ranking system decides your link is unwelcome. Start with the first-party docs: [Meta Business](https://www.facebook.com/business) and [LinkedIn Marketing Solutions](https://business.linkedin.com/marketing-solutions).",
          "Plan social like you plan retail shelf space. You can be good at merchandising. You do not own the store. The practical habit is to use social to earn an address, a text opt-in, or a logged-in user, then talk to those people in a channel you operate.",
        ],
      },
      {
        heading: "Organic and ads are different jobs",
        paragraphs: [
          "Organic is publishing on a cadence the team can keep, answering comments, and making work native to the format (a talk on LinkedIn, a demo on YouTube, a short on TikTok). It is slow and public. It is a poor place to dump the same newsletter HTML. Each network has rules about links, clickbait, and misleading buttons. Breaking them is how organic reach falls off a cliff and how ads get rejected.",
          "Ads need a pixel or event you are allowed to use, a creative that states the offer, and a landing page that matches. They also need a budget you will cut when the auction gets expensive. Mixing organic reporting with paid reporting is how teams convince themselves a page 'went viral' when they spent the virality.",
        ],
      },
      {
        heading: "Email as the owned counterpart",
        paragraphs: [
          "Email is slower to grow and ruder if you abuse it, but the file is yours subject to consent law. When Instagram hides links, the list still gets the link. When LinkedIn throttles a company page, a permissioned send still lands in a mailbox. That is the honest contrast: LinkedIn (and every other feed) is distribution you rent. A list people asked to join is distribution you operate. Use social to fill the list. Do not assume a follower is a subscriber.",
          "The reverse mistake is treating email as if it were a feed: posting three times a day because the algorithm likes volume. Mailboxes like restraint. Match the channel to the behavior. Social can be frequent and disposable. Email should be rarer and complete.",
        ],
      },
      {
        heading: "Measurement without folklore",
        paragraphs: [
          "Count follows only as a funnel into something you control. Count paid on cost per the action you wanted, after attribution windows you understand. UTM the links. If a creator deal cannot produce a tagged URL, you bought vibes. Screenshot vanity is not a close.",
          "Staff social like a public inbox. Someone has to answer. A brand that posts and disappears trains people to message competitors. If you cannot staff comments, post less, or stay in channels that are closer to broadcast (YouTube) and still check the queue.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Should every company be on every network?",
        answer:
          "No. Pick the one or two where your buyers already linger and where you can publish in the native format. A dead TikTok and a dead X account are not a strategy. They are litter.",
      },
      {
        question: "Is a LinkedIn page enough for B2B?",
        answer:
          "A page is a brochure. People still decide in threads, groups, and inboxes. Use the page for news, use people at the company for conversation, and use email for anyone who asked for a longer story. Do not confuse page impressions with pipeline.",
      },
    ],
  },
  {
    slug: "email-marketing-management",
    title: "Email marketing management",
    description:
      "The operating cadence: calendar, approvals, QA, incidents, and who owns the list when several people can hit send.",
    query: "email marketing management",
    kicker: "Operations",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "email marketing management",
      "email calendar",
      "email QA checklist",
    ],
    sections: [
      {
        heading: "Management is the calendar plus the brakes",
        paragraphs: [
          "Email marketing management is the boring system that keeps a program from depending on whoever remembers. It is a calendar of what sends when, a list of who may approve, a QA pass that happens even when the campaign is 'just a GIF,' and a written path for what you do after a bad send. Tools do not provide this. A shared doc and a stubborn habit do. A hub such as [HubSpot](https://www.hubspot.com) can hold the calendar. It will not invent the habit.",
          "Without it, two teams book the same Friday, sales pastes a file into a blast, and nobody notices the footer still has last year's address. With it, you still make mistakes. You make fewer public ones.",
        ],
      },
      {
        heading: "A week that can repeat",
        paragraphs: [
          "Pick a planning day. Look at launches, shipping promises, webinars, and billing dates so email does not collide with a downtime notice. Slot campaigns. Protect transactional mail from promotional creative. Write freeze windows (for example, no experiments during a site migration). Put owner names on each send, not a team name.",
          "Mid-week is for building and testing. Send day is for the checklist, not for rewriting the offer. After send, someone watches bounces and replies for an hour. If that person is on holiday, the send does not go. 'We will monitor it from the airport' is how incidents start.",
        ],
      },
      {
        heading: "QA that is written down",
        paragraphs: [
          "Click every link in a preview that is not your own laptop. Send tests to Gmail, Outlook, and Apple Mail. Check dark mode. Check the from-name and reply-to. Check that the audience excluded unsubscribes, recent complainers, and the segment that already got a similar mail. Check that merge fields have fallbacks so nobody sees *|FNAME|*.",
          "Legal looks at claims and required footer lines. Someone who did not write the email reads the first screen out loud. If they cannot tell what to do, it is not ready. Screenshots of the approved version go in the ticket so a last-minute 'tweak' is visible.",
        ],
        bullets: [
          "Audience: inclusion, exclusion, count sanity-check against last send",
          "Content: links, images alt text, plain-text part, unsubscribe",
          "Identity: from, reply-to, authenticated domain",
          "Stop conditions: who can pause, and how fast",
        ],
      },
      {
        heading: "Access, vendors, and incidents",
        paragraphs: [
          "Limit who can export the list and who can hit send. Shared logins are how ex-contractors still have your audience. Use SSO if the ESP offers it. Agencies need a role, an end date, and a rule that the client owns the account. If the agency built the audience in their reseller portal, you do not have a program. You have a hostage.",
          "When a bad email goes out, pause the campaign, send a correction only if the error is factual and harmful, and tell support what people will reply. Do not send a second joke email about the mistake unless you are sure the list still likes you. Log the cause (wrong segment, bad merge, leftover test link) and change the checklist. Management is that change, not the apology.",
        ],
      },
    ],
    faqItems: [
      {
        question: "How many people should be able to send?",
        answer:
          "As few as can cover holidays. Everyone else gets draft access. A company of 200 does not need 40 marketers with send rights. It needs two who are awake on send day and a documented deputy.",
      },
      {
        question: "Do we need a separate tool for the calendar?",
        answer:
          "A shared calendar and a ticket per send is enough until volume is high. Dedicated campaign-management tools help when several brands or regions collide. They do not replace QA.",
      },
    ],
  },
  {
    slug: "best-email-marketing-software",
    title: "Best email marketing software",
    description:
      "How to buy an ESP product: sending, seats, data export, and switching cost. Not a stack diagram and not an all-in-one suite ranking.",
    query: "best email marketing software",
    kicker: "ESP software",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "best email marketing software",
      "email marketing software",
      "choose an ESP",
    ],
    sections: [
      {
        heading: "Software, here, means the sending product",
        paragraphs: [
          "Email marketing software is the application you log into to build a message, pick an audience, and send it on authenticated infrastructure. Buyers call that an ESP. This page is the purchase of that product: what to ask in a demo, what to put in a contract, and what makes a switch painful. It is not a list of ten ranked logos. Rankings rot. Your send volume, store, and CRM do not. [Mailchimp](https://mailchimp.com), [Klaviyo](https://www.klaviyo.com), and [Brevo](https://www.brevo.com) are three different ESPs. Demo the one that matches how you sell, not the one with the loudest ads.",
          "If you need several specialist apps around the sender, that is a [tools / stack](/best-email-marketing-tools) problem. If you want CRM, CMS, ads, and email under one vendor login, that is a [platforms](/best-email-marketing-platforms) problem. Mixing those three searches is how people buy a suite to solve a bounce issue, or buy five tools when they needed one ESP with a working API.",
        ],
      },
      {
        heading: "What to open in the demo",
        paragraphs: [
          "Authenticate a domain in the trial. If the vendor cannot show SPF, DKIM, and DMARC setup without a professional-services ticket, you are buying a mailbox wrapper. Import a CSV with an unsubscribe flag and prove those people cannot be selected. Build one campaign and one automation. Export the audience, the unsubscribes, and a bounce report without begging. Send a test to Gmail and Outlook from their environment, not from a slide.",
          "Ask how they handle List-Unsubscribe and one-click unsubscribe for bulk mail. Ask whether marketing and transactional streams can use different subdomains. Ask whether your traffic sits on shared IPs, and what happens to you if a neighbor is noisy. Ask how seats work: is a contractor a full license, and can you revoke them the day the contract ends?",
        ],
      },
      {
        heading: "Commercial terms that show up later",
        paragraphs: [
          "Pricing is usually contacts, sends, or both, plus extras for SMS, dedicated IPs, or support. Overages are where 'cheap' software becomes expensive. Get the overage rate in writing. Confirm you can delete contacts and that deletion is real, not a hide. Confirm the vendor cannot use your list to train a public model if that matters to you. Confirm data residency if you promised customers a region.",
          "Annual contracts should include an export window and a notice period that does not trap you through another holiday season. If onboarding is mandatory and billed, ask what happens if authentication never works. Software that only lives after a six-week implementation is closer to a project than a product. Budget the project.",
        ],
      },
      {
        heading: "Switching cost is the real 'best'",
        paragraphs: [
          "The best software is the one you can leave. That means documented APIs, webhooks for unsubscribes, and templates you own in HTML, not only in a proprietary block format. It means suppression stored as data, not as a folklore checkbox. Teams stay in mediocre ESPs because the preference center cannot be rebuilt. Inspect that before you fall in love with the editor.",
          "Do not pick software because a podcast named it number one. Pick it because a trial sent real mail, a lawyer can live with the DPA, and a tired operator can export the file on a Friday.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is the cheapest ESP the right software?",
        answer:
          "Only if authentication, suppression, and export work. Cheap sending on a domain you cannot warm, or on a vendor who holds the list hostage, is not cheap. Price the exit.",
      },
      {
        question: "Should sales email live in the same software?",
        answer:
          "Logged one-to-one mail can live in the CRM. Bulk marketing should live in software that thinks like an ESP. If one product does both, keep the streams on different subdomains and different permission fields so a campaign cannot borrow a salesperson's reputation.",
      },
    ],
  },
  {
    slug: "email-marketing-solutions",
    title: "Email marketing solutions",
    description:
      "What bundled 'email solutions' actually sell: software plus an agency, who owns the list, and how to unbundle the invoice.",
    query: "email marketing solutions",
    kicker: "Bundled offers",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "email marketing solutions",
      "email marketing package",
      "agency plus ESP",
    ],
    sections: [
      {
        heading: "Solution usually means someone else will run it",
        paragraphs: [
          "Vendors and agencies use 'email marketing solutions' when they are not selling a raw login. The bundle is software seats plus people who build campaigns, plus maybe deliverability, creative, and a promise about revenue. That can be a fair buy if you have a list and no staff. It can also be a way to hide a reseller margin and a lock-in clause in the same PDF. Ask whether the seat is [HubSpot](https://www.hubspot.com), [Mailchimp](https://mailchimp.com), or a private label you cannot keep if you fire the agency.",
          "Read the bundle as two contracts even if it is one signature: a product (ESP or suite) and a service (strategy, production, sending). If either side is unnamed ('our proprietary platform'), you cannot price the pieces or take the list elsewhere.",
        ],
      },
      {
        heading: "Who owns the audience",
        paragraphs: [
          "Put account ownership in the statement of work. The login should be under your domain and your credit card, with the agency as a user. Unsubscribes, bounce logs, and templates should export to you on request, not at the end of a 'transition fee.' If the list lives in the agency's parent account, you are renting your own customers.",
          "Ask where mail sends from. Some 'solutions' put every client on one shared domain or IP. A neighbor's sweepstakes then becomes your placement problem. You want a domain you control, authenticated to a sender you can keep if you fire the agency.",
        ],
      },
      {
        heading: "What the monthly fee is actually for",
        paragraphs: [
          "Production (N campaigns, N flows), reporting, and a meeting. Get those numbers in writing. 'Unlimited emails' often means unlimited small edits until you ask for a new automation, which is a change order. Creative round limits matter. So does whether they write from your facts or from stock claims.",
          "Deliverability retainers are justified when volume is high and someone is actually in Postmaster Tools. They are not justified as a line item that restates 'we will follow best practices.' If the solution includes ads, SMS, and a website, separate those in the budget. A bad website is not an email problem, and a bundled dashboard will pretend it is.",
        ],
      },
      {
        heading: "When a bundle is the honest choice",
        paragraphs: [
          "A store with a list, a peak season, and no marketer. A nonprofit that needs a newsletter and cannot hire. A company that already picked an ESP and wants a specialist to build the first flows, then leave. In that last case, buy a project with a handover, not a perpetual 'solution.'",
          "Walk away from guarantees about inbox placement or revenue that are not written as refunds you would actually collect. Walk away from vendors who will not name the ESP. You can hire an agency and buy software yourself. That unbundled version is often cheaper to leave.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is a franchise or local 'marketing solution' the same thing?",
        answer:
          "Often it is a salesperson with a white-label ESP. Demand a live send from a domain you own before you share the customer file. If they only show a PDF of other towns' results, you do not have proof.",
      },
      {
        question: "Can I keep the software if I drop the agency?",
        answer:
          "Only if the contract and the account say so. Ask that question in the first meeting. If the answer is a pause, assume no, and buy the software in your name from the start.",
      },
    ],
  },
  {
    slug: "email-marketing-system",
    title: "Email marketing system",
    description:
      "The operating system behind campaigns: consent, list, ESP, CRM, and analytics, and what fails when one piece is missing.",
    query: "email marketing system",
    kicker: "Operating system",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "email marketing system",
      "email operations",
      "list consent ESP CRM",
    ],
    sections: [
      {
        heading: "A system is the path a person takes through your tools",
        paragraphs: [
          "An email marketing system is not a logo. It is the chain: someone consents, the consent is stored, a sender is allowed to use it, the CRM (if you have one) does not fight that fact, and you can see whether the mail did anything. Campaigns are what you publish on top. When the chain is broken, campaigns still go out. They just go to the wrong people or to nobody who can still receive them. [Salesforce](https://www.salesforce.com) often holds the CRM box. The ESP is a separate box even when one vendor sells both.",
          "Draw it on a whiteboard with five boxes: capture, consent record, ESP, CRM, analytics. Draw the arrows for subscribe, unsubscribe, bounce, and purchase. If an arrow is 'someone downloads a CSV on Thursdays,' that is the system. It will fail on a holiday.",
        ],
      },
      {
        heading: "List and consent",
        paragraphs: [
          "The list is every address you might send to, plus the fields that justify the send. Consent is a timestamp, a source, and a scope (newsletter versus SMS versus partner mail). Without scope, a checkout address becomes a weekly blast. Store consent in a place that both marketing and sales can see. A note in a Slack thread is not a record.",
          "Hygiene sits here too: hard bounces leave, role accounts (info@) get treated with care, and people who complain are suppressed everywhere, not only in the campaign they replied to. A system that only unsubscribes inside one ESP while the CRM keeps 'subscribed = true' will re-permission people by accident.",
        ],
      },
      {
        heading: "ESP and CRM",
        paragraphs: [
          "The ESP sends and holds templates, throttling, and mailbox-facing headers. The CRM holds ownership, deals, and the human follow-up. They should share an ID. They should share suppression. They should not both believe they are the only place a marketer may send from. Pick a system of record for marketing permission. The other tool reads it.",
          "If you have no CRM, the ESP is the record. That is fine for a publisher. It is cramped for a sales team. If you have no ESP, the CRM send button is a mailbox. That is fine for ten personal notes. It is not a system for a newsletter. Name which case you are in so you stop buying software for the other case.",
        ],
      },
      {
        heading: "Analytics and the loop",
        paragraphs: [
          "Analytics is tagged links, revenue or leads that can be tied to a send, and provider signals (complaints, Postmaster). The loop is using those to change the next audience or the next offer, not to decorate a slide. If UTM tags are optional, the system has a hole. If nobody looks at complaints except when Gmail blocks you, the system has no immune system.",
          "People are part of the diagram. A system without an owner for DNS, an owner for the calendar, and an owner for replies will look complete in software and still stall. Assign names. Software does not attend the post-send hour.",
        ],
      },
      {
        heading: "Failure modes worth designing for",
        paragraphs: [
          "A form that writes to the ESP but not the CRM. A purchase that writes to the CRM but not the ESP, so buyers keep getting abandon mail. An agency user who exports the list. A domain renewal that drops SPF. A second 'backup' ESP that still has last year's audience. Each of these is cheaper to prevent with a checklist than to discover from customers.",
          "When you add a new tool, update the diagram first. If you cannot say where unsubscribe goes, do not connect the tool. That rule alone keeps most systems from rotting.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is a customer data platform required?",
        answer:
          "Not for a small program. A CDP helps when many sources must agree on one profile. It becomes another box that can desync consent if you are not careful. Fix ESP and CRM sync before you add a third brain.",
      },
      {
        question: "Where should the preference center live?",
        answer:
          "On a domain you control, fed by the system of record for permission, and honored by every sender. A preference center that only updates one ESP is decoration.",
      },
    ],
  },
  {
    slug: "best-email-marketing-platforms",
    title: "Best email marketing platforms",
    description:
      "Platforms as suites: CRM, content, ads, and email under one vendor. When that bundle wins, and when a specialist ESP still should.",
    query: "best email marketing platforms",
    kicker: "Suites",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: [
      "best email marketing platforms",
      "email marketing platform",
      "marketing suite vs ESP",
    ],
    sections: [
      {
        heading: "A platform is a suite, not a nicer word for software",
        paragraphs: [
          "People say 'platform' when they mean an all-in-one: contacts, maybe a CMS, ads, forms, reporting, and email in one contract. [HubSpot](https://www.hubspot.com) is the example many teams mean. Adobe and Salesforce sell heavier suites with email inside Marketing Cloud or Journey Optimizer. The pitch is one person record and one bill. The cost is that email is one module among many, and it may be weaker than a specialist sender at catalog events or inbox placement tooling.",
          "This page is that suite decision. It is not how to assemble a [stack of tools](/best-email-marketing-tools), and it is not how to purchase a standalone [ESP application](/best-email-marketing-software). If a roundup treats Mailchimp, Klaviyo, and HubSpot as the same kind of object, it is not helping you buy.",
        ],
      },
      {
        heading: "When a suite is the right object",
        paragraphs: [
          "Sales and marketing already fight over one contact file, and you would rather they share a record than sync two databases. You want forms, landing pages, and email to write the same properties. You do not have a store catalog that needs to appear in every mail. Your volume is moderate and your team is small enough that one login is an operational win.",
          "Suites also win when procurement wants one DPA and one SSO policy. Adding a second sender later is still possible, but you should admit you are leaving the 'all-in-one' story when you do it. A HubSpot company that also runs Klaviyo has a platform plus an ESP. That can be correct. It is no longer a platform strategy. It is a compromise with a store.",
        ],
      },
      {
        heading: "When the suite is the wrong object",
        paragraphs: [
          "You live on product events. You need a sender that thinks in SKUs, collections, and inventory. You need dedicated-IP programs, complicated multivariate send-time work, or a transactional stream with an SLA the suite treats as an add-on. You already have a CRM you will not rip out, and the 'platform' would duplicate it. In those cases a suite's email module is a convenience send for newsletters, not the system.",
          "Enterprise suites can also bury email behind professional services. If a 'platform' quote is mostly implementation hours, you are buying a project. Compare that honestly to an ESP a marketer can authenticate in an afternoon.",
        ],
      },
      {
        heading: "How to evaluate without a fake top 10",
        paragraphs: [
          "Map the objects you must share: person, company, deal, SKU, consent. If the suite's objects match, sit in a trial and send mail, not just build a dashboard. Check whether email uses the same subscription fields as the CRM. Check export. Check whether you can put marketing on a subdomain without moving the company's whole DNS personality into the vendor.",
          "Price the modules you will turn on in year one, not the slide of twenty products. Unused marketing automation is still a seat you will be asked to renew. The best platform is the one whose extra modules you will actually staff. The rest is shelfware with a nicer name than software.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is Mailchimp a platform or software?",
        answer:
          "Mailchimp started as email software and now sells a broader cloud. If you only use audiences and campaigns, treat it as software. If you moved your site, CRM, and ads into it, you are using it as a platform. Buy for the way you will log in on a Tuesday, not for the homepage headline.",
      },
      {
        question: "Can I run a specialist ESP next to a suite?",
        answer:
          "Yes, if consent and suppression sync both ways and the reasons are clear (usually ecommerce flows versus B2B newsletter). Two unrelated blasts from two suites is how people get mailed twice. Name the system of record before you connect the second sender.",
      },
    ],
  },
];
