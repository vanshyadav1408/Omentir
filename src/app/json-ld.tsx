/**
 * JSON-LD as a plain `application/ld+json` script. React 19 treats non-JS-type
 * scripts as inert data blocks and renders them without the "script tag in a
 * React component" warning — and JSON-LD is only parsed by crawlers, never
 * executed, so client execution is irrelevant. (next/script beforeInteractive
 * belongs in the root layout, not a page, and here it warned as a raw script.)
 */
export default function JsonLd({ id, data }: { id: string; data: unknown }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
