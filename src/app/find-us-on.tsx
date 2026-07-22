import Image from "next/image";

/**
 * Directory listing badges. Both light and dark assets are always in the DOM;
 * visibility is toggled with `html.dark` (set by the blocking theme-init script
 * before paint). This avoids React hydration mismatches from client theme state.
 */
const BADGES = [
  {
    href: "https://www.directree.io",
    alt: "Verified on directree",
    width: 200,
    height: 37,
    lightSrc: "https://www.directree.io/badge/directree-badge-lightmode.svg",
    darkSrc: "https://www.directree.io/badge/directree-badge-darkmode.svg",
  },
  {
    href: "https://backlinkdirs.com/item/omentir",
    alt: "Listed on Backlink Dirs",
    width: 170,
    height: 40,
    lightSrc: "https://backlinkdirs.com/badges/badge-listed-dark.svg",
    darkSrc: "https://backlinkdirs.com/badges/badge-listed-light.svg",
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
            className="inline-flex items-center justify-center rounded-lg p-2 ring-1 ring-[var(--md-sys-color-outline-variant)] transition hover:bg-[var(--md-sys-state-hover)] dark:bg-[var(--md-sys-color-surface-container-high)]"
          >
            <Image
              src={badge.lightSrc}
              alt={badge.alt}
              width={badge.width}
              height={badge.height}
              unoptimized
              className="dark:hidden"
            />
            <Image
              src={badge.darkSrc}
              alt=""
              width={badge.width}
              height={badge.height}
              unoptimized
              className="hidden dark:block"
              aria-hidden
            />
          </a>
        ))}
      </div>
    </section>
  );
}
