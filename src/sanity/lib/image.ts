import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { dataset, projectId } from "../env";

const builder = projectId ? createImageUrlBuilder({ projectId, dataset }) : null;

export function sanityImageUrl(source: unknown, width = 1200): string | undefined {
  if (!builder || !source || typeof source !== "object") return undefined;
  try {
    const url = builder.image(source as SanityImageSource).width(width).auto("format").url();
    return url || undefined;
  } catch {
    return undefined;
  }
}
