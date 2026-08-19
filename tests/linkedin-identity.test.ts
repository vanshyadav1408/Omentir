import { describe, expect, test } from "bun:test";
import {
  firstDegreeFromUnipileProfile,
  linkedInIdentityKeys,
  normalizePersonName,
  pickLeadForProviderIdentity,
} from "../src/lib/linkedin-identity";

describe("linkedInIdentityKeys", () => {
  test("joins a vanity URL with a Classic provider id", () => {
    expect(
      linkedInIdentityKeys({
        providerProfileId: "ACoAAAexample",
        linkedInUrl: "https://www.linkedin.com/in/NeerajShah/",
      }),
    ).toEqual(["acoaaaexample", "neerajshah"]);
  });

  test("keeps a Sales Navigator member id from a /sales/lead URL", () => {
    expect(
      linkedInIdentityKeys({
        linkedInUrl: "https://www.linkedin.com/sales/lead/ACwAAAsalesnav,NAME_SEARCH,xyz",
      }),
    ).toContain("acwaaasalesnav,name_search,xyz");
  });
});

describe("pickLeadForProviderIdentity", () => {
  test("matches a new_relation webhook to a stored vanity URL even when Classic and Sales Navigator ids differ", () => {
    expect(
      pickLeadForProviderIdentity(
        [
          {
            name: "Neeraj Shah ⚡️",
            providerProfileId: "ACwAAAsales",
            linkedInUrl: "https://www.linkedin.com/in/neerajshah",
          },
        ],
        {
          providerProfileId: "ACoAAAclassic",
          publicIdentifier: "neerajshah",
          linkedInUrl: "https://www.linkedin.com/in/neerajshah/",
        },
      )?.providerProfileId,
    ).toBe("ACwAAAsales");
  });

  test("matches by unique pending-invite name when the stored URL is Sales Navigator only", () => {
    expect(
      pickLeadForProviderIdentity(
        [
          {
            name: "Neeraj Shah ⚡️",
            providerProfileId: "ACwAAAsales",
            linkedInUrl: "https://www.linkedin.com/sales/lead/ACwAAAsales",
          },
          {
            name: "Other Person",
            providerProfileId: "ACoAAAother",
            linkedInUrl: "https://www.linkedin.com/in/other-person",
          },
        ],
        {
          providerProfileId: "ACoAAAclassic",
          publicIdentifier: "some-other-slug",
          name: "Neeraj Shah ⚡️",
        },
      )?.providerProfileId,
    ).toBe("ACwAAAsales");
  });

  test("does not guess when two pending invites share a name", () => {
    expect(
      pickLeadForProviderIdentity(
        [
          { name: "Alex Kim", linkedInUrl: "https://www.linkedin.com/in/alex-a" },
          { name: "Alex Kim", linkedInUrl: "https://www.linkedin.com/in/alex-b" },
        ],
        { name: "Alex Kim" },
      ),
    ).toBeNull();
  });
});

describe("normalizePersonName", () => {
  test("drops emoji so LinkedIn display names still match", () => {
    expect(normalizePersonName("Neeraj Shah ⚡️")).toBe("neeraj shah");
  });
});

describe("firstDegreeFromUnipileProfile", () => {
  test("treats is_relationship as connected even when network_distance is missing", () => {
    expect(firstDegreeFromUnipileProfile({ is_relationship: true })).toBe(true);
  });

  test("reads Unipile's FIRST_DEGREE distance", () => {
    expect(firstDegreeFromUnipileProfile({ network_distance: "FIRST_DEGREE" })).toBe(true);
    expect(firstDegreeFromUnipileProfile({ network_distance: "THIRD_DEGREE" })).toBe(false);
  });
});
