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
    href: "https://indieai.directory/",
    label: "Listed on IndieAI Directory",
    src: null,
  },
] as const;

const cardClassName =
  "inline-flex items-center justify-center rounded-lg bg-[var(--md-sys-color-surface-container-high)] p-2 ring-1 ring-[var(--md-sys-color-outline-variant)] transition hover:bg-[var(--md-sys-state-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md-sys-color-primary)]";

export default function FindUsOn() {
  return (
    <section aria-labelledby="find-us-on" className="px-4 py-6 text-center">
      <h2
        id="find-us-on"
        className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)]"
      >
        Find us on
      </h2>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
        {LISTINGS.map((listing) => (
          <a
            key={listing.href}
            href={listing.href}
            target="_blank"
            rel="noopener noreferrer"
            className={
              listing.src
                ? cardClassName
                : `${cardClassName} px-3 py-2 text-sm font-medium text-[var(--md-sys-color-on-surface)]`
            }
          >
            {listing.src ? (
              <Image
                src={listing.src}
                alt={listing.label}
                width={listing.width}
                height={listing.height}
                unoptimized
                style={{ height: listing.height, width: "auto" }}
              />
            ) : (
              listing.label
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
