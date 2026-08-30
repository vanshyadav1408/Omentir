import type { PortableTextBlock } from "@portabletext/types";

function textFromUnknown(node: unknown): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromUnknown).join("");
  if (typeof node === "object") {
    const record = node as { props?: { children?: unknown }; text?: unknown };
    if (typeof record.text === "string" || typeof record.text === "number") {
      return String(record.text);
    }
    if (record.props) return textFromUnknown(record.props.children);
  }
  return "";
}

export function headingId(children: unknown) {
  return textFromUnknown(children)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function blockHeadingLabel(block: PortableTextBlock): string {
  const children = Array.isArray(block.children) ? block.children : [];
  return children
    .map((child) =>
      typeof child === "object" && child && "text" in child ? String(child.text) : ""
    )
    .join("");
}

export function headingIdFromBlock(block: PortableTextBlock | undefined): string {
  if (!block) return "";
  return headingId(blockHeadingLabel(block));
}

export function tocFromBody(value: PortableTextBlock[]): Array<{ id: string; label: string; level: 1 | 2 }> {
  return value
    .filter((block) => block._type === "block" && (block.style === "h2" || block.style === "h3"))
    .map((block) => {
      const label = blockHeadingLabel(block);
      return {
        id: headingId(label),
        label,
        level: block.style === "h3" ? (2 as const) : (1 as const),
      };
    })
    .filter((item) => item.label);
}

function isFaqHeadingLabel(label: string) {
  const text = label.toLowerCase();
  return text.includes("faq") || text.includes("frequently asked");
}

export function withoutFaqHeadings(value: PortableTextBlock[]): PortableTextBlock[] {
  return value.filter((block) => {
    if (block._type !== "block" || (block.style !== "h2" && block.style !== "h3")) return true;
    return !isFaqHeadingLabel(blockHeadingLabel(block));
  });
}
