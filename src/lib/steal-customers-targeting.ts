import type { ProductProfile } from "@/lib/server/types";

/**
 * Steal-customers agents do not collect an ICP in setup. Buyers are people who
 * comment under competitor posts; fit is judged against My Product.
 * This builds the stored prompt/keywords used for post relevance and scoring
 * from the workspace product profile only.
 */
export function targetingFromProductProfile(profile: ProductProfile | null) {
  const company = profile?.companyName?.trim() || "our product";
  const description = profile?.description?.trim() || "";
  const pain = profile?.painPointsText?.trim() || "";
  const useCases = (profile?.useCases || []).map((value) => value.trim()).filter(Boolean);
  const painPoints = (profile?.painPoints || []).map((value) => value.trim()).filter(Boolean);
  const keywords = unique([
    ...(profile?.keywords || []),
    ...useCases,
    ...painPoints,
    ...(profile?.keyFeatures || []),
    profile?.industry || "",
  ]);

  const promptParts = [
    description
      ? `Find people who would buy ${company}: ${description}`
      : `Find people who would buy ${company} based on public interest in similar products.`,
    pain ? `Problems it solves: ${pain}` : "",
    useCases.length ? `Use cases: ${useCases.join("; ")}` : "",
    (profile?.targetBuyers || []).length
      ? `Typical buyers: ${(profile?.targetBuyers || []).join("; ")}`
      : "",
  ].filter(Boolean);

  return {
    prompt: promptParts.join("\n").slice(0, 4000),
    // Empty titles/industries/locations on purpose: commenters are the ICP.
    // Keywords drive product-relevant post ranking only.
    filters: {
      titles: [] as string[],
      industries: [] as string[],
      locations: [] as string[],
      keywords,
    },
  };
}

function unique(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length >= 2)),
  ).slice(0, 24);
}

export function productProfileIsReadyForSteal(profile: ProductProfile | null) {
  return Boolean(
    profile?.description?.trim() ||
      profile?.painPointsText?.trim() ||
      profile?.companyName?.trim() ||
      (profile?.keywords || []).some((value) => value.trim()) ||
      (profile?.useCases || []).some((value) => value.trim()),
  );
}
