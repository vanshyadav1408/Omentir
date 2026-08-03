import Image from "next/image";

/**
 * Directory listing badges. Only the on-dark artwork is fetched — the app has a
 * single dark theme, so the light asset that used to sit alongside it under
 * `dark:hidden` was never painted.
 *
 * Note the two providers name their files by ink colour, not by the background
 * they belong on, and they disagree: directree's "darkmode" file is the one for
 * a dark page, while Backlink Dirs' is "badge-listed-light" (light ink).
 */
const BADGES = [
  {
    href: "https://www.directree.io",
    alt: "Verified on directree",
    width: 200,
    height: 37,
    src: "https://www.directree.io/badge/directree-badge-darkmode.svg",
  },
  {
    href: "https://backlinkdirs.com/item/omentir",
    alt: "Listed on Backlink Dirs",
    width: 170,
    height: 40,
    src: "https://backlinkdirs.com/badges/badge-listed-light.svg",
  },
  {
    href: "https://wired.business",
    alt: "Featured on Wired Business",
    width: 200,
    height: 54,
    src: "https://wired.business/badge0-dark.svg",
  },
  {
    href: "https://twelve.tools",
    alt: "Featured on Twelve Tools",
    width: 200,
    height: 54,
    src: "https://twelve.tools/badge0-dark.svg",
  },
] as const;

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
        {BADGES.map((badge) => (
          <a
            key={badge.href}
            href={badge.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--md-sys-color-surface-container-high)] p-2 ring-1 ring-[var(--md-sys-color-outline-variant)] transition hover:bg-[var(--md-sys-state-hover)]"
          >
            <Image
              src={badge.src}
              alt={badge.alt}
              width={badge.width}
              height={badge.height}
              unoptimized
            />
          </a>
        ))}
      </div>
    </section>
  );
}
