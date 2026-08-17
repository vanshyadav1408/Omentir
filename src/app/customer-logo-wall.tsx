import Image from "next/image";

/**
 * Customer logos for the landing "used by" wall.
 * Files: public/customer-logos/
 *
 * Visual treatment: one quiet horizontal row, monochrome by default so mixed
 * brand colors do not clash on the dark canvas, full color on hover.
 *
 * Sizing: base graphic height is +20% over the previous h-8/md:h-9.
 * VibeDream gets an extra +20% on top of that (thin mark).
 */
const CUSTOMERS = [
  {
    name: "OutreachPanda",
    href: "https://outreachpanda.com",
    src: "/customer-logos/outreachpanda.svg",
    width: 40,
    height: 40,
    // Slightly small mark — +7% over the shared base height.
    size: "panda" as const,
  },
  {
    name: "IT-Harvest",
    href: "https://it-harvest.com",
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
    // Thin mark — +20% before the shared +20% bump → 1.44× original.
    size: "vibe" as const,
  },
  {
    name: "Dibe Agency",
    href: "https://dibe.agency",
    src: "/customer-logos/dibe-agency.png",
    width: 40,
    height: 40,
  },
] as const;

/** Base +20% wall size; optional per-brand tweaks. */
const LOGO_SIZE = {
  base: { box: "h-[2.4rem] md:h-[2.7rem]", img: "h-[2.4rem] md:h-[2.7rem]" },
  // OutreachPanda +7% over base.
  panda: { box: "h-[2.57rem] md:h-[2.89rem]", img: "h-[2.57rem] md:h-[2.89rem]" },
  // VibeDream +20% over base (thin mark).
  vibe: { box: "h-[2.88rem] md:h-[3.24rem]", img: "h-[2.88rem] md:h-[3.24rem]" },
} as const;

function LogoLink({ customer }: { customer: (typeof CUSTOMERS)[number] }) {
  const sizeKey =
    "size" in customer && customer.size ? customer.size : ("base" as const);
  const size = LOGO_SIZE[sizeKey];

  return (
    <a
      href={customer.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${customer.name}`}
      className={`customer-logo-item inline-flex ${size.box} shrink-0 items-center justify-center outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--md-sys-color-primary)]`}
    >
      <Image
        src={customer.src}
        alt={`${customer.name} logo`}
        width={customer.width}
        height={customer.height}
        unoptimized
        draggable={false}
        className={`customer-logo-img block ${size.img} w-auto max-w-none object-contain object-center`}
        style={{ width: "auto", maxWidth: "none" }}
      />
    </a>
  );
}

export default function CustomerLogoWall({
  headingId = "customer-logo-wall-heading",
}: {
  headingId?: string;
} = {}) {
  return (
    <section
      aria-labelledby={headingId}
      className="w-full min-w-0 py-8 md:py-12"
    >
      <p
        id={headingId}
        className="px-4 text-center text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--md-sys-color-on-surface-variant)] md:text-xs"
      >
        Teams using Omentir
      </p>

      {/* Inset on larger screens so the strip does not run edge-to-edge. */}
      <div className="mx-auto mt-6 w-full max-w-4xl px-6 md:mt-8 md:max-w-5xl md:px-10 lg:max-w-5xl lg:px-16">
        <div className="customer-logo-marquee relative">
          <div className="customer-logo-marquee-track flex w-max flex-nowrap items-center">
            {[0, 1].map((copyIndex) => (
              <div
                key={copyIndex}
                className="flex shrink-0 items-center gap-14 pl-4 pr-14 md:gap-20 md:pl-6 md:pr-20"
              >
                {CUSTOMERS.map((customer) => (
                  <LogoLink
                    key={`${customer.name}-${copyIndex}`}
                    customer={customer}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
