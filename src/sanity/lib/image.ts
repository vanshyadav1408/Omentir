import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { dataset, projectId } from "../env";

const builder = projectId ? createImageUrlBuilder({ projectId, dataset }) : null;

export function isSanityCdnUrl(src: string) {
  return src.startsWith("https://cdn.sanity.io/") || src.startsWith("http://cdn.sanity.io/");
}

function withAutoFormat(url: string) {
  if (!isSanityCdnUrl(url)) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("auto")) parsed.searchParams.set("auto", "format");
    return parsed.toString();
  } catch {
    return url;
  }
}

export function sanityImageUrl(source: unknown, width = 1200): string | undefined {
  if (!source) return undefined;
  if (typeof source === "string") {
    if (source.startsWith("https://") || source.startsWith("http://")) {
      return withAutoFormat(source);
    }
    return undefined;
  }
  if (typeof source !== "object") return undefined;
  if (builder) {
    try {
      const url = builder.image(source as SanityImageSource).width(width).auto("format").url();
      if (url) return url;
    } catch {
      // Source may already be a resolved CDN URL from GROQ (src / url).
    }
  }
  const row = source as Record<string, unknown>;
  for (const value of [row.src, row.url]) {
    if (typeof value === "string" && (value.startsWith("https://") || value.startsWith("http://"))) {
      return withAutoFormat(value);
    }
  }
  return undefined;
}
