import type { PortableTextBlock } from "@portabletext/types";

type MarkDef = { _key?: string; _type?: string; href?: string };

function blockText(block: PortableTextBlock) {
  const children = Array.isArray(block.children) ? block.children : [];
  const markDefs = Array.isArray(block.markDefs) ? (block.markDefs as MarkDef[]) : [];
  return children
    .map((child) => {
      if (!child || typeof child !== "object" || !("text" in child)) return "";
      const text = String(child.text);
      const marks = Array.isArray(child.marks) ? child.marks : [];
      let out = text;
      if (marks.includes("code")) out = `\`${out}\``;
      if (marks.includes("strong")) out = `**${out}**`;
      if (marks.includes("em")) out = `*${out}*`;
      const linkKey = marks.find((mark) => markDefs.some((def) => def._key === mark && def._type === "link"));
      const link = linkKey ? markDefs.find((def) => def._key === linkKey) : undefined;
      if (link?.href) out = `[${out}](${link.href})`;
      return out;
    })
    .join("");
}

export function portableTextToMarkdown(value: PortableTextBlock[] | undefined): string {
  if (!value?.length) return "";
  const lines: string[] = [];
  for (const block of value) {
    if (block._type === "block") {
      const text = blockText(block);
      if (block.style === "h2") lines.push(`## ${text}`);
      else if (block.style === "h3") lines.push(`### ${text}`);
      else if (block.style === "blockquote") lines.push(`> ${text}`);
      else if (block.listItem === "bullet") lines.push(`- ${text}`);
      else if (block.listItem === "number") lines.push(`1. ${text}`);
      else lines.push(text);
      continue;
    }
    if (block._type === "codeBlock") {
      const code = "code" in block && typeof block.code === "string" ? block.code : "";
      lines.push("```", code, "```");
      continue;
    }
    if (block._type === "contentTable") {
      const table = block as unknown as {
        headers?: string[];
        rows?: Array<{ cells?: string[] }>;
      };
      const headers = Array.isArray(table.headers) ? table.headers : [];
      const rows = Array.isArray(table.rows) ? table.rows : [];
      if (headers.length) {
        lines.push(`| ${headers.join(" | ")} |`);
        lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
        for (const row of rows) {
          lines.push(`| ${(row.cells ?? []).join(" | ")} |`);
        }
      }
    }
  }
  return lines.join("\n\n").trim();
}
