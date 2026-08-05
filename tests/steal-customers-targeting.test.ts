import { describe, expect, test } from "bun:test";
import {
  productProfileIsReadyForSteal,
  targetingFromProductProfile,
} from "../src/lib/steal-customers-targeting";
import type { ProductProfile } from "../src/lib/server/types";

function baseProfile(overrides: Partial<ProductProfile> = {}): ProductProfile {
  return {
    id: "p1",
    workspaceId: "w1",
    websiteUrl: "https://example.com",
    description: "We insure commercial fleets for mid-size logistics firms.",
    companyName: "FleetCover",
    industry: "Insurance",
    companySize: "11-50",
    painPointsText: "Hard to quote multi-vehicle policies quickly.",
    keyFeatures: ["Instant quotes", "Fleet risk scoring"],
    socialProof: [],
    linkedInCompanyPage: "",
    targetBuyers: ["Fleet managers", "Risk managers"],
    buyerTitles: ["Fleet Manager", "Risk Manager"],
    industries: ["Logistics", "Transportation"],
    companySizes: ["11-50", "51-200"],
    painPoints: ["slow quotes", "fleet risk"],
    keywords: ["commercial auto", "fleet insurance"],
    preferredLocations: ["United States"],
    useCases: ["Quote multi-vehicle policies"],
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("steal customers targeting from My Product", () => {
  test("does not invent a sales ICP title list", () => {
    const targeting = targetingFromProductProfile(baseProfile());
    expect(targeting.filters.titles).toEqual([]);
    expect(targeting.filters.industries).toEqual([]);
    expect(targeting.filters.locations).toEqual([]);
    expect(targeting.prompt).toContain("FleetCover");
    expect(targeting.prompt).toContain("commercial fleets");
    expect(targeting.filters.keywords.some((value) => /fleet|insurance|quote/i.test(value))).toBe(
      true,
    );
  });

  test("requires some product signal before steal is ready", () => {
    expect(productProfileIsReadyForSteal(null)).toBe(false);
    expect(
      productProfileIsReadyForSteal(
        baseProfile({
          description: "",
          painPointsText: "",
          companyName: "",
          keywords: [],
          useCases: [],
        }),
      ),
    ).toBe(false);
    expect(productProfileIsReadyForSteal(baseProfile())).toBe(true);
  });
});
