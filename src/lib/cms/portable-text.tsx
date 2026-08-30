"use client";

import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import Image from "next/image";
import Link from "next/link";
import { MarketingTable, MarketingTd, MarketingTh, MarketingThead, MarketingTr } from "@/app/marketing-table";
import { headingId, headingIdFromBlock } from "./portable-text-toc";
import { isSanityCdnUrl, sanityImageUrl } from "@/sanity/lib/image";

function InlineLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const external = href.startsWith("http://") || href.startsWith("https://");
  const className =
    "font-medium text-[var(--md-sys-color-primary)] underline decoration-[var(--md-sys-color-primary)]/30 underline-offset-4 hover:text-[var(--md-sys-color-on-surface)]";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children, value }) => (
      <h2
        id={headingIdFromBlock(value) || headingId(children)}
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-10 scroll-mt-28 border-b border-zinc-200 pb-2 pt-2 text-left text-2xl font-semibold tracking-tight text-black"
      >
        {children}
      </h2>
    ),
    h3: ({ children, value }) => (
      <h3
        id={headingIdFromBlock(value) || headingId(children)}
        style={{ fontFamily: "var(--font-varta)" }}
        className="mt-8 scroll-mt-28 text-left text-xl font-semibold tracking-tight text-black"
      >
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-[var(--md-sys-color-outline-variant)] pl-4 text-left italic text-[var(--md-sys-color-on-surface-variant)]">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => <p className="text-left">{children}</p>,
  },
  list: {
    bullet: ({ children }) => (
      <ul style={{ listStyleType: "disc" }} className="my-4 list-disc space-y-2 pl-6 text-left">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="my-4 list-decimal space-y-2 pl-6 text-left">{children}</ol>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const href = typeof value?.href === "string" ? value.href : "";
      if (!href) return <>{children}</>;
      if (href.startsWith("/") && /\.(avif|png|jpe?g|svg|webp)$/i.test(href)) {
        return <>{children}</>;
      }
      return <InlineLink href={href}>{children}</InlineLink>;
    },
  },
  types: {
    image: ({ value }) => {
      const src = sanityImageUrl(value);
      const alt = typeof value?.alt === "string" ? value.alt : "";
      if (!src) return null;
      return (
        <span className="relative my-8 block aspect-[3/2] overflow-hidden rounded-xl bg-[var(--md-sys-color-surface-container-low)]">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            unoptimized={isSanityCdnUrl(src)}
          />
        </span>
      );
    },
    codeBlock: ({ value }) => (
      <pre className="overflow-x-auto rounded-xl bg-[var(--md-sys-color-surface-container-low)] p-4 text-sm">
        <code>{typeof value?.code === "string" ? value.code : ""}</code>
      </pre>
    ),
    contentTable: ({ value }) => {
      const headers = Array.isArray(value?.headers) ? value.headers : [];
      const rows = Array.isArray(value?.rows) ? value.rows : [];
      if (!headers.length) return null;
      return (
        <MarketingTable className="my-6">
          <MarketingThead>
            <tr>
              {headers.map((header: string) => (
                <MarketingTh key={header}>{header}</MarketingTh>
              ))}
            </tr>
          </MarketingThead>
          <tbody>
            {rows.map((row: { cells?: string[] }, index: number) => (
              <MarketingTr key={index}>
                {(row.cells ?? []).map((cell, cellIndex) => (
                  <MarketingTd key={`${index}-${cellIndex}`}>{cell}</MarketingTd>
                ))}
              </MarketingTr>
            ))}
          </tbody>
        </MarketingTable>
      );
    },
  },
};

export function BlogPortableText({ value }: { value: PortableTextBlock[] }) {
  if (!value?.length) return null;
  return <PortableText value={value} components={components} />;
}
