import type { GuidePage } from "./types";

export const EMAIL_GUIDES_A: GuidePage[] = [
  {
    slug: "what-is-email-marketing",
    title: "What is email marketing?",
    description:
      "Permission, lists, and the split between campaigns and transactional mail. What counts as email marketing, and what sits in the email aisle instead.",
    query: "what is email marketing",
    kicker: "Email basics",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["what is email marketing", "permission based email", "campaign vs transactional email"],
    sections: [
      {
        heading: "Permission is the line",
        paragraphs: [
          "Email marketing is sending commercial messages to people who gave you a way to do that, on an address they control. The permission can be a checkbox on a form, a checkout opt-in, an event registration, or a clear existing business relationship under the law that applies to you. It is not a scraped spreadsheet. If you cannot explain how each address got on the list, you are not doing email marketing. You are doing unsolicited bulk mail, and inbox providers treat those as different jobs.",
          "In the United States, the [CAN-SPAM Act](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) still requires an honest from-line, a working unsubscribe, and a physical postal address on commercial mail. In the EU and UK, consent and legitimate-interest rules under GDPR are stricter about how you collect and store that permission. Neither statute is a growth hack. They are the floor.",
        ],
      },
      {
        heading: "A list is a record of consent, not a CSV",
        paragraphs: [
          "The list is the asset: email, source, date of opt-in, and usually a few fields that decide what you send (product, region, role). A healthy list is smaller than a purchased file and quieter than a webinar scrape. People leave. Hard bounces should come off the same day. Soft bounces get a short leash. Complaints (the spam button) are more expensive than unsubscribes, because mailbox providers watch complaint rate at the domain.",
          "Buying lists is still sold. It is also the fastest way to train Gmail and Microsoft to distrust the domain you just paid to set up. If a vendor's pitch is 'we have 40,000 CMOs,' ask how those people opted in to hear from you, not from the vendor.",
        ],
      },
      {
        heading: "Campaigns versus transactional mail",
        paragraphs: [
          "Campaign mail is the newsletter, the launch, the promo, the event invite. You chose the audience and the time. Transactional mail is the receipt, password reset, shipping notice, 'you were mentioned' alert. The person did something, and the message is expected. Mixing them in one stream is how a password reset ends up wearing a 20% off banner, or how a promo inherits the trust of a shipping email and then burns it.",
          "Most teams put campaigns in an ESP (Mailchimp, Klaviyo, HubSpot) and transactional mail in a specialist such as [Postmark](https://postmarkapp.com) or [Amazon SES](https://aws.amazon.com/ses/). That split is operational, not fashionable. Transactional mail has a higher expectation of arrival. Campaign mail has a higher expectation of being ignored. You do not want one reputation score covering both.",
        ],
      },
      {
        heading: "Warmup and domains live in the email aisle",
        paragraphs: [
          "New sending domains, dedicated IPs, SPF/DKIM/DMARC, and inbox warmup are email-aisle work. They exist because mailbox providers score the domain and the IP, not your brand deck. This is not LinkedIn account warmup. If a product talks about warming a profile, that is a different channel with different risk. For email, the work is DNS records, a gradual send ramp, and keeping complaint rates low. Skip it and even a permitted list will land in spam.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is a cold outbound sequence email marketing?",
        answer:
          "Sales teams call it outbound. Inbox providers still see bulk commercial mail. If the person never asked for it, you are outside the usual meaning of email marketing even when the copy is polite. Some jurisdictions allow B2B mail with an opt-out. That is a legal question for counsel, not a loophole in Gmail.",
      },
      {
        question: "Does a newsletter count if I never sell in it?",
        answer:
          "Yes. Editorial mail to opted-in readers is still email marketing. The offer can be attention, a habit, or a later product. The list and the permission are the same machinery.",
      },
    ],
  },
  {
    slug: "email-marketing-campaigns",
    title: "Email marketing campaigns",
    description:
      "The anatomy of a campaign: audience, offer, send window, and a test you will actually read. Goals first, creative second.",
    query: "email marketing campaigns",
    kicker: "Campaigns",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing campaigns", "email campaign anatomy", "email A/B testing"],
    sections: [
      {
        heading: "A campaign is a project with an end date",
        paragraphs: [
          "A campaign is one job: a launch, a renewal push, a webinar fill, a seasonal sale. It has a named audience, a single primary action, a send window, and a stop condition. A weekly newsletter is a program. A welcome series is a flow. Mixing those words in a planning doc is how a 'campaign' runs for eleven weeks with no owner.",
          "Write the job in one sentence before anyone opens a template. 'Get 200 trial starts from customers who used feature X but never invited a teammate' is a campaign. 'Engage the list' is a wish.",
        ],
      },
      {
        heading: "Anatomy that actually ships",
        paragraphs: [
          "Audience: a saved segment, not 'everyone who ever downloaded a PDF.' Offer: the thing they get if they click, which might be a demo, a SKU, or a PDF, but it is one thing. Creative: subject, preheader, from-name, body, and the one button. Tracking: UTM on links, a conversion event in analytics, and a suppression so buyers do not get the same pitch twice.",
          "The from-name is part of the creative. People open mail from a person they recognize more often than from 'Team Acme.' Reply-to should land in a mailbox someone reads. A campaign that cannot receive a reply is a broadcast with extra steps.",
        ],
        bullets: [
          "Subject and preheader as a pair, not two slogans",
          "One primary link; extra links compete",
          "A plain-text part for clients that strip HTML",
        ],
      },
      {
        heading: "Goals you can score without a dashboard novel",
        paragraphs: [
          "Open rate is a weak goal after Apple Mail Privacy Protection, because many opens are prefetch. Click-to-delivered and click-to-open still move. The goal that pays the bills is the downstream event: trial start, order, meeting booked, renewal started. If you cannot wire that event, you are decorating a send log.",
          "Unsubscribe rate and spam-complaint rate are guardrails, not KPIs to maximize. A campaign that 'wins' on clicks and spikes complaints lost. Mailbox providers keep that memory on the domain, which is email-aisle reputation, not a creative award.",
        ],
      },
      {
        heading: "Testing without theater",
        paragraphs: [
          "A useful test changes one thing: subject, from-name, or the first screen of the body. Two simultaneous changes teach you nothing. You need enough volume that a 10% relative lift is not noise. A 400-person list cannot support a four-variant multivariate test. Send the control, send one challenger, wait for the conversion window, then pick.",
          "Holdouts matter more than most A/B tools admit. If 10% of the segment never gets the campaign and still converts at the same rate, the email was not the cause. That is boring to report and worth more than a 'winner' badge in [Mailchimp](https://mailchimp.com) or [Klaviyo](https://www.klaviyo.com).",
        ],
      },
    ],
    faqItems: [
      {
        question: "How many emails is a campaign?",
        answer:
          "Often one send plus one reminder to non-openers or non-clickers, with a stop if they convert. A five-touch drip with no new information is a flow wearing a campaign name. If the later messages repeat the first, cut them.",
      },
      {
        question: "Should every campaign be automated?",
        answer:
          "No. Dated events (a launch Tuesday, a conference next week) are campaigns. Behavior that can fire at 2am on a Tuesday (cart abandon, trial-day-three) belongs in automation. Putting a launch in a forever-flow is how last year's headline keeps shipping.",
      },
    ],
  },
  {
    slug: "email-marketing-company",
    title: "What an email marketing company sells",
    description:
      "Software, agency hours, and lists all show up under 'email marketing company.' Those are different products. Here is how to tell them apart.",
    query: "email marketing company",
    kicker: "Vendors",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing company", "email marketing vendor", "ESP vs agency"],
    sections: [
      {
        heading: "The search results mix three businesses",
        paragraphs: [
          "Type 'email marketing company' and you get ESPs, agencies, and data brokers. An ESP sells you software to send and store the list. An agency sells people who write, design, and report. A data company sells addresses, intent files, or enrichment. Paying one does not replace the other two. A lot of bad RFPs assume it does.",
          "Ask what the invoice is for: seats and contacts, retainers and production hours, or records. If the answer is 'all of it, bundled,' get the line items anyway. Bundles hide which part you could buy cheaper alone.",
        ],
      },
      {
        heading: "Software companies",
        paragraphs: [
          "These are the brands people mean when they say 'we use Mailchimp' or 'we live in HubSpot.' [Mailchimp](https://mailchimp.com), [Klaviyo](https://www.klaviyo.com), [HubSpot](https://www.hubspot.com), [ActiveCampaign](https://www.activecampaign.com), [Brevo](https://www.brevo.com): they host templates, segments, and the send pipe. You still need a list, a point of view, and someone who hits send. The company is not your marketing department unless you also bought services, which some of them resell.",
          "Read the data-processing agreement. The software company is a processor of your list. If they go down, or you leave, you need an export. That is a company-selection criterion, not an IT afterthought.",
        ],
      },
      {
        heading: "Agencies and production shops",
        paragraphs: [
          "These firms sell campaigns, retainers, and sometimes 'we'll run Klaviyo for you.' The deliverable is work, not a login. A good one will tell you which ESP they prefer and why. A weak one will insist you move platforms because their templates live there. The list should stay in an account you admin. If the agency is the only admin, you hired a hostage situation.",
        ],
      },
      {
        heading: "List and data shops",
        paragraphs: [
          "They sell contacts, technographics, or 'verified emails.' Some of that is enrichment on people who already know you. Some of it is cold files. The second kind is not email marketing in the permission sense. It is outbound list supply. Treat it as a different aisle, closer to a sales-intel vendor than to an ESP.",
          "If the company's case study is 'we added 12,000 emails last quarter' and never mentions opt-in source, walk. Volume without provenance is how domains get burned. Domain and IP warmup after a bad file is still email-aisle repair, not a creative problem.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Can one company be all three?",
        answer:
          "Some agencies resell an ESP and a data tool. You can still insist on separate contracts and on owning the ESP account. When the relationship ends, you want the list and the templates, not a PDF of last month's opens.",
      },
      {
        question: "Is a 'full-service email marketing company' better?",
        answer:
          "Full-service means they will take more of the work. It does not mean they are better at deliverability, design, or copy. Ask for a named strategist, a named ESP admin, and a sample of emails they shipped for a business that looks like yours, not a mood board.",
      },
    ],
  },
  {
    slug: "free-email-marketing",
    title: "Free email marketing: what the tier actually includes",
    description:
      "Free plans exist. They cap contacts, monthly sends, and branding. When they work, when they stall, and an honest look at Mailchimp's free tier.",
    query: "free email marketing",
    kicker: "Free plans",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["free email marketing", "Mailchimp free plan", "free ESP limits"],
    sections: [
      {
        heading: "Free means capped, not unlimited",
        paragraphs: [
          "Almost every consumer ESP offers a free tier because it is a trial with a public price of zero. Typical limits: a contact cap, a monthly send cap, a Mailchimp-style branded footer, fewer automations, no A/B tests, and weaker support. The numbers move every year, so treat any screenshot of '2,000 contacts' as historical. Open the current plan page before you promise a client the tier still exists.",
          "Free is enough for a new newsletter, a local shop, or a founder who sends one note a month to people who already bought. It is not enough for a store with a real abandon flow, a B2B team with lifecycle branching, or anyone who cannot live with the vendor's logo on the footer.",
        ],
      },
      {
        heading: "Mailchimp, without the myth",
        paragraphs: [
          "[Mailchimp](https://mailchimp.com) is still the name people type when they want free email marketing. Intuit owns it. The free plan has historically limited contacts and sends, shown Mailchimp branding, and held back some automation and comparison tools for paid tiers. That mix is why it became the default classroom ESP: you can learn the object model (audience, campaign, tag) without a card. It is also why ecommerce teams outgrow it. [Klaviyo](https://www.klaviyo.com) prices on profiles and is built around store events. Mailchimp can connect a store. Klaviyo assumes the store is the center.",
          "Mailchimp is not 'the professional choice' or 'only for amateurs.' It is a general-purpose ESP with a famous free door. If your list is a newsletter and a few tags, it is a reasonable place to stay. If your revenue depends on browse-abandon and post-purchase flows, you will feel the ceiling. Confirm limits on their site. They change.",
        ],
      },
      {
        heading: "When you outgrow free",
        paragraphs: [
          "You outgrow it when the contact cap is the planning constraint, when you need customer-data events (placed order, viewed SKU) as triggers, when you want a dedicated sending domain without fighting the UI, or when the branded footer is embarrassing in a sales cycle. You also outgrow it when support tickets wait because free users are last.",
          "Other free-ish doors exist: [Brevo](https://www.brevo.com) (daily send caps are a different shape of limit), [Kit](https://kit.com) for creator audiences, [Google](https://workspace.google.com) groups for tiny internal lists that are not really marketing. None of these replace DNS authentication. SPF, DKIM, and a custom domain are email-aisle setup even on a free plan. Warmup still applies if you suddenly send to thousands of cold-ish addresses you imported. Free software does not grant inbox placement.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is free email marketing safe for a real business?",
        answer:
          "Safe enough if the list opted in and you authenticate the domain. The risk is operational: hitting a cap mid-launch, or looking unpaid because of vendor branding. It is not inherently spammy. Behavior and list quality decide that.",
      },
      {
        question: "Should I start on free and migrate later?",
        answer:
          "Yes if you want to learn. Export the audience, tags, and unsubscribes before you switch. Migrations fail when the old account is the only copy of suppression. Budget a week of broken automations. There is no painless ESP move.",
      },
    ],
  },
  {
    slug: "digital-marketing",
    title: "Digital marketing, with email in its place",
    description:
      "Paid, owned, and earned media. Email is one owned channel. Search, social, and sites do different jobs. Do not flatten them into one stack.",
    query: "digital marketing",
    kicker: "Channels",
    cluster: "general",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["digital marketing", "paid owned earned", "email as owned media"],
    sections: [
      {
        heading: "Paid, owned, earned",
        paragraphs: [
          "Digital marketing is the work of getting a product noticed and bought using internet channels. The old media split still helps. Paid is what you rent: [Google Ads](https://ads.google.com), [Meta ads](https://www.facebook.com/business/tools/ads-manager), sponsored newsletters, paid social. Owned is what you control: the site, the app, the email list, the SMS list. Earned is what other people distribute: press, reviews, organic search, shares, comments.",
          "Teams collapse those into 'digital' and then wonder why the budget meeting is a knife fight. Paid stops when the card stops. Owned compounds if you treat the list as a relationship. Earned is slow and not scheduled. A plan that only buys traffic has no owned asset when CPMs jump.",
        ],
      },
      {
        heading: "Email is owned, not the whole plan",
        paragraphs: [
          "Email sits in owned. You already paid (in product, content, or ads) to get the address. The send is cheap compared with another click. That is why finance likes it and why it gets overloaded: 'just email the list' becomes the answer to a weak offer. The list cannot invent demand that search and sales conversations did not create.",
          "Use email to talk to people who already raised a hand. Use paid to find new ones. Use the site and SEO so both have somewhere to land. [LinkedIn](https://www.linkedin.com) organic posts are closer to earned-plus-owned for B2B: you do not pay per impression the same way, but the network still decides distribution. Mixing LinkedIn warmup with email domain warmup is a category error. Domain warmup is email-aisle DNS and reputation. Profile warmup is a social-network behavior problem.",
        ],
      },
      {
        heading: "How the channels borrow from each other",
        paragraphs: [
          "A paid click that does not capture an email is a rental with no leftover. A content piece with no next email is a one-night visit. A social following you cannot message is a billboard you do not own. The boring architecture is: paid and earned feed a form, the form feeds the list, the list feeds returning visits and revenue.",
          "Measurement fights start here. Last-click attribution gives email too much credit if the person Googled you yesterday. First-click gives paid too much if the email closed it. Pick a model, write it down, and stop re-litigating every campaign. Digital marketing is not a single KPI. It is a set of channels with different half-lives.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is SEO digital marketing?",
        answer:
          "Yes. Organic search is earned (and a bit owned, because you control the pages). It is not email. People who rank and never collect addresses still have a digital program. They just do not have a cheap second touch.",
      },
      {
        question: "Where does SMS fit?",
        answer:
          "Owned, like email, with tighter consent rules and a higher annoyance cost. Use it for time-sensitive messages, not as a second copy of the newsletter. Many ESPs now sell both. That does not mean every email should become a text.",
      },
    ],
  },
  {
    slug: "email-marketing-services",
    title: "Email marketing services versus a platform login",
    description:
      "Done-for-you retainers, setup projects, and self-serve ESPs. What you buy, what you still own, and how the scopes differ.",
    query: "email marketing services",
    kicker: "Services",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing services", "done for you email", "email marketing retainer"],
    sections: [
      {
        heading: "A service is labor. A platform is software.",
        paragraphs: [
          "Email marketing services means someone else writes, designs, builds automations, or runs QA in your ESP. You pay hours or a retainer. A platform login means you (or an intern) do that work inside [Klaviyo](https://www.klaviyo.com), [Mailchimp](https://mailchimp.com), or [HubSpot](https://www.hubspot.com). Agencies blur the line by 'including' the tool. You should still know which invoice is software and which is people.",
          "Done-for-you is attractive when no one on staff has shipped a welcome flow. It is expensive when the service is really a junior sitting in your account renaming templates. Ask who does the work, how many hours a month, and what happens in week three when you want a last-minute launch.",
        ],
      },
      {
        heading: "Typical scopes",
        paragraphs: [
          "Setup projects: migrate the list, authenticate the domain (email aisle: SPF, DKIM, DMARC, maybe a dedicated IP), rebuild three flows, train your marketer. Then they leave. Retainers: a monthly campaign calendar, reporting, and a fixed number of new templates. Deliverability retainers: inbox placement tests, list hygiene, feedback-loop monitoring. That last one is email-aisle operations. It is not the same as a copywriter.",
          "If the proposal says 'full-service email' and the sample calendar is four newsletters and no lifecycle map, you bought a production studio, not a program. That can be fine. Name it.",
        ],
        bullets: [
          "Setup: one-time build, you run it after",
          "Retainer: ongoing production and reporting",
          "Deliverability: reputation, DNS, complaint handling",
        ],
      },
      {
        heading: "What you should refuse to outsource as ownership",
        paragraphs: [
          "The ESP account, the DNS records, the unsubscribe and suppression lists, and the brand voice decisions. A vendor can operate them. They should not be the only person who can log in. When a services firm holds the sending domain in their agency account, switching vendors means rebuilding reputation from zero. Domain reputation is not portable like a Figma file.",
          "Keep approvals. If they can send to the whole list without a human at your company seeing the proof, you will eventually send something legal would have stopped. Services scale production. They do not remove liability.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is done-for-you cheaper than hiring?",
        answer:
          "For a few campaigns a month, often yes. For a daily lifecycle program in a large catalog, a specialist employee plus a freelancer designer is usually cheaper than an agency blended rate. Run the hours, not the slogan.",
      },
      {
        question: "Do services include the ESP fee?",
        answer:
          "Sometimes they resell. Sometimes you pay Klaviyo or HubSpot directly. Direct is cleaner for data processing and for leaving. Resale can be fine if you still own admin. Read the statement of work.",
      },
    ],
  },
  {
    slug: "email-marketing-cost",
    title: "What email marketing actually costs",
    description:
      "Software, design, the list, and send volume. Typical ranges, not fake price tags. Domain warmup sits in the email aisle.",
    query: "email marketing cost",
    kicker: "Cost",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing cost", "ESP pricing", "email marketing budget"],
    sections: [
      {
        heading: "Four lines on the budget, not one",
        paragraphs: [
          "People search 'email marketing cost' hoping for a number. There is no one number. You pay for software (the ESP), production (design and copy), the list (how you got the addresses), and volume-related sending (overages, extra IPs, warmup tools). A newsletter to 800 readers and a retailer sending millions of lifecycle messages are not the same product.",
          "Treat published 'average ROI' charts as marketing, including the famous ones from vendors. Your cost is the four lines. Your return is revenue or pipeline you can actually attribute. If you cannot connect those, you do not have an email ROI figure. You have a vibe.",
        ],
      },
      {
        heading: "Software",
        paragraphs: [
          "SMB ESPs often start at $0 on a free cap, then tens to a few hundred dollars a month as contacts grow. Mid-market ecommerce tools such as [Klaviyo](https://www.klaviyo.com) typically price on active profiles; teams commonly land in the low hundreds to low thousands per month, then more. B2B suites such as [HubSpot](https://www.hubspot.com) Marketing Hub are often thousands per year once you leave the free CRM, because you are buying a hub, not a stamp. Transactional APIs ([SendGrid](https://sendgrid.com), [Amazon SES](https://aws.amazon.com/ses/)) can be fractions of a cent per message at volume, plus engineering time.",
          "Those are typical shapes, not quotes. Vendors change tiers. Always open the current pricing page. Seat fees, SMS add-ons, and 'premium support' move the real bill more than the landing-page number.",
        ],
      },
      {
        heading: "Design, copy, and the list",
        paragraphs: [
          "A freelancer template might be a few hundred dollars. A designed campaign with modules and dark-mode QA can be four figures. An in-house designer amortized across many sends is cheaper per email and slower to start. Copy is either staff time or a specialist. None of these are ESP line items, and agencies bundle them so you forget.",
          "The list is the expensive part people undercount. Paid acquisition (ads to a lead magnet) can be several dollars per email. Product-led capture (checkout opt-in) is cheaper per address and higher quality. Buying a file is 'cheap' until the domain is poisoned. Do not put purchased-list cost in the same cell as an ESP subscription. One is media. One is software.",
        ],
      },
      {
        heading: "Volume, domains, and warmup are email-aisle costs",
        paragraphs: [
          "High volume means extra sending domains, maybe a dedicated IP, a warmup schedule, and tools that watch inbox placement. That is the email aisle: DNS, mailbox reputation, complaint loops. It is not a LinkedIn seat. Budget a custom domain (cheap), a mailbox for reply-to, and time to ramp. Dedicated IPs only make sense at sustained high volume. Below that, shared IPs at a reputable ESP are normal.",
          "A rough planning picture for a small company: software in the two- to three-figure monthly range, a designer on a few campaigns per quarter, and almost no extra send tax. A rough picture for a catalog retailer: software in four figures monthly, a lifecycle marketer's salary, and a deliverability consultant if things break. Your numbers will not match a blog table. That is expected.",
        ],
      },
    ],
    faqItems: [
      {
        question: "What does a small business usually pay?",
        answer:
          "Often a free or cheap ESP plus a few hours a month of someone's time. The surprise bill is ads used to grow the list, not the send fee. If you are paying an agency $3,000 a month to send one newsletter, you are buying process and meetings, not stamps.",
      },
      {
        question: "Are 'pennies per email' quotes real?",
        answer:
          "The ESP's send cost can be that low. Production, list growth, and wasted sends to bad addresses are not. Per-email math without those is a vendor slide.",
      },
    ],
  },
  {
    slug: "email-marketing-software",
    title: "Email marketing software, by ESP category",
    description:
      "ESPs are not one product. Newsletter tools, commerce engines, B2B hubs, and transactional APIs solve different jobs.",
    query: "email marketing software",
    kicker: "ESPs",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing software", "ESP categories", "email service provider types"],
    sections: [
      {
        heading: "An ESP is the pipe and the database",
        paragraphs: [
          "Email marketing software usually means an email service provider: it stores subscribers, builds campaigns, tracks clicks, and talks SMTP to Gmail and Microsoft. It is not Photoshop. It is not your CRM, unless you bought a suite that swallowed both. If you pick software by logo familiarity, you will use a newsletter tool as a commerce engine and then blame 'email.'",
          "Authentication (SPF, DKIM, DMARC) still sits in DNS. The ESP gives you records to paste. That setup is email-aisle work. The software will not magically warm a brand-new domain you blast on day one.",
        ],
      },
      {
        heading: "Newsletter and SMB tools",
        paragraphs: [
          "[Mailchimp](https://mailchimp.com), [Constant Contact](https://www.constantcontact.com), [Brevo](https://www.brevo.com), [Kit](https://kit.com): audiences, campaigns, simple automations, forms. Fine for publishers, local services, and simple catalogs. Weak when you need SKU-level browse events or a sales-team CRM as the source of truth. Their editors are the product. That is a compliment if you send campaigns. It is a limit if engineers need an API-first transactional stream.",
        ],
      },
      {
        heading: "Commerce ESPs",
        paragraphs: [
          "[Klaviyo](https://www.klaviyo.com) is the example most store teams name. The center is the profile plus events from Shopify or similar: placed order, viewed product, started checkout. Flows fire on those events. If you do not have a store feed, you are paying for a machine you are not feeding. Other commerce-leaning tools exist. The category test is: can a 'viewed these three SKUs, did not buy' segment be built without a spreadsheet?",
        ],
      },
      {
        heading: "B2B hubs and transactional specialists",
        paragraphs: [
          "[HubSpot](https://www.hubspot.com), Adobe Marketo, Salesforce Account Engagement: email is one object next to forms, landing pages, and a CRM. You buy them when sales and marketing share a contact database and a lead status. You overbuy them when you needed a newsletter. [ActiveCampaign](https://www.activecampaign.com) sits between SMB automation and that hub world.",
          "Transactional software ([SendGrid](https://sendgrid.com), [Postmark](https://postmarkapp.com), [Amazon SES](https://aws.amazon.com/ses/), Mailgun) is for receipts and product mail. High deliverability expectations, API sending, less of a campaign calendar. Using SendGrid as your only newsletter tool is possible and usually miserable. Using Mailchimp as your only password-reset pipe is how resets land in promotions.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is Gmail email marketing software?",
        answer:
          "No. Gmail is a mailbox. BCC'ing 40 customers from your inbox is not an ESP. You get no list hygiene, no unsub header that scales, and a fast path to looking like a spammer. Use an ESP once you leave personal correspondence.",
      },
      {
        question: "Can one ESP cover campaigns and transactional?",
        answer:
          "Some vendors sell both. Many teams still split them so a promo cannot tank receipt delivery. If you combine them, use separate subdomains (mail. vs send.) so reputation is isolated. That is email-aisle architecture.",
      },
    ],
  },
  {
    slug: "email-marketing-tools",
    title: "Email marketing tools around the ESP",
    description:
      "Point tools for design, inbox testing, and analytics. They sit next to the ESP. They are not a second Mailchimp.",
    query: "email marketing tools",
    kicker: "Point tools",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing tools", "email design tools", "email deliverability tools"],
    sections: [
      {
        heading: "The ESP is not the whole kit",
        paragraphs: [
          "When people say email marketing tools, they often mean the satellite apps: template builders, seed-list testers, dark-mode previews, heatmaps, and preference-center widgets. The ESP still sends. These tools make the send less ugly or more measurable. Buying five of them will not replace a bad list.",
          "Shortlist by job. If the job is 'make a module that works in Outlook,' you want a design tool. If the job is 'why are we in spam at Microsoft,' you want placement testing and Google Postmaster, not a new drag-and-drop editor.",
        ],
      },
      {
        heading: "Design",
        paragraphs: [
          "[Beefree](https://beefree.io) and [Stripo](https://stripo.email) export HTML that you paste into an ESP. Figma is not an email tool; someone still has to rebuild the layout in tables. Litmus Builder and similar sit closer to QA. Native ESP editors are enough until you have a design system with many modules. Then a dedicated builder earns its seat because the ESP editor will fight you on reusable components.",
        ],
      },
      {
        heading: "Deliverability and reputation (email aisle)",
        paragraphs: [
          "[Google Postmaster Tools](https://postmaster.google.com) shows domain reputation, spam rate, and authentication for Gmail. Microsoft has its own sender portals. Seed-list products (GlockApps and peers) send to a panel of inboxes and tell you inbox versus spam versus missing. That whole category is email-aisle instrumentation. It is not LinkedIn safety software and it will not warm a social profile.",
          "Warmup tools that slowly send and reply between aged mailboxes are also email aisle. They try to build domain and mailbox reputation. They cannot launder a purchased list. If your complaint rate is high, pause. Do not 'warmup harder.'",
        ],
      },
      {
        heading: "Analytics and QA",
        paragraphs: [
          "[Litmus](https://www.litmus.com) and Email on Acid render the email in dozens of clients. That is QA, not marketing analytics. Click maps inside the ESP show where people tap. Downstream revenue still lives in the store or the CRM. If your 'email tool' cannot accept a conversion pixel or an event, you are stuck reporting opens.",
          "UTM hygiene is a tool in the sense of a convention: campaign, source, medium, content. Spreadsheets still win for a content calendar. Fancy BI on email is optional until you have volume. A 3,000-person list does not need a CDW to know the Tuesday send worked.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Do I need Litmus if I use Klaviyo's preview?",
        answer:
          "ESP previews catch the obvious. They miss Outlook desktop oddities, dark-mode inversion, and image-blocked states. If those clients matter to your audience, add a renderer. If you email consumers on phones, preview on a real iPhone once a month. That beats another SaaS logo.",
      },
      {
        question: "Are Chrome extensions email marketing tools?",
        answer:
          "Scrapers and 'find email' extensions are prospecting, not email marketing tools. They create addresses without permission. Putting those into an ESP is how you meet the spam folder. Keep prospecting data out of the marketing audience until there is a lawful basis and a real opt-in story.",
      },
    ],
  },
  {
    slug: "video-email-marketing",
    title: "Video in email: GIF, thumbnail, and what clients actually play",
    description:
      "Most inbox clients will not play a real video file. Thumbnails, GIFs, and a click-out to YouTube or a landing page. Accessibility still applies.",
    query: "video email marketing",
    kicker: "Video",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["video email marketing", "GIF in email", "video thumbnail email"],
    sections: [
      {
        heading: "True video in the inbox is still rare",
        paragraphs: [
          "HTML email is a hostile document. Outlook desktop has historically used Word's engine. Gmail clips and strips. Apple Mail is more capable and still not a browser. Autoplaying an MP4 inside a campaign is not a reliable pattern. AMP for Email can do more in a few clients, with setup cost and a small supported set. If your brief is 'the video plays in the email like YouTube,' rewrite the brief.",
          "What works: a poster image with a play-button graphic, linking to [YouTube](https://www.youtube.com), Vimeo, or your site. Animated GIF (short, small file) for motion in-client. A static image for everyone else. That is video email marketing in practice, not a special MIME type that all inboxes honor.",
        ],
      },
      {
        heading: "GIF versus thumbnail",
        paragraphs: [
          "A GIF can show a product spin or a face talking for a second. Keep it under a couple of megabytes or Gmail will stall the load. Looping sales GIFs get old in one send. A thumbnail with a play icon sets the expectation that the click leaves the inbox, which is honest. Click-through on video modules is often higher than a text button because people recognize the pattern. That is not the same as 'they watched 90 seconds.' Measure play on the destination, not the email click alone.",
          "Some ESPs offer a hosted 'video card' that still falls back to an image. Read the fallback. If the fallback is a broken gray box in Outlook, you shipped a defect.",
        ],
      },
      {
        heading: "When the extra production is worth it",
        paragraphs: [
          "Product demos, founder updates, and unboxings can earn the click if the first frame is a real sentence ('three clicks to export a CSV') rather than stock footage of a laptop. B2B buyers will watch a two-minute clip they chose. They will not sit through a 12-minute webinar recording embedded as a 'video email.' Ecommerce can use short clips of the product in use. The email still has to work with images off, because many clients block images until the user allows them. Alt text on the poster image is the backup copy.",
          "Do not auto-add sound. There is no sound in a GIF, and there should be no surprise audio on the landing page without a user gesture. Captions on the destination video are the accessibility requirement people skip. Skip them and you lose viewers who cannot hear, plus anyone on a train.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Does Apple Mail play HTML5 video?",
        answer:
          "Some versions can display a video tag. Plenty of your list is not on that client. Design for the image fallback first. Treat native video as a progressive enhancement for a minority, not the campaign.",
      },
      {
        question: "Is a GIF 'video marketing'?",
        answer:
          "It is motion in email. Count it as a creative treatment, not a video program. If the goal is watch time, the email is an ad for the video, and the video lives on a page you control.",
      },
    ],
  },
  {
    slug: "email-marketing-agency",
    title: "Email marketing agencies: retainers and who owns the list",
    description:
      "What a retainer buys, who should admin the ESP, and the contract clauses that matter when you leave.",
    query: "email marketing agency",
    kicker: "Agencies",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing agency", "email retainer", "who owns the email list"],
    sections: [
      {
        heading: "A retainer is a capacity contract",
        paragraphs: [
          "An email marketing agency typically sells a monthly block: strategy call, campaigns, flow edits, reporting. The useful retainers name the outputs (two campaigns, one flow experiment, a QA pass) and the people (senior strategist versus production only). The useless ones sell 'always-on email' with no inventory of what ships.",
          "Rates vary by city and seniority. A specialist boutique can cost as much as a mid-size digital shop's junior pod. Price is not quality. Ask for live ESP access in a walkthrough of an account they still run, with client permission. If they can only show PDFs, you are buying slides.",
        ],
      },
      {
        heading: "Who owns the list",
        paragraphs: [
          "You do. Put that in the statement of work. The agency operates the audience. The company that collected the consent owns the records, the unsubscribes, and the suppression. Admin users should include at least two people at your company. Export rights should be explicit: CSV of subscribers, unsubscribes, and campaign HTML.",
          "If the list lives in the agency's master [Mailchimp](https://mailchimp.com) or [Klaviyo](https://www.klaviyo.com) account, you are renting your own customers. Migrating out then means a new sending domain or a painful merge, plus email-aisle reputation that stayed with their domain. Do not allow that structure. Your domain, your ESP subaccount or account.",
        ],
      },
      {
        heading: "How this differs from a 'company' or 'services' search",
        paragraphs: [
          "Agencies are a subset of services: a firm whose identity is the practice, usually with a roster of clients. An ESP's professional-services arm is still the software vendor. A freelancer is one person and no bench. Hire an agency when you need coverage (someone is out) and a process. Hire a freelancer when you need one excellent operator. Hire nobody extra when the bottleneck is the offer, not production.",
          "Creative-only email shops will make beautiful modules that never map to segments. Lifecycle shops will make flows that look like plumbing. You probably need a bit of both. One contract can cover it if they staff both. Many cannot.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Should the agency's name be in the from-line?",
        answer:
          "No. The from-name is your brand or a person at your company. Reply-to should be a mailbox you read. Agencies that send as themselves train the list to ignore you when they leave.",
      },
      {
        question: "How long before an agency should show results?",
        answer:
          "Flows can move revenue in weeks if the store already has traffic. A cold list and a new domain need a slower ramp (email aisle) before you judge copy. Give a new domain a warmup plan, not a week-one blast to 80,000 addresses.",
      },
    ],
  },
  {
    slug: "email-marketing-automation",
    title: "Email marketing automation: flows versus blasts",
    description:
      "Welcome, abandon, and nurture fire on behavior. Campaigns fire on a calendar. Mixing them is how last year's launch keeps sending.",
    query: "email marketing automation",
    kicker: "Flows",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing automation", "email flows", "welcome series abandon cart"],
    sections: [
      {
        heading: "A blast has a clock. A flow has a trigger.",
        paragraphs: [
          "Automation is mail that starts because something happened: a signup, a checkout started, a trial hit day three, a user went quiet. The person enters a flowchart. Campaigns (blasts) go out because it is Tuesday or because you launched. Both belong in an ESP. They need different owners. If the same 'newsletter' template is your abandon mail, you will sound like a newspaper in a moment that needed a receipt-like tone.",
          "Build fewer flows than the vendor's template gallery. Each flow is a product you maintain. A dead branch with a 2024 coupon is worse than no flow.",
        ],
      },
      {
        heading: "Welcome",
        paragraphs: [
          "The welcome series is the one automation worth doing first. Person just gave you an address. Tell them what they signed up for, what you will send, how often, and how to pick preferences. Then one useful thing: a setup guide, a bestseller, a relevant article. Three emails over a week is a common shape, not a law. Stop the series if they buy or book, unless the later emails are onboarding they still need.",
          "Welcome is also where you confirm permission if your law or your ESP requires a double opt-in. That extra click costs list size and saves you from typo-traps and hostile signups.",
        ],
      },
      {
        heading: "Abandon and browse",
        paragraphs: [
          "Cart and browse abandon are commerce flows. They need product events from the store. [Klaviyo](https://www.klaviyo.com) is built around that. A B2B 'abandon' might be a pricing-page visit or a demo form started. Timing: minutes to a few hours for cart, not three days later with a fake 'you forgot' if they completed on another device. Exclude purchasers. Exclude people who got the same SKU pitch twice this week.",
          "These flows print money when the site already has add-to-carts. They cannot invent carts. If traffic is thin, fix acquisition before you hire an automation consultant.",
        ],
      },
      {
        heading: "Nurture and sales sequences",
        paragraphs: [
          "Nurture is the slow drip for people who are not ready: education, customer stories, product updates. Sales sequences (SDR-style) are a different object: they often live in a sequencer and target cold or outbound lists. Putting cold names into a marketing nurture because the automation tool can is how you contaminate the marketing domain. Keep outbound on its own subdomain if you must send it at all. That split is email-aisle reputation design.",
          "[HubSpot](https://www.hubspot.com) workflows and customer-studio style builders can mix lifecycle and sales. The tool will let you do something unwise. The diagram should still have an exit on reply, bounce, or unsubscribe.",
        ],
      },
    ],
    faqItems: [
      {
        question: "How many automations should a small list have?",
        answer:
          "Welcome, unsubscribe confirmation (or preference center), and maybe one revenue flow (abandon or trial nurture). Add more when you can name the trigger and the stop. A gallery of 12 unused recipes is clutter.",
      },
      {
        question: "Is a weekly newsletter automation?",
        answer:
          "Not really. It is a recurring campaign. Some ESPs schedule it as a repeating send. Save 'automation' for triggered journeys so your team does not mean two things in one meeting.",
      },
    ],
  },
  {
    slug: "email-marketing-platform",
    title: "Email marketing platforms: all-in-one versus ESP plus CRM",
    description:
      "A platform is the architecture choice. One vendor for CRM and mail, or a specialist ESP next to Salesforce. Switching costs are the real tax.",
    query: "email marketing platform",
    kicker: "Platforms",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing platform", "ESP vs CRM", "all-in-one email platform"],
    sections: [
      {
        heading: "Platform means the system of record",
        paragraphs: [
          "An email marketing platform, in buyer-speak, is either an all-in-one (CRM + forms + email + landing pages) or a best-of-breed ESP that syncs to a CRM. The fork is where the person record lives. If sales lives in [Salesforce](https://www.salesforce.com) and marketing lives in a disconnected Mailchimp audience, you will argue about whose email is current until someone writes a sync that silently overwrites opt-outs.",
          "All-in-one reduces sync bugs and increases vendor lock-in. ESP plus CRM is more work and lets you pick a commerce ESP with a sales CRM that sales already likes. Neither is morally better. The wrong one is the one that makes unsubscribe state disagree.",
        ],
      },
      {
        heading: "All-in-one hubs",
        paragraphs: [
          "[HubSpot](https://www.hubspot.com) is the example people mean. Marketing Hub email, CRM, and (if you pay for them) sales and service sit on one contact. Adobe Marketo plus Experience Cloud is the heavier enterprise version of the same idea. You buy these when marketing operations wants one object model. You pay for modules you might not use. Email is not always the best editor in the building. It is the email that can see lead status without a nightly CSV.",
        ],
      },
      {
        heading: "ESP plus CRM",
        paragraphs: [
          "[Klaviyo](https://www.klaviyo.com) plus a store plus a light CRM. [Customer.io](https://customer.io) plus your product database. [Mailchimp](https://mailchimp.com) plus whatever sales uses. This wins when the event stream (orders, product usage) is richer in the ESP than in the CRM. Sales still needs a place to log calls. The integration must pass opt-in and opt-out both ways. One-way sync is how you email someone who told sales to stop.",
        ],
      },
      {
        heading: "Switching is the tax you forget",
        paragraphs: [
          "Platforms win RFPs on day one and lose years later when you cannot export journeys as living objects. You can export people. You cannot export a working 14-step flow with all the wait conditions. Budget a rebuild. Also budget email-aisle work: a new subdomain, warmup, and a period of split sending so the old domain does not die overnight.",
          "If you are choosing now, prefer the platform that matches the center of gravity. Store at the center: commerce ESP. Sales team at the center: CRM hub. Newsletter at the center: cheap ESP. A 'platform' that does all three poorly is how you get three tools anyway.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is an ESP a platform?",
        answer:
          "Vendors will say yes. In this article, platform means the architecture you commit to, including CRM. An ESP can be that if it holds the person record. If it is just a send tool, it is software, not the platform.",
      },
      {
        question: "Should startups start all-in-one?",
        answer:
          "A free CRM plus a simple ESP is a valid start. Jumping into an enterprise hub because the brand feels grown-up is how you spend the year in implementation. Start where your records already are.",
      },
    ],
  },
  {
    slug: "email-marketing-jobs",
    title: "Email marketing jobs: manager, specialist, lifecycle",
    description:
      "What those titles actually do, how they differ, and what hiring managers look for besides a pretty Mailchimp screenshot.",
    query: "email marketing jobs",
    kicker: "Careers",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing jobs", "lifecycle marketing role", "email marketing specialist"],
    sections: [
      {
        heading: "Three titles that get mashed together",
        paragraphs: [
          "Email marketing manager: owns the calendar, the vendor relationship, the reporting to a marketing lead, and usually the budget line. They may still build in the ESP. At a larger company they do not. Email specialist: production. They build the campaigns, QA in Outlook, hang UTMs, and keep the template from collapsing. Lifecycle marketer (sometimes CRM or retention): owns flows, segments, and the theory of who gets what when. They think in journeys, not in Tuesdays.",
          "Job posts on [LinkedIn](https://www.linkedin.com/jobs/) mix these because HR copied a template. Read the first five bullets. If it is 'send the newsletter and pull a list for sales,' it is specialist work with a manager title. If it is 'own LTV and build the lifecycle map,' it is lifecycle, even if the title says email.",
        ],
      },
      {
        heading: "What the work looks like on a Tuesday",
        paragraphs: [
          "Specialist: rebuild a module because legal changed a disclaimer, test dark mode, fight a footer that duplicates the unsub link. Manager: cut a send because deliverability dipped, brief an agency, argue with product about the in-app prompt that cannibalizes the email. Lifecycle: notice that trial-day-three mail is firing after people already converted, fix the exclusion, ship a win-back for 90-day quiet profiles.",
          "Deliverability crises pull everyone into the email aisle: Google Postmaster, a spike in complaints, a domain that needs a pause. That is not 'creative.' It is operations. People who only want to write subject lines bounce off this part of the job.",
        ],
      },
      {
        heading: "How people get hired",
        paragraphs: [
          "Portfolios that show a live email (not a Dribbble of a fake iPhone) plus a sentence on the result beat a Canva collage. Lifecycle candidates should talk about triggers and exclusions, not 'engagement.' Managers should talk about volume, complaint rate, and a time they killed a send. Tool logos ([Klaviyo](https://www.klaviyo.com), [HubSpot](https://www.hubspot.com), Salesforce) help only as proof you have sat in an account. They are not the skill.",
          "Agencies hire for speed and client manners. In-house hires for political patience and product knowledge. Both want someone who will not import a bought list 'to hit the number.'",
        ],
      },
    ],
    faqItems: [
      {
        question: "Do I need SQL for email jobs?",
        answer:
          "Not for most specialist roles. Lifecycle and marketing-ops roles often need enough SQL or warehouse literacy to build audiences the ESP cannot. Managers need enough to smell a bad dashboard. Learn it when the job requires it, not as a personality.",
      },
      {
        question: "Is this a good first marketing job?",
        answer:
          "Yes if you like systems and constraints (Outlook, 600 pixels, the spam button). No if you only want brand campaigns with no measurement. Email is closer to operations than to a mood film.",
      },
    ],
  },
  {
    slug: "email-marketing-design",
    title: "Email marketing design: templates, dark mode, accessibility",
    description:
      "Email is a narrow HTML document. Templates, dark-mode inversion, alt text, and contrast. Pretty Figma files are not the deliverable.",
    query: "email marketing design",
    kicker: "Design",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing design", "email dark mode", "accessible email templates"],
    sections: [
      {
        heading: "Design for a 600-pixel document that Outlook will mangle",
        paragraphs: [
          "Email design is still table-based HTML for reliability, hybrid or fluid-hybrid patterns for mobile, and a live-text hierarchy that works if images are blocked. Width commonly sits around 600 pixels because that is the tradition clients expect. Fancy CSS grid is a good way to send a broken letter to desktop Outlook. If the design only exists as a Figma frame, it is not email yet.",
          "Templates are a design system: header, one-column article, two-column product, footer with address and unsub. Fewer modules, used often, beat a unique art piece every week. [Beefree](https://beefree.io) and ESP editors encode that system. Custom HTML is for teams who will maintain it.",
        ],
      },
      {
        heading: "Dark mode",
        paragraphs: [
          "Apple Mail, Outlook.com, and others invert or recolor backgrounds. A logo that is black-on-transparent becomes a black mark on a black background. Transparent PNGs and hard-coded dark text on a light module both fail in different ways. Test. [Litmus](https://www.litmus.com) dark-mode previews catch a lot. A light-colored outline on logos, and avoiding giant full-bleed black hero images, saves you.",
          "You cannot fully control inversion. Design so the email is readable after a bad inversion, not only in the art-directed light version.",
        ],
      },
      {
        heading: "Accessibility is production, not a badge",
        paragraphs: [
          "Alt text on every meaningful image, empty alt on decorative spacers, real heading markup where the ESP allows it, link text that is not 'click here,' and color contrast that survives dark mode. [WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/) is the reference. Email cannot meet every web criterion. That is not permission to ship gray text on gray.",
          "Font size: 16px-ish body on mobile. Tap targets that a thumb can hit. Language attribute on the HTML. Prefers-reduced-motion: GIFs that strobe will make people ill. None of this is aesthetic icing. It is whether a portion of the list can read you.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Should emails be image-only?",
        answer:
          "No. Image-only mail fails when images are blocked, fails accessibility, and looks like a blast from 2008. Live text plus a few images. If legal requires a pixel-perfect banner, still repeat the offer in text.",
      },
      {
        question: "Do I need a designer on staff?",
        answer:
          "Not for a simple newsletter template. Yes if you have a catalog and a module system. A good template plus a specialist who knows Outlook will beat a brand designer who has never opened Litmus.",
      },
    ],
  },
  {
    slug: "email-marketing-best-practices",
    title: "Email marketing best practices that still hold",
    description:
      "Consent, list hygiene, and frequency. Authentication and warmup are email-aisle work. Skip the recycled 'best time to send' trivia.",
    query: "email marketing best practices",
    kicker: "Hygiene",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing best practices", "email list hygiene", "email consent"],
    sections: [
      {
        heading: "Consent you can explain",
        paragraphs: [
          "Best practice starts at capture: say what they get, how often, and who you are. Pre-checked boxes are lazy and, in many places, unlawful. A receipt that also opts them into weekly promos without a separate choice will haunt you. Keep the source and timestamp. When someone asks 'why am I on this list,' an answer that names the form is the practice. 'You bought something once' is thin unless the law and the checkout copy agree.",
          "Honor unsubscribes quickly. [CAN-SPAM](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) gives a window; mailbox providers and humans expect faster. One-click unsub in the header is now expected for bulk senders at Gmail and Yahoo. That is email-aisle compliance, not a footer design trend.",
        ],
      },
      {
        heading: "List hygiene",
        paragraphs: [
          "Remove hard bounces immediately. Sunset people who have not opened or clicked in a long window, with a last-chance send if you want, then stop. Role addresses (info@, sales@) bounce and complain. Typos (gmial.com) should be caught at the form. Never import an old dump 'to re-engage' without a confirmed permission story. Re-permission campaigns exist. Blasting silence is not one.",
          "Hygiene protects domain reputation. That reputation is the email aisle: IP, domain, complaint rate, spam traps. A pretty template on a dirty list still dies in spam.",
        ],
      },
      {
        heading: "Frequency is a promise, not a hack",
        paragraphs: [
          "Send as often as you promised at signup, or less. Daily can work for a deals site people asked for. Daily from a B2B tool they forgot they installed will get you the spam button. Preference centers beat guessing. If you do not have one, at least separate product updates from promotions with different lists or a real preference.",
          "Ignore universal 'Tuesday at 10am' advice. Your list has a timezone and a habit. Test inside your own data. Best-practice trivia columns exist to fill pages. Your unsubscribe rate after a cadence change is the actual signal.",
        ],
      },
      {
        heading: "Authenticate, then ramp",
        paragraphs: [
          "SPF, DKIM, DMARC on the sending domain. Align the from-domain with DKIM. Warm a new domain by sending to engaged people first, then widening. That warmup is email aisle, not a social-account trick. Google's bulk-sender guidance is public in [Gmail sender requirements](https://support.google.com/a/answer/81126). Read it if you send at volume. Skipping DNS is not a creative choice.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Should I buy a list if I immediately offer an unsub?",
        answer:
          "No. An unsub on a message they never asked for does not turn a cold file into a marketing list. You still trained filters, and you still annoyed people. Organic capture is slower and is the practice.",
      },
      {
        question: "Is double opt-in required?",
        answer:
          "In some countries and for some ESPs, yes. Elsewhere it is optional and still useful against fake signups. If you skip it, watch complaint rate. A spike means you needed it.",
      },
    ],
  },
  {
    slug: "email-marketing-examples",
    title: "Email marketing examples: B2B and ecommerce are different species",
    description:
      "The emails that tend to work for B2B (updates, invites, sales follow-up) versus ecommerce (welcome, abandon, post-purchase). Do not copy one into the other.",
    query: "email marketing examples",
    kicker: "Examples",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing examples", "B2B email examples", "ecommerce email types"],
    sections: [
      {
        heading: "Do not copy a retailer into a sales org",
        paragraphs: [
          "Example roundups on the web mash a colorful abandoned-cart mail next to a SaaS product update and call both 'great email marketing.' They have different jobs, different legal tones, and different metrics. Steal structure (clear from-name, one action, scannable first screen). Do not steal a 20% off badge into a security-audit newsletter. [Mailchimp](https://mailchimp.com) and similar ESPs publish galleries. Use them as layout hints, not as your offer.",
          "Below are types that show up because they match how those businesses make money, not because they won an award.",
        ],
      },
      {
        heading: "B2B types that earn replies or clicks",
        paragraphs: [
          "Product changelog: what shipped, who it is for, a link to the docs. Short. People who already pay you will read this more than a 'thought leadership' essay. Event invite: one event, one time, one RSVP. Sales follow-up after a call: recap, assets promised, next step. That last one is often 1:1 from a mailbox, not a blast, and it still counts as email the company relies on.",
          "Nurture for a long deal: a case study that matches industry, then a pause. Webinar replay with a timestamp ('jump to the pricing question at 18:00') beats attaching a 50-page PDF. Internal enablement mail to your own sales team is not marketing, but the same craft applies: one ask.",
        ],
      },
      {
        heading: "Ecommerce types that move orders",
        paragraphs: [
          "Welcome with a real next step (complete profile, first-order education, or a modest incentive if that is your model). Browse or cart abandon with the actual SKU, stock honesty, and shipping cutoff if you have one. Post-purchase: shipping, how to use, cross-sell only after the package would have arrived. Win-back after a quiet stretch, with a reason to come back that is not only a coupon.",
          "Restock and back-in-stock are permission-rich because the person asked. Review requests after delivery. Loyalty statements. These fail when every mail is a coupon. They also fail when the creative hides the product in lifestyle fog. Show the item.",
        ],
      },
      {
        heading: "What both sides still share",
        paragraphs: [
          "A recognizable from-name. A subject that matches the body. A way out. No fake urgency on things that are not scarce. No image-only legal text. B2B can learn scannable product blocks from retail. Retail can learn 'say the news' from good changelog mail. That is the useful crossover. A fashion GIF in a CFO nurture is not.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Where can I see live examples?",
        answer:
          "Subscribe to brands you respect and save the HTML. Public 'best of' galleries are often agency ads. Your competitors' unsub footers will teach you more than a screenshot without a list context.",
      },
      {
        question: "Should B2B use cart-style urgency?",
        answer:
          "Almost never. A demo slot can have a real date. A white paper does not expire at midnight. Fake countdown clocks train people to ignore you and can be a consumer-protection problem.",
      },
    ],
  },
  {
    slug: "email-marketing-strategy",
    title: "Email marketing strategy: calendar, segments, offer",
    description:
      "A strategy is the send calendar, who is in each segment, and what you are actually asking for. Tactics come after those three.",
    query: "email marketing strategy",
    kicker: "Planning",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["email marketing strategy", "email calendar", "email segmentation"],
    sections: [
      {
        heading: "Strategy is three decisions, written down",
        paragraphs: [
          "An email marketing strategy is not a vision poster. It is a calendar of what ships, a definition of who receives each thing, and an offer (the action) for each send or flow. If any of those is 'it depends,' you have a queue of ideas. Finance cannot fund a queue.",
          "Start from the business motion. A store needs lifecycle coverage around browse, buy, and come-back. A B2B company needs a path from signup to sales-ready, plus mail that does not annoy customers who already pay. A media brand needs a habit (the newsletter) and a way to sell a sponsorship or a membership without wrecking the habit.",
        ],
      },
      {
        heading: "The calendar",
        paragraphs: [
          "Put campaigns on a month view: launches, events, seasonal peaks, legal-required notices. Put flows off to the side so nobody 'also dumps the launch into welcome.' Cadence per stream: customers versus prospects versus press. When two teams can send, the calendar is the lock. Without it you get three emails on a Tuesday and silence in week three.",
          "Leave white space. A strategy that fills every slot will train unsubscribes. The calendar is also where you schedule holds after a deliverability incident (email aisle: pause, clean, ramp). That is strategy, not panic, if it is written in advance.",
        ],
      },
      {
        heading: "Segments",
        paragraphs: [
          "Segment on behavior and status, not on cute personas that nobody can build in the ESP. Examples: bought in 30 days, never bought, trial active, trial expired, clicked pricing, customers on plan X. If a segment cannot be saved as a list or a condition, it is a workshop leftover.",
          "Suppression is a segment. Recent buyers out of a generic promo. People who booked a demo out of the cold nurture. Legal regions that require different footers. Strategy fails in the exclusions more often than in the subject line.",
        ],
      },
      {
        heading: "The offer",
        paragraphs: [
          "Every send asks for something: read, click, buy, book, forward, update a preference. Weak strategy uses the same offer (a vague 'learn more') on every audience. Strong strategy matches offer to temperature. A stranger gets a reason to stay subscribed. A warm trial gets a setup task. A lapsed buyer gets a specific product reason, not 'we miss you' copy that could fit any brand.",
          "If you cannot name the offer in five words, do not book the design time. The ESP cannot save a muddled ask. [Klaviyo](https://www.klaviyo.com) and [HubSpot](https://www.hubspot.com) will happily automate a bad offer at scale.",
        ],
      },
    ],
    faqItems: [
      {
        question: "How long should a strategy doc be?",
        answer:
          "A few pages plus the calendar. If it needs a workshop deck to explain, it will not survive a busy week. The ESP should reflect the segments. If the doc and the account disagree, the account is the real strategy.",
      },
      {
        question: "What if we have no segments yet?",
        answer:
          "You still have at least two: people who gave you an address for a newsletter, and people who bought. Split those before you invent six personas. Strategy can start crude. It cannot start as one blast to everyone forever.",
      },
    ],
  },
  {
    slug: "direct-email-marketing",
    title: "Direct email marketing: mailboxes, paper, and one-to-one",
    description:
      "Direct mail is paper. Email is digital. 'Direct' also means 1:1 sales mail. Three ideas share a phrase. Keep them straight.",
    query: "direct email marketing",
    kicker: "Direct",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["direct email marketing", "direct mail vs email", "one to one email"],
    sections: [
      {
        heading: "Two industries, one messy phrase",
        paragraphs: [
          "Direct marketing meant measurable, addressable media: catalogs, postcards, telemarketing. Direct mail is the paper half, still run through [USPS](https://www.usps.com) in the United States and equivalent posts elsewhere. Email inherited the 'direct' label because it is addressable and you can count replies and orders. 'Direct email marketing' in a search bar is often someone mixing those histories, or a vendor selling cold email as if it were a postcard campaign.",
          "Paper and email compete for budget in some retail programs (a catalog plus an email). They do not use the same creative file. A postcard's job is to survive a kitchen counter. An email's job is to survive a preview pane and a spam filter.",
        ],
      },
      {
        heading: "Direct mail versus email, practically",
        paragraphs: [
          "Direct mail costs per piece (print, postage, list). Email costs per program (ESP, production) with a near-zero marginal stamp. Mail is slower and harder to ignore if it looks like a bill or a real letter. Email is faster and easier to delete. Privacy laws differ: email has CAN-SPAM, GDPR, CASL-type rules; mail has its own list and suppression norms. A 'do not mail' file is not an unsubscribe header.",
          "Use paper when the object matters (a sample, a dimensional mailer, a handwritten note to a small account list). Use email when the news is time-sensitive or the list is large. Using email to mimic a scan of a postcard is usually a worse postcard and a worse email.",
        ],
      },
      {
        heading: "'Direct' as in one-to-one",
        paragraphs: [
          "Salespeople say direct email for 1:1 outreach: a message typed (or semi-typed) to one person, often from a corporate mailbox or a sequencer. That is not a newsletter. Deliverability still cares. Fifty 'personal' mails a day from a new domain is bulk in slow motion. Warmup, DNS, and pacing remain email-aisle problems. They are not solved by first-name tokens.",
          "Marketing automation can send 1:1-shaped mail (your trial expired, here is your usage). That is still a template. True 1:1 is when a human would stand behind every sentence. If you cannot, do not pretend. Recipients can tell, and so can filters that look at volume and similarity.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is cold email 'direct marketing'?",
        answer:
          "In the old catalog sense, addressable commercial mail is direct marketing. In the permission-email sense, cold email is outbound. You can call it direct. Inbox providers will still score it as bulk if you send a lot of it. Plan reputation accordingly, on a domain you can afford to bruise.",
      },
      {
        question: "Should I run the same offer in a postcard and an email?",
        answer:
          "The offer can match. The copy should not be identical. Paper needs a physical call to action (a URL short enough to type, a QR if you must). Email needs a button and a preview line. Test them as a pair if you have the budget, not as one asset dumped into two printers.",
      },
    ],
  },
  {
    slug: "hubspot",
    title: "What HubSpot is (CRM plus hubs, not a full review)",
    description:
      "HubSpot is a CRM company with marketing, sales, and service hubs. Email is part of Marketing Hub. This is a map, not a feature-by-feature review.",
    query: "hubspot",
    kicker: "HubSpot",
    cluster: "email",
    publishedDate: "August 17, 2026",
    updatedDate: "August 17, 2026",
    keywords: ["HubSpot", "HubSpot CRM", "HubSpot Marketing Hub"],
    sections: [
      {
        heading: "A CRM with hubs around it",
        paragraphs: [
          "[HubSpot](https://www.hubspot.com) sells a cloud CRM and optional hubs on top of the same contact and company records. The well-known hubs are Marketing, Sales, and Service. They also sell content/CMS and operations products; names and packaging change, so treat the current product page as the source, not a blog memory. The free CRM is how a lot of teams enter. Email marketing that uses HubSpot's full tooling generally lives in Marketing Hub, not in the free-forever myth people repeat from 2016.",
          "HubSpot started as an inbound-marketing company (blogs, forms, landing pages, email) and grew into a CRM platform because the contacts had to live somewhere sales would open. That history is why marketing objects feel native and why some sales teams still find it 'a marketing tool with a CRM.' Both reads are partly true.",
        ],
      },
      {
        heading: "What you actually buy",
        paragraphs: [
          "You buy seats, contacts (or marketing contacts, depending on the era of their pricing), and a hub tier. Marketing Hub is the one that includes the email tool, automation, and the landing-page/form cluster as HubSpot documents them. Sales Hub is pipelines, sequences, and sales email from the CRM. Those sequences are not the same object as marketing campaigns. Mixing them without rules is how a prospect gets a nurture and a sales bump in the same hour.",
          "This page will not invent a list of 'smart modules' or quote a price. HubSpot changes SKUs. Open their site for the current matrix. Compare on whether your person record should live there, not on a screenshot of an email editor.",
        ],
      },
      {
        heading: "Email inside HubSpot, in one paragraph",
        paragraphs: [
          "You can send marketing email, build automated workflows, and report on clicks next to deal stage if sales lives in the same CRM. That is the pitch. You cannot assume HubSpot is the best commerce ESP, the best transactional pipe, or the cheapest newsletter tool. Store-heavy teams often keep [Klaviyo](https://www.klaviyo.com) for lifecycle and HubSpot for sales. Newsletter-only teams often find [Mailchimp](https://mailchimp.com) enough. HubSpot wins when marketing and sales agree the contact is the center and will actually use the CRM.",
        ],
      },
      {
        heading: "What this is not",
        paragraphs: [
          "This is not a ranked review, not a migration guide, and not a claim about inbox placement. Dedicated sending domains and warmup, if you use them, are still email-aisle DNS and reputation work. HubSpot will give you records to authenticate. It will not exempt you from Gmail's bulk-sender rules. For HubSpot-specific email setup, use their documentation and a separate article that stays in the product. Here the job was to say what the company is.",
        ],
      },
    ],
    faqItems: [
      {
        question: "Is HubSpot an ESP or a CRM?",
        answer:
          "Both, in practice. The CRM is the center. Marketing Hub adds ESP-like sending on those contacts. If you only need a newsletter and no sales pipeline, you may be buying a lot of surface area.",
      },
      {
        question: "Does this article cover every HubSpot feature?",
        answer:
          "No. Feature lists go stale and turn into fiction. Use HubSpot's own product pages for what a hub includes today. Use a dedicated email-in-HubSpot guide if you need click-paths. This page is the category map.",
      },
    ],
  },
];
