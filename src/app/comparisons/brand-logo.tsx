import LogoMark from "../logo-mark";
import {
  comparisonBrandFromName,
  OMENTIR_BRAND,
  type ComparisonBrand,
} from "./comparison-logos";

const SIZE_CLASS = {
  sm: "h-6 w-6 rounded-md",
  md: "h-10 w-10 rounded-xl",
  lg: "h-14 w-14 rounded-2xl sm:h-16 sm:w-16",
} as const;

type BrandLogoProps = {
  brand: ComparisonBrand | string;
  size?: keyof typeof SIZE_CLASS;
  decorative?: boolean;
  framed?: boolean;
};

export function BrandLogo({
  brand,
  size = "md",
  decorative = true,
  framed = true,
}: BrandLogoProps) {
  const resolved =
    typeof brand === "string"
      ? comparisonBrandFromName(brand)
      : brand;

  if (!resolved) return null;

  const isOmentir = resolved.id === OMENTIR_BRAND.id;
  const pad = !resolved.bleed && !isOmentir;
  const mark = isOmentir ? (
    <LogoMark className="h-full w-full text-[var(--md-sys-color-on-surface)]" />
  ) : (
    <picture className="contents">
      {resolved.darkSrc ? (
        <source media="(prefers-color-scheme: dark)" srcSet={resolved.darkSrc} />
      ) : null}
      {/* Official third-party marks. Empty alt when the brand name sits next
          to the image so screen readers do not hear the name twice. */}
      <img
        src={resolved.src}
        alt={decorative ? "" : resolved.name}
        className="h-full w-full object-contain"
      />
    </picture>
  );

  if (!framed) {
    return <span className={`inline-block shrink-0 ${SIZE_CLASS[size]}`}>{mark}</span>;
  }

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] ${SIZE_CLASS[size]} ${
        pad || isOmentir ? "p-1.5 sm:p-2" : ""
      }`}
    >
      {mark}
    </span>
  );
}
