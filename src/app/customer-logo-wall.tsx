import Image from "next/image";

/**
 * Customer logos for the landing "used by" strip.
 * Files: public/customer-logos/
 *
 * Visual treatment: each mark sits on a dark olive tile with a near-black
 * border. Light treatment so mixed assets read on that fill.
 * OutreachPanda and Dibe Agency get slight optical-size tweaks
 * (thin / small / stacked marks).
 */
const CUSTOMERS = [
  {
    name: "OutreachPanda",
    href: "https://outreachpanda.com",
    src: "/customer-logos/outreachpanda.svg",
    width: 40,
    height: 40,
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
    name: "Dibe Agency",
    href: "https://dibe.agency",
    src: "/customer-logos/dibe-agency.png",
    width: 208,
    height: 166,
    size: "dibe" as const,
  },
] as const;

const LOGO_SIZE = {
  base: "h-8 md:h-9",
  panda: "h-9 md:h-10",
  dibe: "h-10 md:h-11",
} as const;

function LogoLink({ customer }: { customer: (typeof CUSTOMERS)[number] }) {
  const sizeKey =
    "size" in customer && customer.size ? customer.size : ("base" as const);

  return (
    <a
      href={customer.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${customer.name}`}
      className="customer-logo-item inline-flex items-center justify-center outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--md-sys-color-primary)] md:min-w-0"
    >
      <Image
        src={customer.src}
        alt={`${customer.name} logo`}
        width={customer.width}
        height={customer.height}
        unoptimized
        draggable={false}
        className={`customer-logo-img block ${LOGO_SIZE[sizeKey]} w-auto object-contain object-center`}
        style={{ width: "auto", maxWidth: "100%" }}
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
      className="w-full min-w-0 py-10 md:py-14"
    >
      <div className="omentir-primary-width">
        <p
          id={headingId}
          className="text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]"
        >
          Teams using Omentir
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:mt-10 md:flex-nowrap md:justify-between md:gap-2">
          {CUSTOMERS.map((customer) => (
            <LogoLink key={customer.name} customer={customer} />
          ))}
        </div>
      </div>
    </section>
  );
}
