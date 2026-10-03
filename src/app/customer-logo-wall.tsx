import Image from "next/image";
import Reveal from "./scroll-reveal";

/**
 * Customer logos for the landing "used by" strip.
 * Files: public/customer-logos/
 *
 * Shown as a slow marquee of muted marks (see `.cal-logos` in globals.css).
 * The assets are mixed, so each kind gets its own treatment:
 * - ownPlate: the mark sits on its own filled tile; shown in greyscale.
 * - silhouette: one solid colour on transparency (Codi's blue C); drawn in
 *   the page ink so it reads on both themes.
 * - knockout: a white mark on an opaque black square (Dibe); drawn as page
 *   ink through a luminance mask, so only the mark shows.
 * - everything else: a coloured wordmark, shown in greyscale.
 * Hovering a mark brings back its own colours (silhouettes stay ink).
 * OutreachPanda and Dibe Agency get slight optical-size tweaks.
 */
const CUSTOMERS = [
  {
    name: "OutreachPanda",
    href: "https://outreachpanda.com",
    src: "/customer-logos/outreachpanda.svg",
    width: 40,
    height: 40,
    ownPlate: true,
    size: "panda" as const,
  },
  {
    name: "IT-Harvest",
    href: "https://it-harvest.com",
    src: "/customer-logos/it-harvest.webp",
    width: 180,
    height: 60,
  },
  {
    name: "BlockSkunk",
    href: "https://blockskunk.com",
    src: "/customer-logos/blockskunk.svg",
    width: 40,
    height: 40,
    ownPlate: true,
  },
  {
    name: "Scalee",
    href: "https://www.scalee.in",
    src: "/customer-logos/scalee.svg",
    width: 40,
    height: 40,
    ownPlate: true,
  },
  {
    name: "MarvelX",
    href: "https://marvelx.ai",
    src: "/customer-logos/marvelx.webp",
    width: 40,
    height: 40,
    ownPlate: true,
  },
  {
    name: "Codi",
    href: "https://codi.com",
    src: "/customer-logos/codi.webp",
    width: 40,
    height: 40,
    silhouette: true,
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
    src: "/customer-logos/dibe-agency.webp",
    width: 208,
    height: 166,
    knockout: true,
    size: "dibe" as const,
  },
] as const;

const LOGO_SIZE = {
  base: "h-10 md:h-[3.25rem]",
  panda: "h-11 md:h-14",
  dibe: "h-12 md:h-[3.75rem]",
} as const;

function LogoLink({ customer, hidden }: { customer: (typeof CUSTOMERS)[number]; hidden?: boolean }) {
  const sizeKey =
    "size" in customer && customer.size ? customer.size : ("base" as const);

  return (
    <a
      href={customer.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${customer.name}`}
      tabIndex={hidden ? -1 : undefined}
      className="cal-logo-link"
    >
      {"knockout" in customer ? (
        // Page ink masked by the logo's luminance: the white mark shows, the
        // black square drops out, on either theme.
        <span
          role="img"
          aria-label={hidden ? undefined : `${customer.name} logo`}
          className={`cal-logo-img cal-logo-knockout ${LOGO_SIZE[sizeKey]}`}
          style={{
            aspectRatio: `${customer.width} / ${customer.height}`,
            maskImage: `url(${customer.src})`,
            WebkitMaskImage: `url(${customer.src})`,
          }}
        />
      ) : (
        <Image
          src={customer.src}
          alt={hidden ? "" : `${customer.name} logo`}
          width={customer.width}
          height={customer.height}
          unoptimized
          draggable={false}
          data-own-plate={"ownPlate" in customer ? "" : undefined}
          data-silhouette={"silhouette" in customer ? "" : undefined}
          className={`cal-logo-img block ${LOGO_SIZE[sizeKey]} w-auto object-contain object-center`}
          style={{ width: "auto", maxWidth: "none" }}
        />
      )}
    </a>
  );
}

export default function CustomerLogoWall({
  headingId = "customer-logo-wall-heading",
}: {
  headingId?: string;
} = {}) {
  return (
    <section aria-labelledby={headingId} className="cal-logos w-full min-w-0 py-12 md:py-16">
      <p id={headingId} className="cal-logos-label omentir-primary-width">
        Teams using Omentir
      </p>

      <Reveal className="cal-logos-viewport">
        {/* The list is rendered twice so the strip can loop without a seam;
            the second copy is hidden from assistive tech and the tab order. */}
        <div className="cal-logos-track">
          {[false, true].map((hidden) => (
            <ul key={String(hidden)} className="cal-logos-set" aria-hidden={hidden || undefined}>
              {CUSTOMERS.map((customer) => (
                <li key={customer.name}>
                  <LogoLink customer={customer} hidden={hidden} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
