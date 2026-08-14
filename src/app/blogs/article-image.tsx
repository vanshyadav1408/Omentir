import Image from "next/image";

export function ArticleImage({
  src,
  alt,
  caption,
  width = 1600,
  height = 800,
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}) {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-auto w-full"
        sizes="(min-width: 1024px) 720px, calc(100vw - 32px)"
      />
      {caption ? (
        <figcaption className="border-t border-[var(--md-sys-color-outline-variant)] px-4 py-3 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
