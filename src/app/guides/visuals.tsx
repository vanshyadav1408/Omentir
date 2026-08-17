import type { ReactNode } from "react";

export type VisualKind =
  | "jobs-four"
  | "cloud-extension-api"
  | "find-send-scrape"
  | "invite-wait-message"
  | "page-ads-dm"
  | "inmail-invite-dm"
  | "csv-filter-comment"
  | "official-api"
  | "cloud-seats"
  | "drip-steps"
  | "n8n-nodes"
  | "workflow-path"
  | "profile-blocks"
  | "news-vs-rumor"
  | "committee"
  | "b2b-vs-b2c"
  | "strategy-plan"
  | "attribution"
  | "data-decay"
  | "crm-vs-file"
  | "inbound-outbound-partner"
  | "nurture-score-route"
  | "tool-map"
  | "hire-vs-do"
  | "content-vs-product"
  | "video-places"
  | "paid-funnel"
  | "experiment-loop"
  | "event-types"
  | "plg-vs-sales"
  | "three-linkedin-jobs"
  | "email-nurture-vs-cold"
  | "intent-pages"
  | "digital-mix"
  | "online-path"
  | "gdpr-uk"
  | "permission-list-send"
  | "campaign-anatomy"
  | "free-limits"
  | "owned-paid-earned"
  | "esp-window"
  | "stack-four"
  | "video-in-inbox"
  | "welcome-abandon-nurture"
  | "suite-overlap"
  | "roles-row"
  | "dark-mode-mail"
  | "hygiene"
  | "calendar-segments"
  | "mail-vs-post"
  | "hub-modules"
  | "first-program"
  | "crm-vs-esp"
  | "one-hour-week"
  | "template-skeleton"
  | "creator-vs-analyst"
  | "browse-abandon-order"
  | "draft-then-send"
  | "rented-feed"
  | "qa-calendar"
  | "consent-chain"
  | "bundle-two-contracts";

function Frame({
  caption,
  children,
}: {
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className="my-8 overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-white">
      <div className="p-5 sm:p-6">{children}</div>
      <figcaption className="border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-5 py-3 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
        {caption}
      </figcaption>
    </figure>
  );
}

function Card({
  title,
  detail,
  tone = "cream",
}: {
  title: string;
  detail: string;
  tone?: "cream" | "teal" | "navy" | "gold" | "ink";
}) {
  const bg =
    tone === "teal"
      ? "bg-[#0f766e] text-white"
      : tone === "navy"
        ? "bg-[#1e3a5f] text-white"
        : tone === "gold"
          ? "bg-[#fde68a] text-[#161616]"
          : tone === "ink"
            ? "bg-[#161616] text-white"
            : "bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]";
  return (
    <div className={`rounded-xl px-3 py-3 ${bg}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className={`mt-1 text-xs leading-5 ${tone === "cream" || tone === "gold" ? "opacity-80" : "opacity-90"}`}>
        {detail}
      </p>
    </div>
  );
}

function Arrow() {
  return (
    <p className="py-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--md-sys-color-on-surface-variant)]">
      then
    </p>
  );
}

export function GuideVisual({ kind, caption }: { kind: VisualKind; caption: string }) {
  switch (kind) {
    case "jobs-four":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="navy" title="Invites" detail="Connection requests from a person" />
            <Card tone="teal" title="DMs" detail="Messages after accept, or InMail" />
            <Card tone="gold" title="Scrape" detail="Export search or a profile list" />
            <Card title="Ads" detail="Campaign Manager. Different budget, different owner." />
          </div>
        </Frame>
      );
    case "cloud-extension-api":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="Extension" detail="Clicks in the browser you already use" />
            <Card tone="teal" title="Cloud" detail="A vendor session, often many seats" />
            <Card tone="navy" title="Official API" detail="Partner or ads/page scopes only" />
          </div>
        </Frame>
      );
    case "find-send-scrape":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card tone="teal" title="Find" detail="ICP, filters, or commenters into a group" />
            <Card tone="navy" title="Send" detail="Invites and follow-ups from a profile" />
            <Card tone="gold" title="Scrape" detail="One-off export. Not a conversation." />
          </div>
        </Frame>
      );
    case "invite-wait-message":
      return (
        <Frame caption={caption}>
          <Card tone="navy" title="1. Invite" detail="Short note or none" />
          <Arrow />
          <Card title="2. Wait for accept" detail="Do not pile a pitch into the invite box" />
          <Arrow />
          <Card tone="teal" title="3. Message, then stop on reply" detail="One follow-up if they stay silent" />
        </Frame>
      );
    case "page-ads-dm":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="Company Page" detail="Posts, comments, employee shares" />
            <Card tone="gold" title="Ads" detail="Campaign Manager and lead forms" />
            <Card tone="navy" title="1:1 outbound" detail="A person's profile and inbox" />
          </div>
        </Frame>
      );
    case "inmail-invite-dm":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card tone="gold" title="Invite note" detail="Tiny. They have not accepted." />
            <Card tone="teal" title="DM after accept" detail="They opened a thread" />
            <Card tone="navy" title="InMail" detail="Paid credit. Not a handshake." />
          </div>
        </Frame>
      );
    case "csv-filter-comment":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="CSV" detail="A list you already had" />
            <Card tone="navy" title="Filters" detail="Title, geo, headcount. A query." />
            <Card tone="teal" title="Commenters" detail="A reason to write this week" />
          </div>
        </Frame>
      );
    case "official-api":
      return (
        <Frame caption={caption}>
          <Card tone="navy" title="Documented" detail="Ads, Pages, Sign In, partner Sales Navigator" />
          <Arrow />
          <Card tone="gold" title="Not in the docs" detail="Bulk invites and DMs from a member profile" />
        </Frame>
      );
    case "cloud-seats":
      return (
        <Frame caption={caption}>
          <div className="grid grid-cols-3 gap-2">
            <Card tone="navy" title="Seat A" detail="Sender" />
            <Card tone="navy" title="Seat B" detail="Sender" />
            <Card tone="navy" title="Seat C" detail="Sender" />
          </div>
          <Arrow />
          <Card title="Shared cloud inbox" detail="You still bring the list unless the product finds it" />
        </Frame>
      );
    case "drip-steps":
      return (
        <Frame caption={caption}>
          <div className="flex flex-wrap gap-2">
            {["Connect", "Wait", "Note", "Wait", "Follow-up"].map((step, i) => (
              <span
                key={step + i}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${i % 2 ? "bg-[#fde68a]" : "bg-[#0f766e] text-white"}`}
              >
                {step}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            A drip is a delay plus a next line. It is not a new market.
          </p>
        </Frame>
      );
    case "n8n-nodes":
      return (
        <Frame caption={caption}>
          <Card tone="gold" title="Trigger" detail="Webhook, schedule, or app event" />
          <Arrow />
          <Card title="Transform" detail="Code or a node that reshapes the payload" />
          <Arrow />
          <Card tone="teal" title="Write" detail="CRM, Slack, sheet, or HTTP" />
        </Frame>
      );
    case "workflow-path":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-4">
            <Card title="Trigger" detail="Form, status, clock" />
            <Card tone="teal" title="Happy path" detail="The tenth Closed Won" />
            <Card tone="gold" title="Failure" detail="API down, bad payload" />
            <Card tone="navy" title="Exception" detail="Legal still reads this" />
          </div>
        </Frame>
      );
    case "profile-blocks":
      return (
        <Frame caption={caption}>
          <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-[#1e3a5f]" />
              <div>
                <p className="font-semibold">Your name</p>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Headline that names the buyer and the result</p>
              </div>
            </div>
            <div className="mt-4 h-16 rounded-lg bg-[#fde68a]/80" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)]">About</p>
            <div className="mt-1 h-2 w-full rounded bg-[var(--md-sys-color-outline-variant)]" />
            <div className="mt-1 h-2 w-2/3 rounded bg-[var(--md-sys-color-outline-variant)]" />
          </div>
        </Frame>
      );
    case "news-vs-rumor":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="teal" title="First party" detail="Help Center, official blog, in-product notes" />
            <Card tone="gold" title="Rumor mill" detail="Algorithm Twitter. Change copy when replies drop, not when a creator needs a hook." />
          </div>
        </Frame>
      );
    case "committee":
      return (
        <Frame caption={caption}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card title="User" detail="Lives in the tool" />
            <Card tone="navy" title="Champion" detail="Sells it inside" />
            <Card tone="gold" title="Economic" detail="Signs" />
            <Card tone="teal" title="Security" detail="Can stop it" />
          </div>
        </Frame>
      );
    case "b2b-vs-b2c":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="navy" title="B2B" detail="Committee, cycle, invoice, demo" />
            <Card title="B2C" detail="One shopper, a cart, a card" />
          </div>
        </Frame>
      );
    case "strategy-plan":
      return (
        <Frame caption={caption}>
          <Card tone="navy" title="Strategy" detail="Who, why you win, which motion" />
          <Arrow />
          <Card tone="teal" title="Plan" detail="Owners, budget, dates, what ships this quarter" />
        </Frame>
      );
    case "attribution":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="First touch" detail="Gets credit for the intro" />
            <Card tone="gold" title="Last touch" detail="Gets credit for the form" />
            <Card tone="teal" title="Reality" detail="A demo plus three emails plus a peer" />
          </div>
        </Frame>
      );
    case "data-decay":
      return (
        <Frame caption={caption}>
          <div className="flex h-28 items-end gap-2">
            {[88, 72, 58, 41, 28].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-lg bg-[#0f766e]" style={{ height: `${h}%`, opacity: 1 - i * 0.12 }} />
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">Titles and emails rot. A bought file is a photograph, not a live list.</p>
        </Frame>
      );
    case "crm-vs-file":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="navy" title="CRM / warehouse" detail="Your activity, your deals, your consent" />
            <Card tone="gold" title="Vendor file" detail="Credits, then a CSV that starts decaying" />
          </div>
        </Frame>
      );
    case "inbound-outbound-partner":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="Inbound" detail="They came to you" />
            <Card tone="navy" title="Outbound" detail="You started the thread" />
            <Card tone="teal" title="Partner" detail="Someone else introduced you" />
          </div>
        </Frame>
      );
    case "nurture-score-route":
      return (
        <Frame caption={caption}>
          <Card title="Score" detail="Fit plus behavior. A review order, not a send trigger." />
          <Arrow />
          <Card tone="gold" title="Nurture" detail="Useful mail until they are ready" />
          <Arrow />
          <Card tone="teal" title="Route" detail="A named owner in the CRM" />
        </Frame>
      );
    case "tool-map":
      return (
        <Frame caption={caption}>
          <div className="grid grid-cols-2 gap-3">
            <Card title="CRM" detail="People and deals" />
            <Card tone="navy" title="MAP / ESP" detail="Programs and send" />
            <Card tone="gold" title="Data" detail="Enrichment and intent" />
            <Card tone="teal" title="Content" detail="CMS, docs, comparison pages" />
          </div>
        </Frame>
      );
    case "hire-vs-do":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="teal" title="Hire" detail="You need a motion you do not staff" />
            <Card title="Keep" detail="Offer, ICP, and the inbox stay yours" />
          </div>
        </Frame>
      );
    case "content-vs-product":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="navy" title="Editorial" detail="A peer would quote it without your SKU" />
            <Card tone="teal" title="Product" detail="A rep would paste it after a demo" />
          </div>
        </Frame>
      );
    case "video-places":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="YouTube" detail="Search and long demos" />
            <Card tone="navy" title="LinkedIn native" detail="Feed, short, in-network" />
            <Card tone="gold" title="Site embed" detail="Product tours you own" />
          </div>
        </Frame>
      );
    case "paid-funnel":
      return (
        <Frame caption={caption}>
          <Card tone="gold" title="Click" detail="Search or paid social" />
          <Arrow />
          <Card title="Landing" detail="One promise" />
          <Arrow />
          <Card tone="teal" title="Conversation" detail="A reply, a form, or a booked slot" />
        </Frame>
      );
    case "experiment-loop":
      return (
        <Frame caption={caption}>
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
            {["Guess", "Ship", "Measure", "Keep or kill"].map((label) => (
              <div key={label} className="rounded-xl bg-[var(--md-sys-color-surface-container-low)] px-2 py-4">
                {label}
              </div>
            ))}
          </div>
        </Frame>
      );
    case "event-types":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="Webinar" detail="Cheap to run, easy to fake attendance" />
            <Card tone="navy" title="Dinner" detail="Small room, real talk" />
            <Card tone="gold" title="Booth" detail="Badge scans are not pipeline" />
          </div>
        </Frame>
      );
    case "plg-vs-sales":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="teal" title="Product-led" detail="Trial, activation, expand" />
            <Card tone="navy" title="Sales-led" detail="Demo, security review, paper" />
          </div>
        </Frame>
      );
    case "three-linkedin-jobs":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="Organic" detail="Posts and comments as a person or Page" />
            <Card tone="gold" title="Ads" detail="Paid reach and lead forms" />
            <Card tone="navy" title="1:1" detail="Invites and threads" />
          </div>
        </Frame>
      );
    case "email-nurture-vs-cold":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="teal" title="Nurture" detail="They opted in. You report unsubscribes." />
            <Card tone="gold" title="Cold" detail="You found them. Domain reputation is the product." />
          </div>
        </Frame>
      );
    case "intent-pages":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="Learn" detail="What the problem is" />
            <Card tone="navy" title="Compare" detail="Us versus a named other" />
            <Card tone="teal" title="Buy" detail="Pricing, security, setup" />
          </div>
        </Frame>
      );
    case "digital-mix":
      return (
        <Frame caption={caption}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card title="Search" detail="SEO and ads" />
            <Card tone="navy" title="Email" detail="Owned list" />
            <Card tone="gold" title="Social" detail="Rented feed" />
            <Card tone="teal" title="Web" detail="Pages you control" />
          </div>
        </Frame>
      );
    case "online-path":
      return (
        <Frame caption={caption}>
          <Card title="Search" detail="They type the problem" />
          <Arrow />
          <Card tone="navy" title="Your site" detail="Proof, pricing, a way to talk" />
          <Arrow />
          <Card tone="teal" title="Remote buy" detail="No plant visit required" />
        </Frame>
      );
    case "gdpr-uk":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="navy" title="UK GDPR" detail="Lawful basis, PECR for email, ICO as the regulator" />
            <Card title="The work" detail="Consent records travel with the list if you change agencies" />
          </div>
        </Frame>
      );
    case "permission-list-send":
      return (
        <Frame caption={caption}>
          <Card tone="teal" title="Permission" detail="They asked for mail, or you have a lawful basis" />
          <Arrow />
          <Card title="List" detail="A named audience, not a scraped dump" />
          <Arrow />
          <Card tone="navy" title="Send" detail="Authenticated mail, a way out" />
        </Frame>
      );
    case "campaign-anatomy":
      return (
        <Frame caption={caption}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card title="From" detail="A person they know" />
            <Card tone="navy" title="Subject" detail="One claim" />
            <Card tone="gold" title="Body" detail="One ask" />
            <Card tone="teal" title="Test" detail="You clicked it first" />
          </div>
        </Frame>
      );
    case "free-limits":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="gold" title="Free tier" detail="Caps on contacts, sends, or branding" />
            <Card tone="teal" title="Outgrow signal" detail="You hit the cap or need auth and a real footer" />
          </div>
        </Frame>
      );
    case "owned-paid-earned":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card tone="teal" title="Owned" detail="Site, list, product" />
            <Card tone="gold" title="Paid" detail="Ads you can turn off" />
            <Card title="Earned" detail="A mention you do not control" />
          </div>
        </Frame>
      );
    case "esp-window":
      return (
        <Frame caption={caption}>
          <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)]">ESP</p>
            <p className="mt-2 font-semibold">Audience · Template · Send</p>
            <div className="mt-3 h-20 rounded-lg bg-[var(--md-sys-color-surface-container-low)]" />
            <p className="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">One product. Auth, unsubscribes, bounces live here.</p>
          </div>
        </Frame>
      );
    case "stack-four":
      return (
        <Frame caption={caption}>
          <div className="grid grid-cols-2 gap-3">
            <Card title="Capture" detail="Forms, checkout, events" />
            <Card tone="navy" title="Send" detail="ESP" />
            <Card tone="gold" title="Auth" detail="SPF, DKIM, DMARC" />
            <Card tone="teal" title="Measure" detail="Replies and revenue, not only opens" />
          </div>
        </Frame>
      );
    case "video-in-inbox":
      return (
        <Frame caption={caption}>
          <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] p-4">
            <p className="text-sm font-semibold">Most clients will not play a file</p>
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-[var(--md-sys-color-surface-container-low)] p-3">
              <div className="grid h-14 w-20 place-items-center rounded bg-[#1e3a5f] text-xs font-bold text-white">
                Play
              </div>
              <p className="text-sm">A thumbnail plus a link beats an attachment.</p>
            </div>
          </div>
        </Frame>
      );
    case "welcome-abandon-nurture":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card tone="teal" title="Welcome" detail="They just opted in" />
            <Card tone="gold" title="Abandon" detail="They left a cart or a form" />
            <Card tone="navy" title="Nurture" detail="Still interested, not ready" />
          </div>
        </Frame>
      );
    case "suite-overlap":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="CRM" detail="Deals" />
            <Card tone="navy" title="CMS" detail="Pages" />
            <Card tone="teal" title="Email" detail="Sends" />
          </div>
          <p className="mt-3 text-sm text-[var(--md-sys-color-on-surface-variant)]">A platform is one login covering more than send. An ESP is send.</p>
        </Frame>
      );
    case "roles-row":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="Specialist" detail="Builds and sends" />
            <Card tone="navy" title="Manager" detail="Calendar, vendors, QA" />
            <Card tone="teal" title="Lifecycle" detail="Flows across the product" />
          </div>
        </Frame>
      );
    case "dark-mode-mail":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-4 ring-1 ring-[var(--md-sys-color-outline-variant)]">
              <p className="text-xs font-semibold">Light</p>
              <div className="mt-2 h-10 rounded bg-[#eef1f0]" />
            </div>
            <div className="rounded-xl bg-[#161616] p-4 text-white">
              <p className="text-xs font-semibold">Dark</p>
              <div className="mt-2 h-10 rounded bg-[#2a2a2a]" />
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--md-sys-color-on-surface-variant)]">Transparent PNGs and pale grey text fail here.</p>
        </Frame>
      );
    case "hygiene":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card tone="teal" title="Consent" detail="A record you can show" />
            <Card title="Bounces" detail="Remove hard fails" />
            <Card tone="gold" title="Frequency" detail="A cap you honor" />
          </div>
        </Frame>
      );
    case "calendar-segments":
      return (
        <Frame caption={caption}>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div
                key={d + i}
                className={`rounded-md py-3 ${i === 1 || i === 3 ? "bg-[#0f766e] text-white" : "bg-[var(--md-sys-color-surface-container-low)]"}`}
              >
                {d}
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-[var(--md-sys-color-on-surface-variant)]">Two sends a week, two segments, not a daily blast to everyone.</p>
        </Frame>
      );
    case "mail-vs-post":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="navy" title="Direct mail" detail="Paper, postage, a physical address" />
            <Card tone="teal" title="Email" detail="A mailbox, authentication, unsubscribe" />
          </div>
        </Frame>
      );
    case "hub-modules":
      return (
        <Frame caption={caption}>
          <div className="grid grid-cols-2 gap-3">
            <Card tone="navy" title="CRM" detail="Contacts and deals" />
            <Card title="Marketing" detail="Forms, email, ads" />
            <Card tone="gold" title="CMS" detail="The site" />
            <Card tone="teal" title="Service" detail="Tickets" />
          </div>
        </Frame>
      );
    case "first-program":
      return (
        <Frame caption={caption}>
          <Card title="1. One audience" detail="People who asked" />
          <Arrow />
          <Card tone="navy" title="2. One ESP" detail="Auth set before volume" />
          <Arrow />
          <Card tone="teal" title="3. Welcome plus a useful note" detail="Then a calendar, not a blast" />
        </Frame>
      );
    case "crm-vs-esp":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="navy" title="CRM send" detail="Fine for a sales follow-up to 12 people" />
            <Card tone="teal" title="ESP send" detail="Bulk, auth, unsub, bounce handling" />
          </div>
        </Frame>
      );
    case "one-hour-week":
      return (
        <Frame caption={caption}>
          <div className="grid grid-cols-3 gap-3">
            <Card title="30 min" detail="Write" />
            <Card tone="gold" title="15 min" detail="Test every link" />
            <Card tone="teal" title="15 min" detail="Bounces and replies" />
          </div>
        </Frame>
      );
    case "template-skeleton":
      return (
        <Frame caption={caption}>
          <div className="mx-auto max-w-xs rounded-xl border border-[var(--md-sys-color-outline-variant)] p-4">
            <div className="h-3 w-24 rounded bg-[#1e3a5f]" />
            <div className="mt-3 h-24 rounded-lg bg-[var(--md-sys-color-surface-container-low)]" />
            <div className="mt-3 h-2 w-full rounded bg-[var(--md-sys-color-outline-variant)]" />
            <div className="mt-1 h-2 w-2/3 rounded bg-[var(--md-sys-color-outline-variant)]" />
            <p className="mt-3 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Footer: address, unsubscribe</p>
          </div>
        </Frame>
      );
    case "creator-vs-analyst":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card title="Consumer creator" detail="Reach, disclosure, a code" />
            <Card tone="navy" title="B2B practitioner" detail="A named operator your buyers already read" />
          </div>
        </Frame>
      );
    case "browse-abandon-order":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="Browse" detail="They looked" />
            <Card tone="gold" title="Abandon" detail="They almost bought" />
            <Card tone="teal" title="Post-purchase" detail="They paid. Do not pitch. Help." />
          </div>
        </Frame>
      );
    case "draft-then-send":
      return (
        <Frame caption={caption}>
          <Card tone="gold" title="Draft" detail="A model proposes a subject and a body" />
          <Arrow />
          <Card tone="navy" title="Human" detail="Facts, claims, audience" />
          <Arrow />
          <Card tone="teal" title="Send" detail="After a real inbox test" />
        </Frame>
      );
    case "rented-feed":
      return (
        <Frame caption={caption}>
          <Card title="Feed you do not own" detail="Ranking can hide the link tomorrow" />
          <Arrow />
          <Card tone="teal" title="Address you do own" detail="Email, SMS, or a logged-in user" />
        </Frame>
      );
    case "qa-calendar":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="navy" title="Calendar" detail="Who sends, when, to whom" />
            <Card tone="gold" title="Brakes" detail="A named approver and a rollback" />
          </div>
        </Frame>
      );
    case "consent-chain":
      return (
        <Frame caption={caption}>
          <div className="grid gap-2 sm:grid-cols-5">
            {["Capture", "Consent", "ESP", "CRM", "Analytics"].map((label, i) => (
              <div
                key={label}
                className={`rounded-xl px-2 py-4 text-center text-xs font-semibold ${i === 1 || i === 2 ? "bg-[#0f766e] text-white" : "bg-[var(--md-sys-color-surface-container-low)]"}`}
              >
                {label}
              </div>
            ))}
          </div>
        </Frame>
      );
    case "bundle-two-contracts":
      return (
        <Frame caption={caption}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="navy" title="Product" detail="The ESP or suite you can keep" />
            <Card tone="gold" title="Service" detail="People who build campaigns" />
          </div>
        </Frame>
      );
    default:
      return null;
  }
}

export function GuideTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <figure className="my-8 overflow-x-auto rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-white">
      <table className="w-full min-w-[28rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-[var(--md-sys-color-surface-container-low)]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-[var(--md-sys-color-outline-variant)]">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 align-top leading-6 text-[var(--md-sys-color-on-surface-variant)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="border-t border-[var(--md-sys-color-outline-variant)] px-4 py-3 text-sm text-[var(--md-sys-color-on-surface-variant)]">
        {caption}
      </figcaption>
    </figure>
  );
}
