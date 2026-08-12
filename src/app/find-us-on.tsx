import Image from "next/image";

/**
 * Directory listing badges and text links. Only on-dark artwork is used — the
 * app has a single dark theme.
 *
 * Note: some providers name files by ink colour, not by the background they
 * belong on (e.g. Backlink Dirs "badge-listed-light" is light ink for dark UI).
 */
const LISTINGS = [
  {
    href: "https://www.directree.io",
    label: "Verified on directree",
    width: 200,
    height: 37,
    src: "https://www.directree.io/badge/directree-badge-darkmode.svg",
  },
  {
    href: "https://backlinkdirs.com/item/omentir",
    label: "Listed on Backlink Dirs",
    width: 170,
    height: 40,
    src: "https://backlinkdirs.com/badges/badge-listed-light.svg",
  },
  {
    href: "https://wired.business",
    label: "Featured on Wired Business",
    width: 200,
    height: 54,
    src: "https://wired.business/badge0-dark.svg",
  },
  {
    href: "https://twelve.tools",
    label: "Featured on Twelve Tools",
    width: 200,
    height: 54,
    src: "https://twelve.tools/badge0-dark.svg",
  },
  {
    href: "https://goodaitools.com/ai/omentir",
    label: "Good AI Tools",
    width: 200,
    height: 54,
    src: "https://goodaitools.com/assets/images/badge-dark.png",
  },
  {
    href: "https://starterbest.com",
    label: "Featured on Starter Best",
    width: 200,
    height: 54,
    src: "https://starterbest.com/badages-awards.svg",
  },
  {
    href: "https://marketingdb.live",
    label: "Listed on MarketingDB",
    width: 190,
    height: 44,
    src: "https://marketingdb.live/badge.svg",
    rel: "noopener noreferrer nofollow sponsored",
  },
  {
    href: "https://acidtools.com/ai/omentir",
    label: "Acid Tools",
    width: 200,
    height: 54,
    src: "https://acidtools.com/assets/images/badge-dark.png",
  },
  {
    href: "https://saascrawler.com/products/omentir",
    label: "SaaS Crawler",
    width: 200,
    height: 54,
    src: "https://saascrawler.com/assets/images/badge-dark.png",
  },
  {
    href: "https://shinylaunch.com/product/omentir",
    label: "ShinyLaunch",
    width: 200,
    height: 54,
    src: "https://shinylaunch.com/assets/images/badge-dark.png",
  },
  {
    href: "https://huntfortools.com/tool/omentir",
    label: "Hunt for Tools",
    width: 200,
    height: 54,
    src: "https://huntfortools.com/assets/images/badge-dark.png",
  },
  {
    href: "https://launchscroll.com/product/omentir",
    label: "Launch Scroll",
    width: 200,
    height: 54,
    src: "https://launchscroll.com/assets/images/badge-dark.png",
  },
  {
    href: "https://saasroots.com/product/omentir",
    label: "SaaS Roots",
    width: 200,
    height: 54,
    src: "https://saasroots.com/assets/images/badge-dark.png",
  },
  {
    href: "https://daniellaunches.com",
    label: "Featured on DanielLaunches",
    width: 220,
    height: 48,
    src: "https://daniellaunches.com/badge-dark.svg",
  },
  {
    href: "https://lemonlaunch.dev/marketing/omentir",
    label: "Featured on LemonLaunch",
    width: 188,
    height: 56,
    src: "https://lemonlaunch.dev/badge/lemonlaunch-badge-light.svg",
  },
  {
    href: "https://easydofollow.dev/marketing/omentir",
    label: "Featured on EasyDoFollow",
    width: 188,
    height: 56,
    src: "https://easydofollow.dev/badge/easydofollow-badge-dark.svg",
  },
  {
    href: "https://shipboost.io/tools/omentir",
    label: "Featured on ShipBoost",
    width: 244,
    height: 56,
    src: "https://shipboost.io/badge/cmsps0nqu0001mw0to4tp6yky?theme=dark",
  },
  {
    href: "https://saasfame.com/item/omentir",
    label: "Featured on saasfame.com",
    width: 200,
    height: 54,
    src: "https://saasfame.com/badge-dark.svg",
  },
  {
    href: "https://nicklaunches.com/products/omentir/?utm_source=omentir.com&utm_medium=badge&utm_campaign=featured",
    label: "Omentir on Nick Launches",
    width: 244,
    height: 56,
    src: "https://nicklaunches.com/badges/featured-dark.png",
  },
  {
    href: "https://listmysaas.xyz/",
    label: "Featured on ListMySaaS",
    width: 125,
    height: 44,
    src: "https://listmysaas.xyz/listmysaasbadgenormal.svg",
  },
  {
    href: "https://kittylaunch.com/p/omentir-ai-outreach",
    label: "Omentir AI Outreach on KittyLaunch",
    width: 280,
    height: 56,
    src: "https://kittylaunch.com/api/public/badges/launch_badge.svg?theme=dark&name=Omentir%20AI%20Outreach",
  },
  {
    href: "https://dododirectory.com",
    label: "Featured on DodoDirectory",
    width: 200,
    height: 54,
    src: "https://dododirectory.com/badge-light.png",
  },
  {
    href: "https://saasbison.com",
    label: "Featured on SaaSBison",
    width: 200,
    height: 54,
    src: "https://saasbison.com/badge.png",
  },
  {
    href: "https://launchstreak.dev/saas/omentir",
    label: "Launched on Launch Streak",
    width: 248,
    height: 68,
    src: "https://launchstreak.dev/badge/launch-streak-badge-dark.svg",
  },
  {
    href: "https://startupbase.io/products/omentir?utm_source=startupbase&utm_medium=badge&utm_campaign=launch-badge-dark",
    label: "Launched on StartupBase",
    width: 200,
    height: 55,
    src: "https://statics.startupbase.io/site/badges/launched-on-sb-dark.svg",
  },
  {
    href: "https://www.listbulb.com/tools/omentir",
    label: "Featured on ListBulb",
    width: 200,
    height: 54,
    src: "https://www.listbulb.com/featured-on-listbulb-dark.svg",
  },
  {
    href: "https://sumodir.com",
    label: "Featured on SumoDir",
    width: 200,
    height: 54,
    src: "https://sumodir.com/badge.png",
  },
  {
    href: "https://saascity.io",
    label: "Featured on SaaSCity",
    width: 150,
    height: 54,
    src: "https://saascity.io/badges/featured-dark.svg",
  },
  {
    href: "https://launch-list.org/product/omentir",
    label: "Launch List Badge",
    width: 200,
    height: 50,
    src: "https://launch-list.org/badges/svg/launch_list_badge_live.svg",
  },
  {
    href: "https://buildrship.xyz/product/omentir",
    label: "Featured on Buildrship",
    width: 130,
    height: 46,
    src: "https://buildrship.xyz/assets/featured-on-buildrship.png",
  },
  {
    href: "https://fazier.com/launches/omentir.com",
    label: "Fazier badge",
    width: 120,
    height: 54,
    src: "https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=dark",
  },
  {
    href: "https://launchleague.xyz/?product=omentir",
    label: "LaunchLeague Badge",
    width: 300,
    height: 66,
    src: "https://cdn.launchleague.xyz/site-images/badges/badge-dark.svg",
  },
  {
    href: "https://indieai.directory/",
    label: "Listed on IndieAI Directory",
    src: null,
  },
] as const;

function ListingLink({ listing }: { listing: (typeof LISTINGS)[number] }) {
  return (
    <a
      href={listing.href}
      target="_blank"
      rel={"rel" in listing && listing.rel ? listing.rel : "noopener noreferrer"}
      className="inline-flex shrink-0 items-center whitespace-nowrap text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] opacity-90 transition hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md-sys-color-primary)]"
    >
      {listing.src ? (
        <Image
          src={listing.src}
          alt={listing.label}
          width={listing.width}
          height={listing.height}
          unoptimized
          draggable={false}
          style={{ height: listing.height, width: "auto", maxHeight: 54 }}
        />
      ) : (
        listing.label
      )}
    </a>
  );
}

export default function FindUsOn() {
  // Duplicate the row so the translate loop can wrap without a jump.
  const track = [...LISTINGS, ...LISTINGS];

  return (
    <section aria-labelledby="find-us-on" className="py-6 text-center">
      <h2
        id="find-us-on"
        className="px-4 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)]"
      >
        Find us on
      </h2>
      {/* Inset on larger screens so the strip does not run edge-to-edge. */}
      <div className="mx-auto mt-4 w-full max-w-4xl px-6 md:max-w-5xl md:px-10 lg:max-w-5xl lg:px-16">
        <div className="find-us-marquee relative overflow-hidden">
          <div className="find-us-marquee-track flex w-max flex-nowrap items-center gap-10 px-6">
            {track.map((listing, index) => (
              <ListingLink key={`${listing.href}-${index}`} listing={listing} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
