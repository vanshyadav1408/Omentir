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
      <div className="find-us-marquee mt-4 overflow-hidden">
        <div className="find-us-marquee-track flex w-max flex-nowrap items-center gap-10 px-6">
          {track.map((listing, index) => (
            <ListingLink key={`${listing.href}-${index}`} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}
