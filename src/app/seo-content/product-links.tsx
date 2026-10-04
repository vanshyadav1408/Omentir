import { cache, Fragment, type ReactNode } from "react";
import { splitMarkdownLinks } from "@/lib/cms/markdown-links";
import { isPaidAnchor } from "@/lib/paid-placement";

/**
 * Official homepages for third-party products we name on marketing pages.
 * These are ordinary outbound links so crawlers can follow them. Keep names
 * and aliases in the same capitalization the copy uses.
 */
type ProductEntry = {
  id: string;
  href: string;
  names: readonly string[];
};

export const PRODUCT_HOMEPAGES: readonly ProductEntry[] = [
  {
    id: "claude-code",
    href: "https://claude.com/product/claude-code",
    names: ["Claude Code"],
  },
  {
    id: "chatgpt",
    href: "https://chatgpt.com",
    names: ["ChatGPT", "chatgpt.com"],
  },
  {
    id: "claude",
    href: "https://claude.ai",
    names: ["Claude", "claude.ai"],
  },
  {
    id: "cursor",
    href: "https://cursor.com",
    names: ["Cursor", "cursor.com"],
  },
  {
    id: "codex",
    href: "https://developers.openai.com/codex",
    names: ["Codex", "OpenAI Codex"],
  },
  {
    id: "grok-bot",
    href: "https://x.ai/bot",
    names: ["Grok Bot"],
  },
  {
    id: "grok",
    href: "https://grok.com",
    names: ["Grok", "grok.com"],
  },
  {
    id: "openclaw",
    href: "https://openclaw.ai",
    names: ["OpenClaw", "openclaw.ai"],
  },
  {
    id: "kimi",
    href: "https://www.kimi.com",
    names: ["Kimi"],
  },
  {
    id: "gemini",
    href: "https://gemini.google.com",
    names: ["Gemini"],
  },
  {
    id: "deepseek",
    href: "https://www.deepseek.com",
    names: ["DeepSeek"],
  },
  {
    id: "qwen",
    href: "https://chat.qwen.ai",
    names: ["Qwen"],
  },
  {
    id: "mistral-le-chat",
    href: "https://chat.mistral.ai",
    names: ["Le Chat", "Mistral Le Chat"],
  },
  {
    id: "sarvam",
    href: "https://www.sarvam.ai",
    names: ["Sarvam"],
  },
  {
    id: "hermes",
    href: "https://nousresearch.com",
    names: ["Hermes"],
  },
  {
    id: "gojiberry",
    href: "https://gojiberry.ai",
    names: ["Gojiberry", "gojiberry.ai"],
  },
  {
    id: "apollo",
    href: "https://www.apollo.io",
    names: ["Apollo.io", "Apollo", "apollo.io"],
  },
  {
    id: "instantly",
    href: "https://instantly.ai",
    names: ["Instantly", "instantly.ai"],
  },
  {
    id: "valley",
    href: "https://www.joinvalley.co",
    names: ["Valley", "joinvalley.co"],
  },
  {
    id: "smartlead",
    href: "https://www.smartlead.ai",
    names: ["Smartlead", "smartlead.ai"],
  },
  {
    id: "artisan",
    href: "https://www.artisan.co",
    names: ["Artisan AI", "Artisan", "artisan.co"],
  },
  {
    id: "11x",
    href: "https://www.11x.ai",
    names: ["11x AI", "11x.ai", "11x"],
  },
  {
    id: "lusha",
    href: "https://www.lusha.com",
    names: ["Lusha", "lusha.com"],
  },
  {
    id: "clay",
    href: "https://www.clay.com",
    names: ["Clay", "clay.com"],
  },
  {
    id: "cognism",
    href: "https://www.cognism.com",
    names: ["Cognism", "cognism.com"],
  },
  {
    id: "heyreach",
    href: "https://www.heyreach.io",
    names: ["HeyReach", "heyreach.io"],
  },
  {
    id: "expandi",
    href: "https://expandi.io",
    names: ["Expandi", "expandi.io"],
  },
  {
    id: "dripify",
    href: "https://dripify.com",
    names: ["Dripify", "dripify.com"],
  },
  {
    id: "waalaxy",
    href: "https://www.waalaxy.com",
    names: ["Waalaxy", "waalaxy.com"],
  },
  {
    id: "linkedhelper",
    href: "https://www.linkedhelper.com",
    names: ["LinkedHelper", "Linked Helper", "linkedhelper.com"],
  },
  {
    id: "lemlist",
    href: "https://www.lemlist.com",
    names: ["Lemlist", "lemlist.com"],
  },
  {
    id: "phantombuster",
    href: "https://phantombuster.com",
    names: ["PhantomBuster", "phantombuster.com"],
  },
  {
    id: "amplemarket",
    href: "https://www.amplemarket.com",
    names: ["Amplemarket", "amplemarket.com"],
  },
  {
    id: "la-growth-machine",
    href: "https://lagrowthmachine.com",
    names: ["La Growth Machine", "lagrowthmachine.com"],
  },
  {
    id: "warmly",
    href: "https://www.warmly.ai",
    names: ["Warmly", "warmly.ai"],
  },
  {
    id: "aisdr",
    href: "https://aisdr.com",
    names: ["AiSDR", "aisdr.com"],
  },
  {
    id: "sales-navigator",
    href: "https://www.linkedin.com/products/linkedin-sales-navigator/",
    names: ["Sales Navigator", "LinkedIn Sales Navigator"],
  },
  {
    id: "mcp",
    href: "https://modelcontextprotocol.io",
    names: ["Model Context Protocol"],
  },
];

const NAME_TO_PRODUCT = new Map<string, ProductEntry>();
for (const product of PRODUCT_HOMEPAGES) {
  for (const name of product.names) {
    NAME_TO_PRODUCT.set(name.toLowerCase(), product);
  }
}

const NAME_PATTERN = PRODUCT_HOMEPAGES.flatMap((product) => product.names)
  .sort((a, b) => b.length - a.length)
  .map(escapeRegExp)
  .join("|");

const PRODUCT_PATTERN = new RegExp(`\\b(?:${NAME_PATTERN})\\b`, "g");

export const PRODUCT_LINK_CLASS = "product-word-link font-medium no-underline";

export function productHref(name: string): string | undefined {
  return NAME_TO_PRODUCT.get(name.trim().toLowerCase())?.href;
}

/**
 * One outbound link per product per page. React scopes `cache` to a single
 * server render, so every helper below shares this set across sections,
 * tables, steps, and FAQs. Later mentions render as plain text.
 */
const linkedOnThisPage = cache(() => new Set<string>());

export function ProductHomeLink({
  name,
  className = PRODUCT_LINK_CLASS,
  children,
}: {
  name: string;
  className?: string;
  children?: ReactNode;
}) {
  const product = NAME_TO_PRODUCT.get(name.trim().toLowerCase());
  const linked = linkedOnThisPage();
  if (!product || linked.has(product.id)) return <>{children ?? name}</>;
  linked.add(product.id);
  return (
    <a href={product.href} target="_blank" rel="noopener" className={className}>
      {children ?? name}
    </a>
  );
}

function normalizeHref(href: string) {
  return href.replace(/\/+$/, "").toLowerCase();
}

function markdownLinkKey(href: string) {
  const product = PRODUCT_HOMEPAGES.find(
    (item) => normalizeHref(item.href) === normalizeHref(href)
  );
  if (product) return product.id;
  try {
    return new URL(href).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return href;
  }
}

/**
 * Markdown anchors on SEO pages win over an auto-link to the same homepage in
 * the same paragraph. The contracted paid anchor always renders; any other
 * repeat link becomes plain text.
 */
export function linkifySeoCopy(text: string): ReactNode {
  const linked = linkedOnThisPage();
  const parts = splitMarkdownLinks(text);
  if (!parts.some((part) => part.type === "link")) return linkifyProducts(text, linked);

  const keep = parts.map((part) => {
    if (part.type !== "link") return false;
    const key = markdownLinkKey(part.href);
    if (linked.has(key) && !isPaidAnchor(part.href, part.text)) return false;
    linked.add(key);
    return true;
  });

  return parts.map((part, index) => {
    if (part.type === "text") {
      return <Fragment key={`t${index}`}>{linkifyProducts(part.text, linked)}</Fragment>;
    }
    if (!keep[index]) return <Fragment key={`a${index}`}>{part.text}</Fragment>;
    return (
      <a
        key={`a${index}`}
        href={part.href}
        target="_blank"
        rel="noopener"
        className={PRODUCT_LINK_CLASS}
      >
        {part.text}
      </a>
    );
  });
}

export function linkifyProducts(text: string, linked = linkedOnThisPage()): ReactNode {
  const local = new RegExp(PRODUCT_PATTERN.source, PRODUCT_PATTERN.flags);
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = local.exec(text))) {
    const raw = match[0];
    const product = NAME_TO_PRODUCT.get(raw.toLowerCase());
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (
      !product ||
      linked.has(product.id) ||
      isInsideUrl(text, match.index)
    ) {
      parts.push(raw);
    } else {
      linked.add(product.id);
      parts.push(
        <a
          key={`${product.id}-${index}`}
          href={product.href}
          target="_blank"
          rel="noopener"
          className={PRODUCT_LINK_CLASS}
        >
          {raw}
        </a>
      );
      index += 1;
    }
    last = match.index + raw.length;
  }

  if (last === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isInsideUrl(text: string, index: number) {
  const before = text.slice(Math.max(0, index - 40), index);
  return /https?:\/\/\S*$/i.test(before);
}
