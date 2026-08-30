import type { PortableTextBlock } from "@portabletext/types";

export function headingId(children: unknown) {
  const text = Array.isArray(children)
    ? children.map((child) => (typeof child === "string" ? child : "")).join("")
    : typeof children === "string"
      ? children
      : "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function tocFromBody(value: PortableTextBlock[]): Array<{ id: string; label: string; level: 1 | 2 }> {
  return value
    .filter((block) => block._type === "block" && (block.style === "h2" || block.style === "h3"))
    .map((block) => {
      const children = Array.isArray(block.children) ? block.children : [];
      const label = children
        .map((child) => (typeof child === "object" && child && "text" in child ? String(child.text) : ""))
        .join("");
      return {
        id: headingId(label),
        label,
        level: block.style === "h3" ? (2 as const) : (1 as const),
      };
    })
    .filter((item) => item.label);
}
