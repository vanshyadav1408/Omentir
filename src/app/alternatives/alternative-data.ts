import type { SeoContentPage } from "../seo-content/types";
import { GROK_BOT_FIRST_JOB_PROMPT } from "../grok-bot-setup";

/**
 * Category roundups. Not swapped-name clones.
 * One TypeScript route renders these: `/alternatives/[slug]/page.tsx`.
 */
export const ALL_ALTERNATIVES: SeoContentPage[] = [
  {
    "slug": "linkedin-automation",
    "title": "LinkedIn automation tools",
    "description": "A shortlist of LinkedIn sequencers and workspaces. Agency sender pools, chrome extensions, and an inspectable AI workspace are different purchases.",
    "summary": "HeyReach, Expandi, and Omentir solve different LinkedIn jobs.",
    "publishedDate": "August 17, 2026",
    "updatedDate": "August 17, 2026",
    "layout": "roundup",
    "keywords": [
      "LinkedIn automation alternatives",
      "HeyReach alternatives",
      "Expandi alternatives",
      "LinkedIn outreach tools"
    ],
    "verdict": "Buy a sequencer if you already have the list and need send scale across many accounts. Buy Omentir if you still need discovery, commenter signals, and a workspace a model can operate through MCP.",
    "roundupItems": [
      {
        "name": "HeyReach",
        "bestFor": "Agencies and teams that rotate many LinkedIn senders, import lists, and run cloud sequences with a shared inbox.",
        "watchFor": "You still bring the leads. Confirm current sender limits, safety, and MCP coverage on heyreach.io.",
        "href": "/comparisons/omentir-vs-heyreach"
      },
      {
        "name": "Expandi",
        "bestFor": "Cloud LinkedIn sequences with smart delays when the motion is already 'upload CSV, run steps.'",
        "watchFor": "Same aisle as other sequencers. If two pages could swap the logo, you are shopping send infrastructure, not discovery.",
        "href": "/comparisons/heyreach-vs-expandi"
      },
      {
        "name": "Omentir",
        "bestFor": "One or a few profiles, ICP finders or Steal Customers, campaigns from your account, replies in one inbox, MCP or REST operators.",
        "watchFor": "Not a multi-sender agency rotator. Not a chrome extension. LinkedIn-first, not email warmup."
      }
    ],
    "sections": [
      {
        "id": "the-split",
        "heading": "List in, versus list found",
        "paragraphs": [
          "Most LinkedIn automation tools assume the list already exists: Sales Navigator export, Clay table, CSV. They are good at steps: view, invite, message, if-connected. Omentir assumes the list is the product. Lead finders and Steal Customers refill groups from an ICP or from competitor commenters.",
          "If your agency's pitch is 'we run 40 seats,' HeyReach's public story matches that job. If your pitch is 'we find people who commented on a competitor post and write from that,' the sequencer aisle is the wrong shelf."
        ]
      },
      {
        "id": "safety",
        "heading": "Safety is pacing, not a badge",
        "paragraphs": [
          "Every vendor claims safe automation. LinkedIn still owns the account. Conservative daily limits, send windows, and a warmup on a quiet profile matter more than a marketing page. Read LinkedIn account safety and the warmup page before you raise caps."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Is Omentir a HeyReach alternative?",
        "answer": "For teams that wanted LinkedIn send plus discovery in one workspace, yes. For teams that needed unlimited sender rotation as the core product, no. Use the HeyReach matchup."
      },
      {
        "question": "Where is Dripify or Waalaxy?",
        "answer": "Same sequencer aisle as Expandi. If the buying question is chrome-or-cloud steps on a list you already have, those pages would read the same. This roundup names the job instead of cloning logos."
      }
    ],
    "relatedLinks": [
      {
        "label": "HeyReach alternatives",
        "href": "/comparisons/omentir-vs-heyreach",
        "description": "Sender pool versus LinkedIn workspace."
      },
      {
        "label": "HeyReach vs Expandi",
        "href": "/comparisons/heyreach-vs-expandi",
        "description": "Two sequencers, then Omentir as the third path."
      },
      {
        "label": "LinkedIn account safety",
        "href": "/features/linkedin-account-safety",
        "description": "Pacing that actually belongs on the account."
      }
    ],
    "ctaTitle": "If you do not have a list, do not buy a sequencer first",
    "ctaBody": "Run one Omentir finder. If the people look right, you needed discovery, not more senders."
  },
  {
    "slug": "ai-sdr",
    "title": "AI SDR tools",
    "description": "Packaged autonomous SDRs, prompt-led hunters, and an inspectable LinkedIn workspace. The category name is shared. The object you buy is not.",
    "summary": "11x, Artisan, AiSDR, Gojiberry, and Omentir are different machines.",
    "publishedDate": "August 17, 2026",
    "updatedDate": "August 17, 2026",
    "layout": "roundup",
    "keywords": [
      "AI SDR alternatives",
      "autonomous sales agent tools",
      "11x alternatives",
      "Artisan AI alternatives"
    ],
    "verdict": "Buy a packaged agent if you want a vendor to own email, phone, and LinkedIn as one black box. Buy Omentir if you want LinkedIn discovery you can open, pause, and drive from Claude or Cursor.",
    "roundupItems": [
      {
        "name": "11x AI",
        "bestFor": "Teams shopping a named digital worker story with a vendor-owned motion across channels they already like.",
        "watchFor": "Confirm what Alice actually sends today on 11x.ai. Do not assume LinkedIn depth from the category name.",
        "href": "/comparisons/omentir-vs-11x"
      },
      {
        "name": "Artisan AI",
        "bestFor": "Email-led autonomous prospecting with a packaged SDR narrative and a more established brand story.",
        "watchFor": "If you needed an inspectable LinkedIn send log and MIT source, that is an Omentir reason, not an Artisan failure.",
        "href": "/comparisons/omentir-vs-artisan"
      },
      {
        "name": "AiSDR",
        "bestFor": "Email-first autonomous SDR motions where the list and the mailbox are the product.",
        "watchFor": "LinkedIn-first teams will feel the channel mismatch. Confirm current channels on their site.",
        "href": "/comparisons/omentir-vs-aisdr"
      },
      {
        "name": "Gojiberry",
        "bestFor": "A prompt-in, agent-out crawl when you like briefing software in language and walking away.",
        "watchFor": "Steal Customers is not that crawl. Commenters on competitor posts are a narrower signal.",
        "href": "/comparisons/omentir-vs-gojiberry"
      },
      {
        "name": "Omentir",
        "bestFor": "LinkedIn workspace: My Product, finders, Steal Customers, campaigns from your profile, draft approval, MCP.",
        "watchFor": "Not a phone SDR. Not a multi-inbox email rotator. Open source if that is a real criterion."
      }
    ],
    "sections": [
      {
        "id": "name-collision",
        "heading": "AI SDR is a search query, not a spec",
        "paragraphs": [
          "People type the same four letters for a digital employee, a prompt crawler, and a LinkedIn workspace. If two landing pages could swap names and still read true, you are reading category spam. Each row above is a different object. Pick the object, then pick the vendor."
        ]
      },
      {
        "id": "open-source-filter",
        "heading": "Treat source code as a filter or ignore it",
        "paragraphs": [
          "Omentir's application is public under MIT. That matters for a security review and for self-hosting. It does not matter if you wanted a hosted button. Do not pick it for the license if you will never open the repo."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Which AI SDR is closest to Omentir?",
        "answer": "Gojiberry is the closest search-query neighbor because both promise an agent that finds buyers. The machine is still different: prompt crawl versus LinkedIn workspace. 11x and Artisan are closer to 'hire a digital SDR' packaging."
      },
      {
        "question": "Can I run Omentir fully autonomously?",
        "answer": "You can attach outreach and choose reply modes, including continuing until a meeting is confirmed. You remain responsible for the account, the claims, and LinkedIn's rules. Draft approval exists because walking away is how overclaims ship."
      }
    ],
    "relatedLinks": [
      {
        "label": "11x AI alternatives",
        "href": "/comparisons/omentir-vs-11x",
        "description": "Named digital worker versus workspace."
      },
      {
        "label": "Amplemarket vs 11x",
        "href": "/comparisons/amplemarket-vs-11x",
        "description": "Two packaged GTM stories, Omentir as the LinkedIn path."
      },
      {
        "label": "Replace the first SDR",
        "href": "/use-cases/replace-first-sdr",
        "description": "Hire versus software, without the category fog."
      }
    ],
    "ctaTitle": "If you wanted LinkedIn you can inspect, start there",
    "ctaBody": "Brief My Product and one finder. A packaged SDR demo will not show you that object."
  },
  {
    "slug": "sales-navigator",
    "title": "Sales Navigator tools",
    "description": "Sales Navigator is LinkedIn search you pay for. Apollo is a contact graph. Omentir is the workspace that turns a buyer definition into outreach. Those are three jobs.",
    "summary": "Paid LinkedIn search versus a workspace that sends.",
    "publishedDate": "August 17, 2026",
    "updatedDate": "August 17, 2026",
    "layout": "roundup",
    "keywords": [
      "Sales Navigator alternatives",
      "LinkedIn Sales Navigator alternatives",
      "Sales Navigator vs Apollo"
    ],
    "verdict": "Keep Sales Navigator if Boolean filters and saved searches are how you think. Add Omentir when those searches never leave the export. Keep Apollo if the graph is the system of record.",
    "roundupItems": [
      {
        "name": "Sales Navigator",
        "bestFor": "Reps who live in LinkedIn filters, InMail, and saved lists, and who will actually write the next note themselves.",
        "watchFor": "A search subscription does not send, follow up, or keep a campaign inbox. Confirm current LinkedIn packaging on their site.",
        "href": "/comparisons/omentir-vs-sales-navigator"
      },
      {
        "name": "Apollo",
        "bestFor": "Teams that want a contact graph and sequences outside LinkedIn's search UI.",
        "watchFor": "Exports still go stale. See the database roundup if that is the real aisle.",
        "href": "/comparisons/omentir-vs-apollo"
      },
      {
        "name": "Omentir",
        "bestFor": "Written ICP or competitor URLs in, ongoing discovery, campaigns from your profile, replies in one place.",
        "watchFor": "You do not get Sales Navigator's filter UI. You get an agent that uses the brief you wrote."
      }
    ],
    "sections": [
      {
        "id": "search-is-not-send",
        "heading": "Search is not send",
        "paragraphs": [
          "Sales Navigator is excellent at narrowing people. It is silent after the list exists unless a human types. PhantomBuster-style scrapers try to pull that list out. Sequencers try to message it. Omentir tries to skip the export ritual: brief the buyer, keep the group fresh, send from the connected account.",
          "If you already think in Boolean and you like that craft, keep Navigator. Do not drop it because a landing page called itself an alternative. Drop it only if you never open it."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Do I need Sales Navigator to use Omentir?",
        "answer": "No. Classic finders and Steal Customers do not require a Navigator seat. Keep Navigator if your team already builds lists there and wants that as a parallel source."
      },
      {
        "question": "Is PhantomBuster a Sales Navigator alternative?",
        "answer": "It is a way to extract and automate around LinkedIn and other sites. That is a scraper and workflow job, not a search subscription. See PhantomBuster versus Clay if that is the aisle."
      }
    ],
    "relatedLinks": [
      {
        "label": "Sales Navigator alternatives",
        "href": "/comparisons/omentir-vs-sales-navigator",
        "description": "Paid search versus a workspace that sends."
      },
      {
        "label": "Sales Navigator vs Apollo",
        "href": "/comparisons/sales-navigator-vs-apollo",
        "description": "Search versus graph, with Omentir as send."
      },
      {
        "label": "PhantomBuster alternatives",
        "href": "/comparisons/omentir-vs-phantombuster",
        "description": "DIY extraction versus hosted discovery."
      }
    ],
    "ctaTitle": "Open your last saved search",
    "ctaBody": "If those people were never messaged, the missing product is send, not another filter."
  },
  {
    "slug": "b2b-databases",
    "title": "B2B database tools",
    "description": "Apollo, Lusha, Cognism, and a live LinkedIn workspace. Credits and contact graphs go stale in a different way than a conversation that never started.",
    "summary": "Contact data versus active LinkedIn discovery.",
    "publishedDate": "August 17, 2026",
    "updatedDate": "August 17, 2026",
    "layout": "roundup",
    "keywords": [
      "Apollo alternatives",
      "Lusha alternatives",
      "Cognism alternatives",
      "B2B database alternatives"
    ],
    "verdict": "Keep the database if the job is a maintained graph, direct dials, or CRM enrichment. Use Omentir when the last CSV never became a conversation on LinkedIn.",
    "roundupItems": [
      {
        "name": "Apollo",
        "bestFor": "A commercial contact graph, sequences, and the export habit your team already has.",
        "watchFor": "Stale rows. If meetings never happen after the export, the next credit pack will not fix the message.",
        "href": "/comparisons/omentir-vs-apollo"
      },
      {
        "name": "Lusha",
        "bestFor": "Credit-based lookup when a rep already has the name and needs a number or email.",
        "watchFor": "Lookup is not outreach. Confirm current coverage on lusha.com.",
        "href": "/comparisons/omentir-vs-lusha"
      },
      {
        "name": "Cognism",
        "bestFor": "Teams that buy verified B2B data, often with a European compliance story, as a system of record for contacts.",
        "watchFor": "If last quarter's EU meetings started as LinkedIn DMs, a data renew is the wrong aisle.",
        "href": "/comparisons/omentir-vs-cognism"
      },
      {
        "name": "Omentir",
        "bestFor": "Live LinkedIn discovery from an ICP or competitor commenters, then outreach from your profile.",
        "watchFor": "Not a dialer. Not a 200-million-row graph. You will not download the internet."
      }
    ],
    "sections": [
      {
        "id": "what-goes-stale",
        "heading": "Decide which object goes stale first",
        "paragraphs": [
          "A phone number goes stale when people change jobs. A LinkedIn conversation goes stale when nobody sent it. Database buyers are usually paying to keep the graph fresh. Omentir buyers are usually paying because the graph was fine and the send never happened.",
          "You can keep Apollo or Cognism for enrichment and still run Omentir for LinkedIn. That is a stack, not a betrayal. It is a waste only when you buy a second graph to avoid writing the first note."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Is ZoomInfo in this roundup?",
        "answer": "ZoomInfo sits in the same database aisle as Cognism for most buying questions. A separate page would swap the logo and keep the paragraphs. Use Cognism or Apollo matchups, then confirm ZoomInfo packaging on their site if that is the contract you already have."
      },
      {
        "question": "Can Omentir replace our data vendor?",
        "answer": "Only if you did not need the graph. If ops lives in that vendor, keep it. Add Omentir for the LinkedIn motion the export never finished."
      }
    ],
    "relatedLinks": [
      {
        "label": "Apollo alternatives",
        "href": "/comparisons/omentir-vs-apollo",
        "description": "Graph versus live LinkedIn discovery."
      },
      {
        "label": "Sales Navigator vs Apollo",
        "href": "/comparisons/sales-navigator-vs-apollo",
        "description": "Search subscription versus contact graph, plus Omentir."
      },
      {
        "label": "Lead finders",
        "href": "/features/lead-finders",
        "description": "How Omentir builds the list."
      }
    ],
    "ctaTitle": "Open last quarter's export before you renew credits",
    "ctaBody": "If those rows never became threads, run one Omentir ICP on the same buyer."
  },
  {
    "slug": "email-outreach",
    "title": "Email outreach tools",
    "description": "Instantly, Smartlead, and Lemlist scale mailboxes. Omentir scales LinkedIn conversations from your profile. Do not buy one to do the other's job.",
    "summary": "Inbox rotators versus a LinkedIn workspace.",
    "publishedDate": "August 17, 2026",
    "updatedDate": "August 17, 2026",
    "layout": "roundup",
    "keywords": [
      "Instantly alternatives",
      "Smartlead alternatives",
      "Lemlist alternatives",
      "cold email alternatives"
    ],
    "verdict": "Keep the email tool if deliverability and mailbox rotation are the bottleneck. Use Omentir if the missing piece is a LinkedIn list and a thread you can inspect.",
    "roundupItems": [
      {
        "name": "Instantly",
        "bestFor": "Teams that need many inboxes, warmup, and a clean email-first campaign builder.",
        "watchFor": "Better warmup will not rescue a generic list. Volume on a weak promise is faster rejection.",
        "href": "/comparisons/omentir-vs-instantly"
      },
      {
        "name": "Smartlead",
        "bestFor": "Multi-inbox scale with a lead-management story aimed at agencies and higher send volume.",
        "watchFor": "Same aisle as Instantly. Pick on current pricing, UX, and deliverability, not on this paragraph.",
        "href": "/comparisons/omentir-vs-smartlead"
      },
      {
        "name": "Lemlist",
        "bestFor": "Multichannel sequences with creative personalization, email warmup, and a database they sell beside the sender.",
        "watchFor": "If LinkedIn is a step in an email sequence, that is not the same as a LinkedIn workspace with discovery.",
        "href": "/comparisons/omentir-vs-lemlist"
      },
      {
        "name": "Omentir",
        "bestFor": "LinkedIn-first discovery and outreach, including Steal Customers, with MCP operators.",
        "watchFor": "No domain rotation. No lemwarm. If email is the only working channel, solve that first."
      }
    ],
    "sections": [
      {
        "id": "channel-first",
        "heading": "Name the channel before the vendor",
        "paragraphs": [
          "Instantly versus Smartlead is a real search because both sell email infrastructure. Lemlist sits next to them with more multichannel packaging. Omentir is not the fourth inbox rotator. Putting it on an email bake-off creates a page that could swap names and still read true. This roundup exists so you stop doing that."
        ]
      }
    ],
    "faqItems": [
      {
        "question": "Can I run Instantly and Omentir together?",
        "answer": "Yes. Email scale and LinkedIn discovery are compatible. Do not copy the same copy into both and call it multichannel."
      },
      {
        "question": "Is there a Lemlist vs Instantly page?",
        "answer": "Yes. That faceoff is for people already in the email aisle. Omentir shows up as the LinkedIn path, not as a fake third sequencer."
      }
    ],
    "relatedLinks": [
      {
        "label": "Lemlist alternatives",
        "href": "/comparisons/omentir-vs-lemlist",
        "description": "Multichannel email versus LinkedIn workspace."
      },
      {
        "label": "Lemlist vs Instantly",
        "href": "/comparisons/lemlist-vs-instantly",
        "description": "Two email tools, then the LinkedIn split."
      },
      {
        "label": "Instantly alternatives",
        "href": "/comparisons/omentir-vs-instantly",
        "description": "Inbox rotation versus LinkedIn conversations."
      }
    ],
    "ctaTitle": "If the mailbox is fine and the calendar is empty, change channel",
    "ctaBody": "Run LinkedIn on one ICP. Do not buy another warmup pool to avoid writing a specific note."
  },
  {
    "slug": "grok-bot",
    "title": "Grok Bot alternatives for LinkedIn sales",
    "description": "Grok Bot is an overnight operator with a cloud computer. Claude, ChatGPT, Cursor, grok.com chat, and Omentir Overview can do parts of that job. None of them should click Connect on LinkedIn.",
    "summary": "Overnight Bot versus a session you watch versus a workspace with no extra agent.",
    "publishedDate": "August 23, 2026",
    "updatedDate": "August 23, 2026",
    "layout": "roundup",
    "keywords": [
      "Grok Bot alternatives",
      "Grok Bot alternatives for sales",
      "Grok Bot vs ChatGPT LinkedIn",
      "alternatives to Grok Bot outbound"
    ],
    "verdict": "Keep Grok Bot if you already pay for the plan and you want a review list by morning. Use ChatGPT or Claude if you will sit with a session. Use Omentir Overview if you did not need another operator. Put LinkedIn in Omentir either way.",
    "roundupItems": [
      {
        "name": "Grok Bot",
        "bestFor": "People who already have SuperGrok Heavy, Cursor Ultra, or Cursor Teams Premium and want overnight research plus drafts.",
        "watchFor": "Beta product. Shared cloud computer. Do not sign LinkedIn into that computer. Confirm current access on x.ai/bot.",
        "href": "/integrations/grok-bot"
      },
      {
        "name": "Grok",
        "bestFor": "A grok.com chat session with an MCP connector, closer to ChatGPT than to the Bot app.",
        "watchFor": "Work stops when you close the tab. This is not Grok Bot. Use the Grok integration page.",
        "href": "/integrations/grok"
      },
      {
        "name": "ChatGPT",
        "bestFor": "Founders who already live in ChatGPT and want to tighten an ICP, inspect a batch, and rewrite a weak note in one sitting.",
        "watchFor": "No unattended overnight run. Generic drafts if you skip a real trigger. See the ChatGPT integration.",
        "href": "/integrations/chatgpt"
      },
      {
        "name": "Claude",
        "bestFor": "The same conversational MCP path as ChatGPT, if Claude is already where the work happens.",
        "watchFor": "Do not add Claude plus ChatGPT plus Grok Bot on week one. One operator you watch beats three you forget.",
        "href": "/integrations/claude"
      },
      {
        "name": "Cursor",
        "bestFor": "Coding agents and scripts that call Omentir with a Bearer token, including people who already have Cursor Ultra for Grok Bot.",
        "watchFor": "A repo agent is extra surface if you only needed Overview. Grok Bot shares MCP auth with Cursor, so the allowlist has to include the Omentir URL.",
        "href": "/integrations/cursor"
      },
      {
        "name": "Omentir",
        "bestFor": "LinkedIn discovery, drafts, campaigns, and inbox with no extra agent layer. Start here if you do not already pay for Grok Bot.",
        "watchFor": "Not a cloud browser. Not email warmup. You still read the first batch and take the meeting."
      }
    ],
    "sections": [
      {
        "id": "the-job",
        "heading": "Name the job before you shop the Bot",
        "paragraphs": [
          "People search Grok Bot alternatives for two different reasons. Some want overnight research without SuperGrok Heavy. Some tried computer use on LinkedIn and got scared. Those are different purchases. The first group needs a session operator or Overview. The second group needs a paced send path, which Omentir already is.",
          "Grok Bot is not a packaged SDR. Claude and ChatGPT are not overnight VMs. Cursor is a coding agent that can call the same tools. Putting all of them on a feature grid produces a page that could swap logos. This roundup exists so you stop doing that."
        ]
      },
      {
        "id": "linkedin-split",
        "heading": "LinkedIn does not belong on the Bot computer",
        "paragraphs": [
          "Every row above can talk to Omentir over MCP or REST. None of them should hold a LinkedIn password. Grok Bot's extra risk is the shared cloud computer. ChatGPT and Claude do not get that VM. That is why the Bot can look more powerful and still be the wrong LinkedIn client.",
          "If you already have Grok Bot, keep it on research and drafts. Connect Plugins to https://omentir.com/api/agent/v1/mcp. Stop at a review list. The weekly motion is get LinkedIn sales with Grok Bot."
        ]
      },
      {
        "id": "first-job-prompt",
        "heading": "If you already have Grok Bot, paste this",
        "paragraphs": [
          "Finish Omentir first. Add the MCP plugin. Put the stop rule in the Bot description: research and draft only. Never send. Never enroll. Never sign into LinkedIn. Then paste this. Replace the brackets. Keep the last two sentences."
        ],
        "code": GROK_BOT_FIRST_JOB_PROMPT
      }
    ],
    "faqItems": [
      {
        "question": "Is Omentir a Grok Bot alternative?",
        "answer": "Omentir is the LinkedIn workspace. Grok Bot is an operator you can put on top. If you do not have the Bot plan, Overview is the alternative to buying one. If you have the Bot, Omentir is still the send path, not a replacement for the overnight job."
      },
      {
        "question": "Can ChatGPT do overnight outbound like Grok Bot?",
        "answer": "Not as an unattended computer. Close the tab and the work stops. For a review list by morning, you want Grok Bot or you run the batch yourself in a session."
      },
      {
        "question": "Where is OpenClaw?",
        "answer": "A local runtime you have to operate. Useful if you already run it. Extra surface if you only needed a hosted workspace. See the OpenClaw integration, not this roundup."
      }
    ],
    "relatedLinks": [
      {
        "label": "Grok Bot for LinkedIn outreach",
        "href": "/blogs/grok-bot-linkedin-sales",
        "description": "Overnight research, paced send, and why the Bot stays off LinkedIn."
      },
      {
        "label": "Grok Bot vs ChatGPT for outbound",
        "href": "/blogs/grok-bot-vs-chatgpt-for-outbound",
        "description": "Session versus overnight, same send path."
      },
      {
        "label": "Grok Bot integration",
        "href": "/integrations/grok-bot",
        "description": "Plugins, MCP URL, and what not to sign into."
      },
      {
        "label": "Get LinkedIn sales with Grok Bot",
        "href": "/use-cases/grok-bot-outbound",
        "description": "The weekly motion if you already have the Bot."
      }
    ],
    "ctaTitle": "If you do not already pay for Grok Bot, do not buy it to send LinkedIn notes",
    "ctaBody": "Run one Omentir finder from Overview. Add an operator later if you want overnight research on top."
  }
];

export function getAlternative(slug: string) {
  return ALL_ALTERNATIVES.find((page) => page.slug === slug);
}
