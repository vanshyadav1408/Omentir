import type { PortableTextBlock } from "@portabletext/types";

let key = 0;
function nextKey() {
  key += 1;
  return `k${key}`;
}

type Span = {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];
};

type MarkDef = {
  _type: "link";
  _key: string;
  href: string;
};

function parseInline(text: string): { children: Span[]; markDefs: MarkDef[] } {
  const children: Span[] = [];
  const markDefs: MarkDef[] = [];
  const token =
    /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = token.exec(text))) {
    if (match.index > last) {
      children.push({
        _type: "span",
        _key: nextKey(),
        text: text.slice(last, match.index),
        marks: [],
      });
    }
    if (match[1]) {
      const markKey = nextKey();
      markDefs.push({ _type: "link", _key: markKey, href: match[3]! });
      children.push({
        _type: "span",
        _key: nextKey(),
        text: match[2]!,
        marks: [markKey],
      });
    } else if (match[4]) {
      children.push({
        _type: "span",
        _key: nextKey(),
        text: match[5]!,
        marks: ["strong"],
      });
    } else if (match[6]) {
      children.push({
        _type: "span",
        _key: nextKey(),
        text: match[7]!,
        marks: ["em"],
      });
    } else if (match[8]) {
      children.push({
        _type: "span",
        _key: nextKey(),
        text: match[9]!,
        marks: ["code"],
      });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length || children.length === 0) {
    children.push({
      _type: "span",
      _key: nextKey(),
      text: text.slice(last),
      marks: [],
    });
  }
  return { children, markDefs };
}

function textBlock(
  style: "normal" | "h2" | "h3" | "blockquote",
  text: string,
  listItem?: "bullet" | "number"
): PortableTextBlock {
  const { children, markDefs } = parseInline(text);
  return {
    _type: "block",
    _key: nextKey(),
    style,
    markDefs,
    children,
    ...(listItem ? { listItem, level: 1 } : {}),
  } as PortableTextBlock;
}

export function markdownToPortableText(markdown: string): PortableTextBlock[] {
  key = 0;
  const blocks: PortableTextBlock[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const code: string[] = [];
      const language = line.slice(3).trim();
      i += 1;
      while (i < lines.length && !lines[i]!.startsWith("```")) {
        code.push(lines[i]!);
        i += 1;
      }
      i += 1;
      blocks.push({
        _type: "codeBlock",
        _key: nextKey(),
        language: language || undefined,
        code: code.join("\n"),
      } as unknown as PortableTextBlock);
      continue;
    }
    if (line.startsWith("|") && lines[i + 1]?.includes("---")) {
      const headers = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
      i += 2;
      const rows: Array<{ _type: string; _key: string; cells: string[] }> = [];
      while (i < lines.length && lines[i]!.startsWith("|")) {
        rows.push({
          _type: "contentTableRow",
          _key: nextKey(),
          cells: lines[i]!
            .split("|")
            .map((cell) => cell.trim())
            .filter(Boolean),
        });
        i += 1;
      }
      blocks.push({
        _type: "contentTable",
        _key: nextKey(),
        headers,
        rows,
      } as unknown as PortableTextBlock);
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(textBlock("h3", line.slice(4)));
      i += 1;
      continue;
    }
    const imageMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      blocks.push({
        _type: "image",
        _key: nextKey(),
        alt: imageMatch[1],
        src: imageMatch[2],
      } as unknown as PortableTextBlock);
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(textBlock("h2", line.slice(3)));
      i += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(textBlock("h2", line.slice(2)));
      i += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push(textBlock("blockquote", line.replace(/^>\s?/, "")));
      i += 1;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      blocks.push(textBlock("normal", line.replace(/^[-*]\s+/, ""), "bullet"));
      i += 1;
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      blocks.push(textBlock("normal", line.replace(/^\d+\.\s+/, ""), "number"));
      i += 1;
      continue;
    }
    const paragraph: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !lines[i]!.startsWith("#") &&
      !lines[i]!.startsWith("```") &&
      !lines[i]!.startsWith("|") &&
      !lines[i]!.startsWith(">") &&
      !/^[-*]\s+/.test(lines[i]!) &&
      !/^\d+\.\s+/.test(lines[i]!)
    ) {
      paragraph.push(lines[i]!);
      i += 1;
    }
    blocks.push(textBlock("normal", paragraph.join(" ")));
  }
  return blocks;
}
