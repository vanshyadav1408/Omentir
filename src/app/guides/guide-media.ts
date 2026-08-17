import type { VisualKind } from "./visuals";

export type GuideTableData = {
  caption: string;
  headers: string[];
  rows: string[][];
};

export type GuideInsert = {
  afterIndex: number;
  visual?: VisualKind;
  caption?: string;
  table?: GuideTableData;
};

export type GuideEnrichment = {
  inserts: GuideInsert[];
  faq?: boolean;
};

export const GUIDE_MEDIA: Record<string, GuideEnrichment> = {
  "automation-for-linkedin": {
    faq: false,
    inserts: [
      {
        afterIndex: -1,
        visual: "jobs-four",
        caption: "Four jobs people lump together as LinkedIn automation. Only the first two usually touch your personal account.",
      },
      {
        afterIndex: 1,
        table: {
          caption: "What to ask before you turn anything on",
          headers: ["If you mean", "You are buying", "Who gets hurt if it fails"],
          rows: [
            ["Invites and DMs", "A sequencer with caps", "Your name on the profile"],
            ["A list dump", "A scraper or export", "The account, then the data"],
            ["Page posts", "A scheduler", "The company Page"],
            ["Ads", "Campaign Manager", "The ad account"],
          ],
        },
      },
    ],
  },
  "linkedin-automation-software": {
    inserts: [
      {
        afterIndex: 0,
        visual: "cloud-extension-api",
        caption: "Software in this aisle is an architecture choice, not a feature list.",
      },
    ],
  },
  "linkedin-automation-tools": {
    faq: false,
    inserts: [
      {
        afterIndex: -1,
        visual: "find-send-scrape",
        caption: "Shortlist by job. A grid of 'best tools' hides this split.",
      },
      {
        afterIndex: 0,
        table: {
          caption: "A sentence that points at a shelf",
          headers: ["You say", "Shelf"],
          rows: [
            ["I have a CSV and need invites plus two follow-ups", "Send"],
            ["I do not have a list yet", "Find"],
            ["I need a one-off export of a search I already ran", "Scrape"],
          ],
        },
      },
    ],
  },
  "best-linkedin-automation-tools": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "Criteria that change the purchase. Not a ranked top ten.",
          headers: ["Criterion", "Why it matters"],
          rows: [
            ["Job", "Find, send, and scrape are different products"],
            ["Whose list", "Upload versus the product building it"],
            ["Limits you can see", "A slider you cannot lower is not a safety feature"],
            ["Inbox", "Replies have to land where a person will answer"],
            ["Seats", "One founder profile versus a sender pool"],
          ],
        },
      },
    ],
  },
  "linkedin-outreach-automation": {
    inserts: [
      {
        afterIndex: 0,
        visual: "invite-wait-message",
        caption: "The useful sequence is slow on purpose. Infinite nudges train people to ignore you.",
      },
    ],
  },
  "linkedin-marketing-automation": {
    faq: false,
    inserts: [
      {
        afterIndex: -1,
        visual: "page-ads-dm",
        caption: "Marketing automation on LinkedIn is Page and ads work. DMs from a person are a different budget.",
      },
    ],
  },
  "linkedin-message-automation": {
    inserts: [
      {
        afterIndex: 0,
        visual: "inmail-invite-dm",
        caption: "Three boxes. Automation that calls all of them 'Message' will truncate or waste credits.",
      },
    ],
  },
  "linkedin-lead-generation-automation": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        visual: "csv-filter-comment",
        caption: "How names enter the bucket decides whether the first note has a reason to exist.",
      },
      {
        afterIndex: 1,
        table: {
          caption: "Measure reply rate by source after two weeks",
          headers: ["Source", "What you actually have"],
          rows: [
            ["Purchased CSV", "Titles. Not a moment."],
            ["Saved search", "A query you can rerun"],
            ["Commenters", "A post you can cite"],
          ],
        },
      },
    ],
  },
  "linkedin-api": {
    inserts: [
      {
        afterIndex: 0,
        visual: "official-api",
        caption: "If a vendor says they use 'the LinkedIn API' for outbound DMs, ask which product and which partnership.",
      },
    ],
  },
  expandi: {
    inserts: [
      {
        afterIndex: 0,
        visual: "cloud-seats",
        caption: "Cloud LinkedIn sequences on lists you import. Confirm current limits on expandi.io.",
      },
    ],
  },
  dripify: {
    inserts: [
      {
        afterIndex: 0,
        visual: "drip-steps",
        caption: "A drip is delays and next lines. Confirm what Dripify actually sends on dripify.io.",
      },
    ],
  },
  n8n: {
    inserts: [
      {
        afterIndex: 0,
        visual: "n8n-nodes",
        caption: "n8n is a graph: trigger, transform, write. It is not a LinkedIn campaign UI.",
      },
    ],
  },
  "workflow-automation": {
    inserts: [
      {
        afterIndex: 0,
        visual: "workflow-path",
        caption: "Name the exception before you automate the happy path.",
      },
    ],
  },
  "how-to-create-a-linkedin-profile": {
    inserts: [
      {
        afterIndex: 0,
        visual: "profile-blocks",
        caption: "Photo, headline, About. A hollow profile filters you as automation even when you typed it.",
      },
    ],
  },
  "linkedin-news": {
    inserts: [
      {
        afterIndex: 0,
        visual: "news-vs-rumor",
        caption: "Skim Help for a feature you use. Ignore algorithm gossip until a first-party post confirms it.",
      },
    ],
  },
  "linkedin-updates": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "What to treat as an update",
          headers: ["Source", "Use it for"],
          rows: [
            ["In-product changelog / Help", "Settings that affect invites, InMail, Pages"],
            ["Official blog", "Ads and Page features"],
            ["Creator threads", "Entertainment until confirmed"],
          ],
        },
      },
    ],
  },
  "what-is-b2b-marketing": {
    inserts: [
      {
        afterIndex: -1,
        visual: "committee",
        caption: "B2B marketing has to survive a committee, not just a cart.",
      },
    ],
  },
  "b2b-meaning": {
    inserts: [
      {
        afterIndex: 0,
        visual: "b2b-vs-b2c",
        caption: "B2B is how two organizations trade. Marketing is only one of the jobs inside that.",
      },
    ],
  },
  "marketing-for-b2b": {
    inserts: [
      {
        afterIndex: 0,
        visual: "digital-mix",
        caption: "Channels a B2B company actually runs. Pick one primary motion before you add three more.",
      },
    ],
  },
  "b2b-marketing-strategy": {
    inserts: [
      {
        afterIndex: 0,
        visual: "strategy-plan",
        caption: "Strategy names the buyer and the motion. A plan assigns dates and owners.",
      },
    ],
  },
  "b2b-marketing-plan": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "A quarter plan that can be staffed",
          headers: ["Block", "Owner", "Done looks like"],
          rows: [
            ["ICP and offer", "Founder or product", "Two sentences a stranger understands"],
            ["Demand", "Marketing", "A list of programs with dates"],
            ["Outbound", "Sales or founder", "A cap and a reply owner"],
            ["Proof", "Marketing", "One case or teardown shipped"],
          ],
        },
      },
    ],
  },
  "b2b-marketing-examples": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "Examples by job, not by aesthetic",
          headers: ["Example", "Job"],
          rows: [
            ["Webinar with a customer", "Create a reason to talk"],
            ["Comparison page", "Catch late intent"],
            ["Founder LinkedIn notes", "Start conversations"],
            ["Case study", "Help a champion sell inside"],
          ],
        },
      },
    ],
  },
  "b2b-marketing-trends": {
    inserts: [
      {
        afterIndex: 0,
        visual: "owned-paid-earned",
        caption: "The useful 'trend' is usually: more of the conversation happens in channels you do not rent.",
      },
    ],
  },
  "b2b-content-marketing-trends": {
    inserts: [
      {
        afterIndex: 0,
        visual: "content-vs-product",
        caption: "Docs and comparison pages are content. A 2,000-word 'future of' essay often is not.",
      },
    ],
  },
  "b2b-marketing-news": {
    inserts: [
      {
        afterIndex: 0,
        visual: "news-vs-rumor",
        caption: "Follow a few first-party pubs. Do not rebuild the funnel on a recap thread.",
      },
    ],
  },
  "b2b-marketing-benchmarks": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "How to use a benchmark without copying someone else's funnel",
          headers: ["You see", "Ask"],
          rows: [
            ["Average reply rate", "For which channel, ICP, and year"],
            ["SQL rate", "How they define SQL"],
            ["CAC", "What costs are in the number"],
          ],
        },
      },
    ],
  },
  "b2b-marketing-metrics": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "Vanity versus pipeline",
          headers: ["Metric", "Use it for"],
          rows: [
            ["Impressions", "Whether the Page is dead"],
            ["MQLs", "A review pile, not a win"],
            ["Meetings held", "Whether outbound worked"],
            ["Pipeline created", "Whether marketing paid rent"],
          ],
        },
      },
    ],
  },
  "b2b-marketing-attribution": {
    inserts: [
      {
        afterIndex: 0,
        visual: "attribution",
        caption: "First and last touch are accounting tricks. The buyer had a messy path.",
      },
    ],
  },
  "b2b-marketing-data": {
    inserts: [
      {
        afterIndex: 0,
        visual: "data-decay",
        caption: "Bought rows decay. First-party activity is slower to collect and harder to fake.",
      },
    ],
  },
  "b2b-marketing-database": {
    inserts: [
      {
        afterIndex: 0,
        visual: "crm-vs-file",
        caption: "A database you operate is not a credit pack you refresh.",
      },
    ],
  },
  "b2b-lead-generation": {
    inserts: [
      {
        afterIndex: 0,
        visual: "inbound-outbound-partner",
        caption: "Three ways a name shows up. Mixing them in one dashboard hides which one works.",
      },
    ],
  },
  "b2b-marketing-automation": {
    inserts: [
      {
        afterIndex: 0,
        visual: "nurture-score-route",
        caption: "Score, nurture, route. This is not LinkedIn invite automation.",
      },
    ],
  },
  "b2b-marketing-tools": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        visual: "tool-map",
        caption: "Buy a category, not a logo collage.",
      },
    ],
  },
  "b2b-marketing-agency": {
    inserts: [
      {
        afterIndex: 0,
        visual: "hire-vs-do",
        caption: "Hire for a motion you will not staff. Keep the offer.",
      },
    ],
  },
  "top-b2b-marketing-agencies": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "How to evaluate without a fake top-ten list",
          headers: ["Ask", "Walk if"],
          rows: [
            ["Who did the work last quarter", "They will not name a person"],
            ["What they will not do", "Everything is in scope"],
            ["Who owns the list and ads account", "They keep the logins"],
          ],
        },
      },
    ],
  },
  "b2b-marketing-company": {
    inserts: [
      {
        afterIndex: 0,
        visual: "hire-vs-do",
        caption: "A marketing company sells a motion. You still own the product story.",
      },
    ],
  },
  "b2b-marketing-services": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "Retainer, project, fractional",
          headers: ["Shape", "Fits"],
          rows: [
            ["Retainer", "Ongoing programs, a named team"],
            ["Project", "A site, a launch, a teardown"],
            ["Fractional", "A senior person part-time, not a bench"],
          ],
        },
      },
    ],
  },
  "b2b-marketing-solutions": {
    inserts: [
      {
        afterIndex: 0,
        visual: "bundle-two-contracts",
        caption: "A 'solution' is often software plus people. Price the pieces.",
      },
    ],
  },
  "b2b-marketing-consulting": {
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "Diagnosis versus doing",
          headers: ["Consulting", "Doing"],
          rows: [
            ["Finds the broken motion", "Runs the webinar"],
            ["Leaves a brief", "Leaves a campaign in the ESP"],
          ],
        },
      },
    ],
  },
  "b2b-content-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "content-vs-product",
        caption: "If a rep would paste it after a first meeting, it is product content.",
      },
    ],
  },
  "b2b-content-marketing-agencies": {
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "What a content shop can own",
          headers: ["They can", "You keep"],
          rows: [
            ["Drafts and production", "Facts and claims"],
            ["SEO structure", "The product truth"],
            ["A calendar", "Who is allowed to publish"],
          ],
        },
      },
    ],
  },
  "b2b-video-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "video-places",
        caption: "Where the file lives changes the job. LinkedIn native is not a YouTube SEO play.",
      },
    ],
  },
  "b2b-performance-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "paid-funnel",
        caption: "Paid pipeline is click, landing, conversation. CAC without those three is a vanity ratio.",
      },
    ],
  },
  "b2b-growth-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "experiment-loop",
        caption: "Growth is a loop with a kill switch. Brand is not an A/B test you run on Fridays.",
      },
    ],
  },
  "b2b-brand-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "content-vs-product",
        caption: "Brand is the sentence people repeat when you are not in the room.",
      },
    ],
  },
  "b2b-event-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "event-types",
        caption: "Badge scans are not meetings. Count conversations you would take again.",
      },
    ],
  },
  "b2b-influencer-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "creator-vs-analyst",
        caption: "B2B 'influence' is usually a practitioner your buyers already trust.",
      },
    ],
  },
  "b2b-influencer-marketing-agency": {
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "What the agency actually sells",
          headers: ["Deliverable", "Watch for"],
          rows: [
            ["A roster", "Names your ICP does not read"],
            ["Contracts and disclosure", "Missing #ad / commercial language"],
            ["Measurement", "Vanity views with no pipeline story"],
          ],
        },
      },
    ],
  },
  "b2b-saas-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "plg-vs-sales",
        caption: "SaaS marketing splits on how people start: trial or demo. Do not run both as if they were one funnel.",
      },
    ],
  },
  "b2b-healthcare-marketing": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "Constraints that change the channel",
          headers: ["Constraint", "What it does"],
          rows: [
            ["Who you may email", "Kills cold lists you would use in SaaS"],
            ["Claims", "Legal reads the landing page"],
            ["Cycle length", "Nurture matters more than a burst"],
          ],
        },
      },
    ],
  },
  "b2b-manufacturing-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "committee",
        caption: "Plant, distributor, and economic buyer are often three different people.",
      },
    ],
  },
  "b2b-technology-marketing": {
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "Developer versus economic buyer",
          headers: ["Reader", "They need"],
          rows: [
            ["Developer", "Docs, APIs, a sandbox"],
            ["Economic buyer", "Risk, cost, who else uses it"],
          ],
        },
      },
    ],
  },
  "linkedin-b2b-marketing": {
    inserts: [
      {
        afterIndex: -1,
        visual: "three-linkedin-jobs",
        caption: "Organic, ads, and 1:1 outbound are three LinkedIn jobs. One budget line for all three usually fails.",
      },
    ],
  },
  "b2b-email-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "email-nurture-vs-cold",
        caption: "Nurture and cold outbound share a mailbox technology. They do not share a reputation model.",
      },
    ],
  },
  "b2b-seo": {
    inserts: [
      {
        afterIndex: 0,
        visual: "intent-pages",
        caption: "Learn, compare, buy. Doorway pages that swap a vendor name are not this.",
      },
    ],
  },
  "b2b-social-media-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "rented-feed",
        caption: "Use the feed to earn an address. The feed is not the list.",
      },
    ],
  },
  "b2b-digital-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "digital-mix",
        caption: "Digital here means the mix and how you measure it.",
      },
    ],
  },
  "b2b-online-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "online-path",
        caption: "Online here means they can find you, read proof, and buy without a plant visit.",
      },
    ],
  },
  "b2b-email-marketing-agency": {
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "Lifecycle shop versus cold outbound shop",
          headers: ["Hire for", "They should know"],
          rows: [
            ["Lifecycle", "Welcome, onboarding, expansion"],
            ["Cold", "Domains, warmup, list source"],
          ],
        },
      },
    ],
  },
  "b2b-digital-marketing-agency-uk": {
    inserts: [
      {
        afterIndex: 0,
        visual: "gdpr-uk",
        caption: "UK work starts with lawful basis and who holds the list, not with a London office photo.",
      },
    ],
  },
  "b2b-business-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "b2b-vs-b2c",
        caption: "People who search this want the plain version of B2B marketing.",
      },
    ],
  },
  "what-is-email-marketing": {
    inserts: [
      {
        afterIndex: -1,
        visual: "permission-list-send",
        caption: "Permission, a list, a send. Transactional mail is a different pile.",
      },
    ],
  },
  "email-marketing-campaigns": {
    inserts: [
      {
        afterIndex: 0,
        visual: "campaign-anatomy",
        caption: "A campaign is from-name, subject, body, a test. Then a goal you can count.",
      },
    ],
  },
  "email-marketing-company": {
    inserts: [
      {
        afterIndex: 0,
        visual: "bundle-two-contracts",
        caption: "Those firms sell production. Ask who owns the ESP login.",
      },
    ],
  },
  "free-email-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "free-limits",
        caption: "Free tiers cap contacts, sends, or branding. Outgrow on purpose.",
      },
    ],
  },
  "digital-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "owned-paid-earned",
        caption: "Email is owned. Ads are paid. A journalist mention is earned.",
      },
    ],
  },
  "email-marketing-services": {
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "Done-for-you versus a platform login",
          headers: ["You buy", "You still own"],
          rows: [
            ["A service", "The list and the promise"],
            ["A platform", "The calendar and the QA"],
          ],
        },
      },
    ],
  },
  "email-marketing-cost": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "Cost piles people forget",
          headers: ["Pile", "What it is"],
          rows: [
            ["Software", "ESP or suite seats"],
            ["Send volume", "Overages"],
            ["Design", "Templates or a person"],
            ["List", "Capture, not a bought file"],
            ["Time", "The hour you actually spend"],
          ],
        },
      },
    ],
  },
  "email-marketing-software": {
    inserts: [
      {
        afterIndex: 0,
        visual: "esp-window",
        caption: "Software here means the sending product: audience, template, send.",
      },
    ],
  },
  "email-marketing-tools": {
    inserts: [
      {
        afterIndex: 0,
        visual: "stack-four",
        caption: "A tools stack is several jobs. An ESP is one of them.",
      },
    ],
  },
  "video-email-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "video-in-inbox",
        caption: "Most inboxes will not play a file. A still plus a link is the reliable version.",
      },
    ],
  },
  "email-marketing-agency": {
    inserts: [
      {
        afterIndex: 0,
        visual: "hire-vs-do",
        caption: "The agency can build. The list should stay in an account you control.",
      },
    ],
  },
  "email-marketing-automation": {
    inserts: [
      {
        afterIndex: 0,
        visual: "welcome-abandon-nurture",
        caption: "Flows versus a blast. Welcome, abandon, nurture are different triggers.",
      },
    ],
  },
  "email-marketing-platform": {
    inserts: [
      {
        afterIndex: 0,
        visual: "suite-overlap",
        caption: "A platform is a suite. An ESP is send. Do not buy a CMS to fix bounces.",
      },
    ],
  },
  "email-marketing-jobs": {
    inserts: [
      {
        afterIndex: 0,
        visual: "roles-row",
        caption: "Specialist, manager, lifecycle. The titles are not interchangeable.",
      },
    ],
  },
  "email-marketing-design": {
    inserts: [
      {
        afterIndex: 0,
        visual: "dark-mode-mail",
        caption: "If it only looks right on a white canvas, it is not finished.",
      },
    ],
  },
  "email-marketing-best-practices": {
    inserts: [
      {
        afterIndex: 0,
        visual: "hygiene",
        caption: "Consent, bounces, frequency. The rest is taste.",
      },
    ],
  },
  "email-marketing-examples": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "Examples by business, not by awards",
          headers: ["Type", "Fits"],
          rows: [
            ["Abandoned cart", "Ecommerce"],
            ["Product changelog", "SaaS users"],
            ["Event reminder", "A list that registered"],
            ["Sales follow-up", "A thread, not a blast"],
          ],
        },
      },
    ],
  },
  "email-marketing-strategy": {
    inserts: [
      {
        afterIndex: 0,
        visual: "calendar-segments",
        caption: "Strategy is who gets what, how often, and why this week.",
      },
    ],
  },
  "direct-email-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "mail-vs-post",
        caption: "Direct mail is paper. Direct email is 1:1 in a mailbox. Do not mix the compliance stories.",
      },
    ],
  },
  hubspot: {
    inserts: [
      {
        afterIndex: 0,
        visual: "hub-modules",
        caption: "HubSpot is a hub of products. Confirm what you are actually buying on hubspot.com.",
      },
    ],
  },
  "hubspot-email-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "esp-window",
        caption: "Email inside HubSpot still needs authentication, a footer, and an audience you can explain.",
      },
    ],
  },
  "how-to-do-email-marketing": {
    inserts: [
      {
        afterIndex: -1,
        visual: "first-program",
        caption: "One audience, one ESP, a welcome. Then a calendar.",
      },
    ],
  },
  "crm-email-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "crm-vs-esp",
        caption: "A CRM send is fine for twelve people. Bulk still wants an ESP.",
      },
    ],
  },
  "small-business-email-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "one-hour-week",
        caption: "If the tool needs a two-week onboarding, it is the wrong tool for one hour a week.",
      },
    ],
  },
  "best-email-marketing-tools": {
    faq: false,
    inserts: [
      {
        afterIndex: 0,
        visual: "stack-four",
        caption: "Tools means the stack: capture, send, auth, measure.",
      },
      {
        afterIndex: 1,
        table: {
          caption: "Examples, not a ranking",
          headers: ["Job", "Example"],
          rows: [
            ["General ESP", "Mailchimp"],
            ["Ecommerce lifecycle", "Klaviyo"],
            ["Lower-cost ESP", "Brevo"],
          ],
        },
      },
    ],
  },
  "email-marketing-templates": {
    inserts: [
      {
        afterIndex: 0,
        visual: "template-skeleton",
        caption: "A template is a width, a type scale, a footer. Strip the stock photo.",
      },
    ],
  },
  "influencer-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "creator-vs-analyst",
        caption: "Disclosure still applies. A practitioner is not a TikTok code.",
      },
    ],
  },
  mailchimp: {
    inserts: [
      {
        afterIndex: 0,
        visual: "esp-window",
        caption: "Mailchimp is an ESP many small lists start on. Confirm current limits on mailchimp.com.",
      },
    ],
  },
  "email-marketing-trends": {
    inserts: [
      {
        afterIndex: 0,
        visual: "hygiene",
        caption: "Inbox rules get tighter. Open rate as a north star is already a bad trend.",
      },
    ],
  },
  "ecommerce-email-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "browse-abandon-order",
        caption: "Browse, abandon, post-purchase. Do not pitch a buyer who just paid.",
      },
    ],
  },
  "email-marketing-course": {
    inserts: [
      {
        afterIndex: 0,
        table: {
          caption: "Learn this first",
          headers: ["Week", "Skill"],
          rows: [
            ["1", "List, consent, unsubscribe"],
            ["2", "SPF, DKIM, a test send"],
            ["3", "One welcome and one campaign"],
          ],
        },
      },
    ],
  },
  "email-marketing-news": {
    inserts: [
      {
        afterIndex: 0,
        visual: "news-vs-rumor",
        caption: "Client changes and Google/Yahoo sender rules are news. Recap threads are usually not.",
      },
    ],
  },
  "ai-email-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "draft-then-send",
        caption: "Generation is a draft. Send still needs a person and a real inbox test.",
      },
    ],
  },
  "social-media-marketing": {
    inserts: [
      {
        afterIndex: 0,
        visual: "rented-feed",
        caption: "Plan social like shelf space. Take an address home.",
      },
    ],
  },
  "email-marketing-management": {
    inserts: [
      {
        afterIndex: 0,
        visual: "qa-calendar",
        caption: "Management is the calendar plus the brakes.",
      },
    ],
  },
  "best-email-marketing-software": {
    inserts: [
      {
        afterIndex: 0,
        visual: "esp-window",
        caption: "This page is the ESP purchase. Not the stack, not the suite.",
      },
    ],
  },
  "email-marketing-solutions": {
    inserts: [
      {
        afterIndex: 0,
        visual: "bundle-two-contracts",
        caption: "Read a solution as a product contract plus a service contract.",
      },
    ],
  },
  "email-marketing-system": {
    inserts: [
      {
        afterIndex: 0,
        visual: "consent-chain",
        caption: "Capture, consent, ESP, CRM, analytics. A Thursday CSV is not a system.",
      },
    ],
  },
  "best-email-marketing-platforms": {
    inserts: [
      {
        afterIndex: 0,
        visual: "suite-overlap",
        caption: "Platforms are all-in-ones. Buy one if you want CRM plus send, not if you only have a bounce problem.",
      },
    ],
  },
};

export function guideMedia(slug: string): GuideEnrichment {
  return GUIDE_MEDIA[slug] ?? { inserts: [] };
}
