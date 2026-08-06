import Image from "next/image";

/**
 * Customer logos for the landing "used by" wall.
 * Files: public/customer-logos/
 *
 * No under-labels — only the logo assets themselves (wordmarks keep their
 * built-in text; icon marks stay icon-only).
 */
const CUSTOMERS = [
  {
    name: "OutreachPanda",
    href: "https://outreachpanda.com",
    // Icon mark only (not the long wordmark).
    src: "/customer-logos/outreachpanda.svg",
    width: 40,
    height: 40,
  },
  {
    name: "IT-Harvest",
    href: "https://it-harvest.com",
    // Full brand logo (symbol + wordmark).
    src: "/customer-logos/it-harvest.png",
    width: 180,
    height: 60,
  },
  {
    name: "BlockSkunk",
    href: "https://blockskunk.com",
    src: "/customer-logos/blockskunk.svg",
    width: 40,
    height: 40,
  },
  {
    name: "Scalee",
    href: "https://www.scalee.in",
    src: "/customer-logos/scalee.svg",
    width: 40,
    height: 40,
  },
  {
    name: "MarvelX",
    href: "https://marvelx.ai",
    src: "/customer-logos/marvelx.png",
    width: 40,
    height: 40,
  },
  {
    name: "Codi",
    href: "https://codi.com",
    src: "/customer-logos/codi.png",
    width: 40,
    height: 40,
  },
  {
    name: "Nunar",
    href: "https://nunariq.com",
    // Official wordmark (logo + brand text in the asset).
    src: "/customer-logos/nunariq.svg",
    width: 140,
    height: 36,
  },
  {
    name: "VibeDream",
    href: "https://vibedream.ai",
    src: "/customer-logos/vibedream.png",
    width: 40,
    height: 40,
  },
  {
    name: "Dibe Agency",
    href: "https://dibe.agency",
    src: "/customer-logos/dibe-agency.png",
    width: 40,
    height: 40,
  },
] as const;

export default function CustomerLogoWall() {
  return (
    <section
      aria-labelledby="customer-logo-wall-heading"
      className="mx-auto w-full max-w-5xl min-w-0 px-4 py-10 md:px-8 md:py-14"
    >
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--md-sys-color-on-surface-variant)]">
          Customers
        </p>
        <h2
          id="customer-logo-wall-heading"
          className="mt-2 text-base font-semibold tracking-tight text-[var(--md-sys-color-on-surface)] md:text-lg"
        >
          Trusted by fast-growing companies
        </h2>
      </div>

      {/*
        Equal graphic height: every logo is forced to LOGO_H with width:auto.
        Do not clamp max-width on the image — that used to shrink wide wordmarks
        and make their visual height shorter than square marks.
      */}
      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:mt-10 md:gap-x-12 md:gap-y-10">
        {CUSTOMERS.map((customer) => (
          <li key={customer.name} className="shrink-0">
            <a
              href={customer.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${customer.name}`}
              className="inline-flex h-9 items-center justify-center opacity-80 outline-none transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--md-sys-color-primary)] md:h-10"
            >
              <Image
                src={customer.src}
                alt={`${customer.name} logo`}
                width={customer.width}
                height={customer.height}
                unoptimized
                className="block h-9 w-auto max-w-none object-contain object-center md:h-10"
                style={{ height: "100%", width: "auto", maxWidth: "none" }}
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
