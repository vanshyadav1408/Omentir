import { expect, test } from "bun:test";
import {
  activityTimestamp,
  collectionElements,
  profileIdFromUrn,
  restliEncode,
  restliList,
  text,
  vectorImageUrl,
  VoyagerIndex,
} from "./voyager";

test("activity ids give the exact post time, which drives signal freshness", () => {
  // 2024-01-15T10:00:00Z shifted into the top bits of a LinkedIn activity id.
  const ms = Date.UTC(2024, 0, 15, 10, 0, 0);
  const id = (BigInt(ms) << BigInt(22)).toString();
  expect(activityTimestamp(id)).toBe(new Date(ms).toISOString());
  // Garbage must not become a plausible-looking date that keeps a stale post "fresh".
  expect(activityTimestamp("123")).toBeUndefined();
  expect(activityTimestamp(undefined)).toBeUndefined();
  const future = (BigInt(Date.now() + 30 * 24 * 3600 * 1000) << BigInt(22)).toString();
  expect(activityTimestamp(future)).toBeUndefined();
});

test("normalized references resolve whether LinkedIn inlines them or not", () => {
  const response = {
    data: { "*elements": ["urn:li:fsd_profile:ACoA1"] },
    included: [
      { entityUrn: "urn:li:fsd_profile:ACoA1", $type: "com.linkedin.voyager.dash.identity.profile.Profile", "*geo": "urn:li:fsd_geo:1" },
      { entityUrn: "urn:li:fsd_geo:1", defaultLocalizedName: "Berlin, Germany" },
    ],
  };
  const index = new VoyagerIndex(response);
  const [profile] = collectionElements(response, index);
  expect(index.ref(profile, "geo")?.defaultLocalizedName).toBe("Berlin, Germany");
  expect(index.ref({ geo: { defaultLocalizedName: "Inline" } }, "geo")?.defaultLocalizedName).toBe("Inline");
});

test("the largest image rendition is used for avatars", () => {
  const url = vectorImageUrl({
    displayImageReference: {
      vectorImage: {
        rootUrl: "https://media.licdn.com/dms/image/abc/",
        artifacts: [
          { width: 100, fileIdentifyingUrlPathSegment: "100_100/x" },
          { width: 800, fileIdentifyingUrlPathSegment: "800_800/x" },
        ],
      },
    },
  });
  expect(url).toBe("https://media.licdn.com/dms/image/abc/800_800/x");
  expect(vectorImageUrl({ url: "http://insecure.example/x.png" })).toBeUndefined();
});

test("member ids come out of every urn flavour LinkedIn uses for people", () => {
  expect(profileIdFromUrn("urn:li:fsd_profile:ACoAAB")).toBe("ACoAAB");
  expect(profileIdFromUrn("urn:li:fs_miniProfile:ACoAAB")).toBe("ACoAAB");
  expect(profileIdFromUrn("urn:li:fsd_company:123")).toBeUndefined();
  expect(text({ text: "  Head of Sales  " })).toBe("Head of Sales");
});

test("Rest.li syntax characters inside values are escaped, so a urn cannot break the query", () => {
  const urn = "urn:li:msg_conversation:(urn:li:fsd_profile:ACo1,2-abc=)";
  const encoded = restliEncode(urn);
  expect(encoded).not.toMatch(/[(),:]/);
  expect(decodeURIComponent(encoded)).toBe(urn);
  expect(restliList(["a,b", "c"])).toBe("List(a%2Cb,c)");
});
