/**
 * Deterministic TSX-to-markdown for public marketing pages.
 *
 * Used at build time (src/ is present) so production can serve baked
 * markdown without shipping the TypeScript sources.
 */

const VOID_TAGS = new Set(["br", "hr", "img", "image", "input", "meta", "link"]);

function isVoidJsxTag(name: string) {
  // HTML <link> is void. Next.js <Link> is not.
  if (name.toLowerCase() === "link") return name === "link";
  return VOID_TAGS.has(name.toLowerCase());
}

const SKIP_TAGS = new Set([
  "jsonld",
  "svg",
  "path",
  "circle",
  "rect",
  "g",
  "style",
  "script",
  "marketingheader",
  "marketingfooter",
  "reveal",
  "herocopy",
  "herocta",
  "customerlogowall",
  "finduson",
  "planawarepricingcards",
  "copyconnectorurl",
  "copypromptblock",
  "agenttypewriter",
  "paperplaneillustration",
  "findbuyersillustration",
  "personalizeillustration",
  "bookdemosillustration",
  "foundergrowthillustration",
  "agenticpromptillustration",
  "developerapiillustration",
  "logoglyph",
]);

const UNWRAP_TAGS = new Set([
  "div",
  "span",
  "section",
  "article",
  "main",
  "header",
  "footer",
  "nav",
  "figure",
  "figcaption",
  "aside",
  "label",
  "button",
  "fragment",
  "marketingpage",
  "seopagechrome",
  "seohero",
  "seoarticle",
  "seoarticle",
  "blogposttemplate",
  "siteshotgrid",
  "producthomelink",
]);

export type TsxValue =
  | string
  | number
  | boolean
  | null
  | TsxValue[]
  | { [key: string]: TsxValue };

export type TsxScope = Map<string, TsxValue>;

export function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export function collapseMarkdown(value: string) {
  return value
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function skipWhitespace(source: string, index: number) {
  while (index < source.length && /\s/.test(source[index]!)) index += 1;
  return index;
}

export function skipBalanced(
  source: string,
  index: number,
  open: string,
  close: string
) {
  if (source[index] !== open) return index;
  let depth = 0;
  for (let i = index; i < source.length; i += 1) {
    const char = source[i]!;
    if (char === '"' || char === "'" || char === "`") {
      const read = readQuoted(source, i);
      if (!read) break;
      i = read.end - 1;
      continue;
    }
    if (char === "/" && source[i + 1] === "/") {
      i = source.indexOf("\n", i);
      if (i < 0) return source.length;
      continue;
    }
    if (char === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      i = end < 0 ? source.length : end + 1;
      continue;
    }
    if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return source.length;
}

export function readQuoted(
  source: string,
  index: number
): { value: string; end: number } | null {
  const quote = source[index];
  if (quote !== '"' && quote !== "'" && quote !== "`") return null;
  let value = "";
  for (let i = index + 1; i < source.length; i += 1) {
    const char = source[i]!;
    if (char === "\\") {
      const next = source[i + 1] ?? "";
      const escaped: Record<string, string> = {
        n: "\n",
        t: "\t",
        r: "\r",
        "'": "'",
        '"': '"',
        "`": "`",
        "\\": "\\",
      };
      value += escaped[next] ?? next;
      i += 1;
      continue;
    }
    if (quote === "`" && char === "$" && source[i + 1] === "{") {
      const end = skipBalanced(source, i + 1, "{", "}");
      value += source.slice(i, end);
      i = end - 1;
      continue;
    }
    if (char === quote) return { value, end: i + 1 };
    value += char;
  }
  return null;
}

function skipUnknownValue(source: string, start: number) {
  let index = skipWhitespace(source, start);
  if (source[index] === "<") {
    const node = readJsxNode(source, index);
    if (node) return node.end;
  }
  if (source[index] === "(") return skipBalanced(source, index, "(", ")");
  if (source[index] === "{") return skipBalanced(source, index, "{", "}");
  if (source[index] === "[") return skipBalanced(source, index, "[", "]");
  const quoted = readQuoted(source, index);
  if (quoted) return quoted.end;

  let depth = 0;
  for (let i = index; i < source.length; i += 1) {
    const char = source[i]!;
    if (char === '"' || char === "'" || char === "`") {
      const read = readQuoted(source, i);
      if (!read) return source.length;
      i = read.end - 1;
      continue;
    }
    if (char === "<") {
      const node = readJsxNode(source, i);
      if (node) {
        i = node.end - 1;
        continue;
      }
    }
    if ("({[".includes(char)) depth += 1;
    else if (")}]".includes(char)) {
      if (depth === 0) return i;
      depth -= 1;
    } else if ((char === "," || char === ";") && depth === 0) {
      return i;
    }
  }
  return source.length;
}

function parseJsValue(
  source: string,
  start: number,
  scope: TsxScope
): { value: TsxValue; end: number } | null {
  let index = skipWhitespace(source, start);
  if (source.startsWith("as const", index)) {
    index = skipWhitespace(source, index + 8);
  }

  const quoted = readQuoted(source, index);
  if (quoted) return { value: quoted.value, end: quoted.end };

  if (source.startsWith("null", index) && !/\w/.test(source[index + 4] ?? "")) {
    return { value: null, end: index + 4 };
  }
  if (source.startsWith("true", index) && !/\w/.test(source[index + 4] ?? "")) {
    return { value: true, end: index + 4 };
  }
  if (source.startsWith("false", index) && !/\w/.test(source[index + 5] ?? "")) {
    return { value: false, end: index + 5 };
  }

  if (source[index] === "[") {
    const end = skipBalanced(source, index, "[", "]");
    const inner = source.slice(index + 1, end - 1);
    const items: TsxValue[] = [];
    let cursor = 0;
    while (cursor < inner.length) {
      cursor = skipWhitespace(inner, cursor);
      if (cursor >= inner.length || inner[cursor] === ",") {
        cursor += 1;
        continue;
      }
      if (inner.startsWith("...", cursor)) {
        cursor = skipUnknownValue(inner, cursor + 3);
        if (inner[cursor] === ",") cursor += 1;
        continue;
      }
      const item = parseJsValue(inner, cursor, scope);
      if (!item) {
        cursor = skipUnknownValue(inner, cursor);
        if (inner[cursor] === ",") cursor += 1;
        continue;
      }
      items.push(item.value);
      cursor = skipWhitespace(inner, item.end);
      if (inner[cursor] === ",") cursor += 1;
    }
    return { value: items, end };
  }

  if (source[index] === "{") {
    const end = skipBalanced(source, index, "{", "}");
    const inner = source.slice(index + 1, end - 1);
    const object: { [key: string]: TsxValue } = {};
    let cursor = 0;
    while (cursor < inner.length) {
      cursor = skipWhitespace(inner, cursor);
      if (cursor >= inner.length || inner[cursor] === ",") {
        cursor += 1;
        continue;
      }
      if (inner.startsWith("...", cursor)) {
        const rest = parseJsValue(inner, cursor + 3, scope);
        if (rest && rest.value && typeof rest.value === "object" && !Array.isArray(rest.value)) {
          Object.assign(object, rest.value);
          cursor = rest.end;
        } else {
          break;
        }
        cursor = skipWhitespace(inner, cursor);
        if (inner[cursor] === ",") cursor += 1;
        continue;
      }
      const keyQuoted = readQuoted(inner, cursor);
      let key: string;
      if (keyQuoted) {
        key = keyQuoted.value;
        cursor = keyQuoted.end;
      } else {
        const match = inner.slice(cursor).match(/^([A-Za-z_$][\w$]*)/);
        if (!match) break;
        key = match[1]!;
        cursor += key.length;
      }
      cursor = skipWhitespace(inner, cursor);
      if (inner[cursor] !== ":") break;
      const value = parseJsValue(inner, cursor + 1, scope);
      if (!value) {
        cursor = skipUnknownValue(inner, cursor + 1);
        if (inner[cursor] === ",") cursor += 1;
        continue;
      }
      object[key] = value.value;
      cursor = skipWhitespace(inner, value.end);
      if (inner[cursor] === ",") cursor += 1;
    }
    return { value: object, end };
  }

  if (source[index] === "<" || source.startsWith("(", index)) {
    return null;
  }

  const ident = source.slice(index).match(/^([A-Za-z_$][\w$]*)/);
  if (ident) {
    let end = index + ident[1]!.length;
    let value: TsxValue | undefined = scope.get(ident[1]!);
    while (source[end] === "." || source[end] === "[") {
      if (source[end] === ".") {
        const next = source.slice(end + 1).match(/^([A-Za-z_$][\w$]*)/);
        if (!next) break;
        if (value && typeof value === "object" && !Array.isArray(value)) {
          value = value[next[1]!];
        } else {
          value = undefined;
        }
        end += 1 + next[1]!.length;
        continue;
      }
      const close = source.indexOf("]", end);
      if (close < 0) break;
      const keyRaw = source.slice(end + 1, close).trim();
      const key = keyRaw.match(/^\d+$/)
        ? Number(keyRaw)
        : (readQuoted(keyRaw, 0)?.value ?? keyRaw);
      if (Array.isArray(value) && typeof key === "number") value = value[key];
      else if (value && typeof value === "object" && !Array.isArray(value)) {
        value = value[String(key)];
      } else {
        value = undefined;
      }
      end = close + 1;
    }
    if (value !== undefined) return { value, end };
    const number = source.slice(index).match(/^-?\d+(?:\.\d+)?/);
    if (number) return { value: Number(number[0]), end: index + number[0].length };
    return { value: ident[1]!, end: index + ident[1]!.length };
  }

  const number = source.slice(index).match(/^-?\d+(?:\.\d+)?/);
  if (number) return { value: Number(number[0]), end: index + number[0].length };
  return null;
}

export function extractTsxScope(source: string): TsxScope {
  const scope: TsxScope = new Map();
  const pattern = /(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    const name = match[1]!;
    const parsed = parseJsValue(source, match.index + match[0].length, scope);
    if (parsed) scope.set(name, parsed.value);
  }
  return scope;
}

export function extractJsxElement(
  source: string,
  tagName: string
): string | null {
  const open = source.search(new RegExp(`<${tagName}(?:\\s|/|>)`));
  if (open < 0) return null;
  const parsed = readJsxNode(source, open);
  if (!parsed || parsed.kind !== "element") return null;
  return parsed.children;
}

type JsxNode =
  | { kind: "element"; name: string; attrs: Record<string, string>; children: string; selfClosing: boolean; end: number }
  | { kind: "fragment"; children: string; end: number };

function readAttrValue(
  source: string,
  start: number
): { value: string; end: number } {
  const index = skipWhitespace(source, start);
  if (source[index] === "{") {
    const end = skipBalanced(source, index, "{", "}");
    return { value: source.slice(index + 1, end - 1).trim(), end };
  }
  const quoted = readQuoted(source, index);
  if (quoted) return { value: quoted.value, end: quoted.end };
  const word = source.slice(index).match(/^[^\s>]+/);
  return { value: word?.[0] ?? "", end: index + (word?.[0].length ?? 0) };
}

function readAttrs(source: string, start: number) {
  const attrs: Record<string, string> = {};
  let index = skipWhitespace(source, start);
  while (index < source.length) {
    if (source[index] === ">" || source.startsWith("/>", index)) break;
    const nameMatch = source.slice(index).match(/^([A-Za-z_:][\w:-]*)/);
    if (!nameMatch) {
      index += 1;
      continue;
    }
    const name = nameMatch[1]!;
    index = skipWhitespace(source, index + name.length);
    if (source[index] === "=") {
      const value = readAttrValue(source, index + 1);
      attrs[name] = value.value;
      index = skipWhitespace(source, value.end);
    } else {
      attrs[name] = "true";
    }
  }
  return { attrs, end: index };
}

function readJsxNode(source: string, start: number): JsxNode | null {
  if (source.startsWith("<>", start)) {
    const close = findClosingTag(source, start + 2, "");
    return {
      kind: "fragment",
      children: source.slice(start + 2, close.index),
      end: close.end,
    };
  }
  if (source[start] !== "<") return null;
  const nameMatch = source.slice(start + 1).match(/^([A-Za-z][\w.-]*)/);
  if (!nameMatch) return null;
  const name = nameMatch[1]!;
  const afterName = start + 1 + name.length;
  const { attrs, end: attrsEnd } = readAttrs(source, afterName);
  const at = skipWhitespace(source, attrsEnd);
  if (source.startsWith("/>", at) || isVoidJsxTag(name)) {
    const close = source.startsWith("/>", at) ? at + 2 : source.indexOf(">", at) + 1;
    const end = close > start ? close : start + 1;
    return { kind: "element", name, attrs, children: "", selfClosing: true, end };
  }
  if (source[at] !== ">") return null;
  const close = findClosingTag(source, at + 1, name);
  return {
    kind: "element",
    name,
    attrs,
    children: source.slice(at + 1, close.index),
    selfClosing: false,
    end: close.end,
  };
}

function findClosingTag(source: string, from: number, tagName: string) {
  let index = from;
  const closeToken = tagName ? `</${tagName}` : "</>";
  while (index < source.length) {
    if (source[index] === "{") {
      index = skipBalanced(source, index, "{", "}");
      continue;
    }
    if (source.startsWith(closeToken, index)) {
      const end = source.indexOf(">", index);
      return { index, end: end < 0 ? source.length : end + 1 };
    }
    if (source[index] === "<" && source[index + 1] !== "/" && source[index + 1] !== "!") {
      const nested = readJsxNode(source, index);
      if (nested && nested.end > index) {
        index = nested.end;
        continue;
      }
    }
    index += 1;
  }
  return { index: source.length, end: source.length };
}

function lookupPath(scope: TsxScope, expression: string): TsxValue | undefined {
  const parsed = parseJsValue(expression, 0, scope);
  return parsed?.value;
}

function valueToPlain(value: TsxValue | undefined): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(valueToPlain).filter(Boolean).join(", ");
  return "";
}

function resolveHref(raw: string, scope: TsxScope, hrefFor: (href: string) => string) {
  const trimmed = raw.trim();
  const quoted = readQuoted(trimmed, 0);
  if (quoted) return hrefFor(quoted.value);
  // Literal URLs and paths must not go through parseJsValue: `https://x.ai/bot`
  // parses as the identifier `https` because `//` starts a comment.
  if (/^https?:\/\//.test(trimmed) || trimmed.startsWith("/")) return hrefFor(trimmed);
  const fromScope = valueToPlain(lookupPath(scope, trimmed));
  if (fromScope) return hrefFor(fromScope);
  return hrefFor(trimmed.replace(/^['"`]|['"`]$/g, ""));
}

function expressionToMarkdown(
  expression: string,
  scope: TsxScope,
  hrefFor: (href: string) => string
): string {
  const trimmed = expression.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined" || trimmed === "false") {
    return "";
  }
  if (trimmed.startsWith("/*") && trimmed.endsWith("*/")) return "";

  const quoted = readQuoted(trimmed, 0);
  if (quoted && quoted.end >= trimmed.length) return decodeEntities(quoted.value);

  if (trimmed.startsWith("<")) {
    return jsxChildrenToMarkdown(trimmed, scope, hrefFor);
  }

  const andJsx = trimmed.match(/^(?:[\w.]+|\([^)]+\))\s*&&\s*(<[\s\S]+)$/);
  if (andJsx) return jsxChildrenToMarkdown(andJsx[1]!, scope, hrefFor);

  const ternary = splitTernary(trimmed);
  if (ternary) {
    return (
      expressionToMarkdown(ternary.consequent, scope, hrefFor) ||
      expressionToMarkdown(ternary.alternate, scope, hrefFor)
    );
  }

  const mapPrefix = trimmed.match(
    /^([A-Za-z_$][\w$]*)\.map\(\s*\(?([A-Za-z_$][\w$]*)(?:,\s*[A-Za-z_$][\w$]*)?\)?\s*=>\s*/
  );
  if (mapPrefix && trimmed.endsWith(")")) {
    const collection = lookupPath(scope, mapPrefix[1]!);
    let body = trimmed.slice(mapPrefix[0].length, -1).trim();
    if (body.startsWith("(") && body.endsWith(")")) body = body.slice(1, -1).trim();
    if (Array.isArray(collection) && body.startsWith("<") && body.length < 4000) {
      const itemName = mapPrefix[2]!;
      return collection
        .map((item) => {
          const childScope = new Map(scope);
          childScope.set(itemName, item);
          return jsxChildrenToMarkdown(body, childScope, hrefFor);
        })
        .filter(Boolean)
        .join("\n\n");
    }
  }

  const fromScope = lookupPath(scope, trimmed);
  if (fromScope !== undefined) return decodeEntities(valueToPlain(fromScope));

  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    return expressionToMarkdown(trimmed.slice(1, -1), scope, hrefFor);
  }

  return "";
}

function splitTernary(expression: string): { consequent: string; alternate: string } | null {
  let depth = 0;
  let question = -1;
  for (let i = 0; i < expression.length; i += 1) {
    const char = expression[i]!;
    if (char === '"' || char === "'" || char === "`") {
      const read = readQuoted(expression, i);
      if (!read) break;
      i = read.end - 1;
      continue;
    }
    if (char === "<") {
      const node = readJsxNode(expression, i);
      if (node) {
        i = node.end - 1;
        continue;
      }
    }
    if ("({[".includes(char)) depth += 1;
    else if (")}]".includes(char)) depth -= 1;
    else if (char === "?" && depth === 0 && expression[i + 1] !== ".") {
      question = i;
      break;
    }
  }
  if (question < 0) return null;
  depth = 0;
  for (let i = question + 1; i < expression.length; i += 1) {
    const char = expression[i]!;
    if (char === '"' || char === "'" || char === "`") {
      const read = readQuoted(expression, i);
      if (!read) break;
      i = read.end - 1;
      continue;
    }
    if (char === "<") {
      const node = readJsxNode(expression, i);
      if (node) {
        i = node.end - 1;
        continue;
      }
    }
    if ("({[".includes(char)) depth += 1;
    else if (")}]".includes(char)) depth -= 1;
    else if (char === ":" && depth === 0) {
      return {
        consequent: expression.slice(question + 1, i).trim(),
        alternate: expression.slice(i + 1).trim(),
      };
    }
  }
  return null;
}

function faqMarkdown(items: TsxValue | undefined): string {
  if (!Array.isArray(items)) return "";
  const lines = items
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return "";
      const question = valueToPlain(item.question).trim();
      const answer = valueToPlain(item.answer).trim();
      if (!question || !answer) return "";
      return `**${question}**\n\n${answer}`;
    })
    .filter(Boolean);
  return lines.length ? `## Frequently asked questions\n\n${lines.join("\n\n")}` : "";
}

function tableToMarkdown(children: string, scope: TsxScope, hrefFor: (href: string) => string) {
  const rows: string[][] = [];
  const rowPattern = /<tr\b[\s\S]*?<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowPattern.exec(children))) {
    const cells: string[] = [];
    const cellPattern = /<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellPattern.exec(rowMatch[0]!))) {
      cells.push(
        jsxChildrenToMarkdown(cellMatch[3]!, scope, hrefFor).replace(/\n+/g, " ").trim()
      );
    }
    if (cells.length) rows.push(cells);
  }
  if (rows.length === 0) return jsxChildrenToMarkdown(children, scope, hrefFor);
  const width = Math.max(...rows.map((row) => row.length));
  const padded = rows.map((row) => {
    const copy = [...row];
    while (copy.length < width) copy.push("");
    return copy;
  });
  const header = padded[0]!;
  const divider = header.map(() => "---");
  const lines = [
    `| ${header.join(" | ")} |`,
    `| ${divider.join(" | ")} |`,
    ...padded.slice(1).map((row) => `| ${row.join(" | ")} |`),
  ];
  return `\n\n${lines.join("\n")}\n\n`;
}

export function jsxChildrenToMarkdown(
  source: string,
  scope: TsxScope,
  hrefFor: (href: string) => string
): string {
  let output = "";
  let index = 0;

  const pushBlock = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    output += `${output && !output.endsWith("\n\n") ? "\n\n" : ""}${trimmed}\n\n`;
  };

  while (index < source.length) {
    const char = source[index]!;
    if (char === "{") {
      const end = skipBalanced(source, index, "{", "}");
      output += expressionToMarkdown(source.slice(index + 1, end - 1), scope, hrefFor);
      index = end;
      continue;
    }
    if (source.startsWith("{/*", index) || (char === "{" && source[index + 1] === "*")) {
      const end = source.indexOf("*/}", index);
      index = end < 0 ? source.length : end + 3;
      continue;
    }
    if (char === "<") {
      if (source.startsWith("<>", index) || source.startsWith("</>", index)) {
        const node = readJsxNode(source, index);
        if (node?.kind === "fragment") {
          output += jsxChildrenToMarkdown(node.children, scope, hrefFor);
          index = node.end;
          continue;
        }
      }
      const node = readJsxNode(source, index);
      if (!node) {
        index += 1;
        continue;
      }
      if (node.kind === "fragment") {
        output += jsxChildrenToMarkdown(node.children, scope, hrefFor);
        index = node.end;
        continue;
      }

      const tag = node.name.toLowerCase();
      if (SKIP_TAGS.has(tag) || tag.endsWith("illustration")) {
        index = node.end;
        continue;
      }

      if (tag === "br") {
        output += "\n";
        index = node.end;
        continue;
      }
      if (tag === "hr") {
        pushBlock("---");
        index = node.end;
        continue;
      }

      if (tag === "image" || tag === "img" || tag === "articleimage") {
        const alt = valueToPlain(lookupPath(scope, node.attrs.alt ?? "")) || node.attrs.alt || "";
        const srcRaw = node.attrs.src ?? "";
        const src =
          valueToPlain(lookupPath(scope, srcRaw)) ||
          srcRaw.replace(/^['"`]|['"`]$/g, "");
        const href = src.startsWith("http") || src.startsWith("/") ? hrefFor(src) : src;
        if (alt || src) output += `\n\n![${decodeEntities(alt || "image")}](${href})\n\n`;
        index = node.end;
        continue;
      }

      if (tag === "siteshot") {
        const label =
          valueToPlain(lookupPath(scope, node.attrs.label ?? "")) ||
          node.attrs.label ||
          node.attrs.alt ||
          "site";
        const href = resolveHref(node.attrs.href ?? "", scope, hrefFor);
        pushBlock(`[${decodeEntities(label)}](${href})`);
        index = node.end;
        continue;
      }

      if (tag === "bloglandingshots") {
        index = node.end;
        continue;
      }

      if (tag === "faqaccordion") {
        const items = lookupPath(scope, node.attrs.items ?? "faqItems");
        const md = faqMarkdown(items);
        if (md) pushBlock(md);
        index = node.end;
        continue;
      }

      if (tag === "a" || tag === "link") {
        const href = resolveHref(node.attrs.href ?? "", scope, hrefFor);
        const text = jsxChildrenToMarkdown(node.children, scope, hrefFor).replace(/\n+/g, " ").trim();
        output += text ? `[${text}](${href})` : href;
        index = node.end;
        continue;
      }

      if (tag === "strong" || tag === "b") {
        const text = jsxChildrenToMarkdown(node.children, scope, hrefFor).trim();
        output += text ? `**${text}**` : "";
        index = node.end;
        continue;
      }
      if (tag === "em" || tag === "i") {
        const text = jsxChildrenToMarkdown(node.children, scope, hrefFor).trim();
        output += text ? `*${text}*` : "";
        index = node.end;
        continue;
      }
      if (tag === "code" && !node.children.includes("\n")) {
        const text = jsxChildrenToMarkdown(node.children, scope, hrefFor).trim();
        output += text ? `\`${text}\`` : "";
        index = node.end;
        continue;
      }
      if (tag === "pre") {
        const text = jsxChildrenToMarkdown(node.children, scope, hrefFor).trim();
        pushBlock(`\`\`\`\n${text}\n\`\`\``);
        index = node.end;
        continue;
      }
      if (tag === "blockquote") {
        const text = jsxChildrenToMarkdown(node.children, scope, hrefFor).trim();
        pushBlock(text.split("\n").map((line) => `> ${line}`).join("\n"));
        index = node.end;
        continue;
      }
      if (tag === "li") {
        const text = jsxChildrenToMarkdown(node.children, scope, hrefFor).trim();
        output += `- ${text.replace(/\n+/g, "\n  ")}\n`;
        index = node.end;
        continue;
      }
      if (tag === "ul" || tag === "ol") {
        const text = jsxChildrenToMarkdown(node.children, scope, hrefFor).trim();
        pushBlock(text);
        index = node.end;
        continue;
      }
      if (tag === "table" || tag === "marketingtable") {
        pushBlock(tableToMarkdown(node.children, scope, hrefFor).trim());
        index = node.end;
        continue;
      }
      if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
        const level = Number(tag[1]);
        const text = jsxChildrenToMarkdown(node.children, scope, hrefFor).replace(/\n+/g, " ").trim();
        if (text) pushBlock(`${"#".repeat(level)} ${text}`);
        index = node.end;
        continue;
      }
      if (tag === "p") {
        const text = jsxChildrenToMarkdown(node.children, scope, hrefFor).trim();
        if (text) pushBlock(text);
        index = node.end;
        continue;
      }

      if (UNWRAP_TAGS.has(tag) || tag.startsWith("marketing") || tag.startsWith("seo")) {
        output += jsxChildrenToMarkdown(node.children, scope, hrefFor);
        index = node.end;
        continue;
      }

      output += jsxChildrenToMarkdown(node.children, scope, hrefFor);
      index = node.end;
      continue;
    }

    const nextSpecial = source.slice(index).search(/[<{]/);
    const text = nextSpecial < 0 ? source.slice(index) : source.slice(index, index + nextSpecial);
    output += decodeEntities(text.replace(/\s+/g, " "));
    index = nextSpecial < 0 ? source.length : index + nextSpecial;
  }

  return output;
}

export function sourceFileToMarkdown(
  source: string,
  hrefFor: (href: string) => string,
  preferredTag?: string
) {
  const scope = extractTsxScope(source);
  const fragment =
    (preferredTag ? extractJsxElement(source, preferredTag) : null) ??
    extractJsxElement(source, "BlogPostTemplate") ??
    extractJsxElement(source, "MarketingPage") ??
    extractDefaultReturn(source);
  if (!fragment) return "";
  return collapseMarkdown(jsxChildrenToMarkdown(fragment, scope, hrefFor));
}

function extractDefaultReturn(source: string) {
  const match = source.match(/export default function[\s\S]*?return\s*\(\s*/);
  if (!match || match.index == null) return null;
  const start = match.index + match[0].length;
  if (source[start] !== "<") return null;
  const node = readJsxNode(source, start);
  if (!node) return null;
  return node.kind === "fragment" ? node.children : source.slice(start, node.end);
}

export function faqItemsFromSource(source: string) {
  return faqMarkdown(extractTsxScope(source).get("faqItems"));
}
