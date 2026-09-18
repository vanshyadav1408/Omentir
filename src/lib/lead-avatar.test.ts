import { describe, expect, test } from "bun:test";
import {
  avatarImgCandidates,
  durableLeadAvatarUrl,
  durableLeadAvatarUrlWithRetry,
  httpsAvatarUrl,
  leadAvatarRefreshIdentifier,
  leadAvatarRefreshIdentifiers,
  leadAvatarUrlCanBePersisted,
  isExpiredLinkedInMediaUrl,
  isLinkedInMediaUrl,
  personInitials,
  proxiedAvatarUrl,
} from "./lead-avatar";

describe("httpsAvatarUrl", () => {
  test("keeps a public https headshot and drops empty or non-url values so the UI can fall back to initials", () => {
    expect(httpsAvatarUrl("https://media.licdn.com/dms/image/photo.jpg")).toBe(
      "https://media.licdn.com/dms/image/photo.jpg",
    );
    expect(httpsAvatarUrl("")).toBeUndefined();
    expect(httpsAvatarUrl("ACoAABexample")).toBeUndefined();
    expect(httpsAvatarUrl("http://insecure.example/photo.jpg")).toBeUndefined();
  });

  test("rejects a LinkedIn profile page so it is not loaded as an <img>", () => {
    expect(httpsAvatarUrl("https://www.linkedin.com/in/ada-lovelace")).toBeUndefined();
    expect(
      httpsAvatarUrl({
        url: "https://www.linkedin.com/in/ada-lovelace",
        headline: "Founder",
      }),
    ).toBeUndefined();
  });

  test("upgrades protocol-relative and http licdn URLs because LinkedIn still serves those photos over https", () => {
    expect(httpsAvatarUrl("//media.licdn.com/dms/image/photo.jpg")).toBe(
      "https://media.licdn.com/dms/image/photo.jpg",
    );
    expect(httpsAvatarUrl("http://media.licdn.com/dms/image/photo.jpg")).toBe(
      "https://media.licdn.com/dms/image/photo.jpg",
    );
  });

  test("decodes LinkedIn query entities because &amp; in e=/t= makes the signed URL 403", () => {
    const raw =
      "https://media.licdn.com/dms/image/v2/photo/0?e=1775088000&amp;v=beta&amp;t=abc";
    expect(httpsAvatarUrl(raw)).toBe(
      "https://media.licdn.com/dms/image/v2/photo/0?e=1775088000&v=beta&t=abc",
    );
  });

  test("reads Unipile nested picture objects and prefers the large headshot over a company logo field", () => {
    expect(
      httpsAvatarUrl({
        profile_picture_url_large: "https://media.licdn.com/large.jpg",
        profile_picture_url: "https://media.licdn.com/small.jpg",
        company_picture_url: "https://media.licdn.com/logo.png",
      }),
    ).toBe("https://media.licdn.com/large.jpg");

    expect(
      httpsAvatarUrl({
        picture: { urls: { small: "https://media.licdn.com/nested.jpg" } },
      }),
    ).toBe("https://media.licdn.com/nested.jpg");
  });

  test("reads Unipile v2 public and private picture fields from specifics", () => {
    expect(
      httpsAvatarUrl({
        specifics: {
          public_picture_url: "https://media.licdn.com/public.jpg",
          private_picture_download_url: "https://api.unipile.com/pictures/1",
        },
      }),
    ).toBe("https://media.licdn.com/public.jpg");
  });
});

describe("proxiedAvatarUrl", () => {
  test("keeps a same-origin fallback for licdn URLs when the browser blocks the CDN", () => {
    const source = "https://media.licdn.com/dms/image/v2/abc.jpg?e=2000000000&t=2";
    expect(isLinkedInMediaUrl(source)).toBe(true);
    expect(proxiedAvatarUrl(source)).toBe(`/api/app/avatar?u=${encodeURIComponent(source)}`);
    expect(proxiedAvatarUrl("https://images.example.com/a.jpg")).toBeUndefined();
  });

  test("still proxies an expired LinkedIn e= token so a CDN that still has the file is not skipped", () => {
    const source = "https://media.licdn.com/dms/image/v2/abc.jpg?e=1784764800&t=2";
    expect(isExpiredLinkedInMediaUrl(source, 1_789_600_000_000)).toBe(true);
    expect(proxiedAvatarUrl(source)).toBe(`/api/app/avatar?u=${encodeURIComponent(source)}`);
  });
});

describe("avatarImgCandidates", () => {
  test("tries the live photo before the lead-keyed cache so a cache miss does not hide a working CDN url", () => {
    const source = "https://media.licdn.com/dms/image/v2/abc.jpg?e=2000000000&t=2";
    expect(avatarImgCandidates({ leadId: "lead-1", avatarUrl: source }, 1_780_000_000_000)).toEqual([
      source,
      `/api/app/avatar?u=${encodeURIComponent(source)}`,
      "/api/app/avatar?leadId=lead-1",
    ]);
  });

  test("skips a direct expired CDN load and still tries the proxy plus the cached lead photo", () => {
    const source = "https://media.licdn.com/dms/image/v2/abc.jpg?e=1784764800&t=2";
    expect(avatarImgCandidates({ leadId: "lead-1", avatarUrl: source }, 1_789_600_000_000)).toEqual([
      `/api/app/avatar?u=${encodeURIComponent(source)}`,
      "/api/app/avatar?leadId=lead-1",
    ]);
  });
});

describe("durableLeadAvatarUrl", () => {
  test("keys the same-origin photo by lead id so an expired LinkedIn token does not blank every page", () => {
    expect(durableLeadAvatarUrl("lead-1")).toBe("/api/app/avatar?leadId=lead-1");
    expect(durableLeadAvatarUrl("")).toBeUndefined();
  });

  test("cache-busts retries so a 404 from a still-running refresh is not stuck as initials", () => {
    expect(durableLeadAvatarUrlWithRetry("lead-1", 0)).toBe("/api/app/avatar?leadId=lead-1");
    expect(durableLeadAvatarUrlWithRetry("lead-1", 2)).toBe("/api/app/avatar?leadId=lead-1&r=2");
  });
});

describe("leadAvatarRefreshIdentifier", () => {
  test("prefers a LinkedIn provider id over a profile URL so Unipile can fetch a fresh headshot", () => {
    expect(
      leadAvatarRefreshIdentifier({
        providerProfileId: "ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ",
        linkedInUrl: "https://www.linkedin.com/in/ada-lovelace",
      }),
    ).toBe("ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ");
    expect(
      leadAvatarRefreshIdentifier({
        linkedInUrl: "https://www.linkedin.com/in/ada-lovelace",
      }),
    ).toBe("https://www.linkedin.com/in/ada-lovelace");
    expect(leadAvatarRefreshIdentifier({})).toBe("");
  });

  test("keeps the profile URL as a second identifier when the provider id is stale", () => {
    expect(
      leadAvatarRefreshIdentifiers({
        providerProfileId: "ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ",
        linkedInUrl: "https://www.linkedin.com/in/ada-lovelace",
      }),
    ).toEqual([
      "ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ",
      "https://www.linkedin.com/in/ada-lovelace",
    ]);
  });
});

describe("leadAvatarUrlCanBePersisted", () => {
  test("refuses expired LinkedIn CDN tokens so the production VPS does not fetch a URL that already 404s", () => {
    const live = "https://media.licdn.com/dms/image/v2/abc.jpg?e=2000000000&t=2";
    const expired = "https://media.licdn.com/dms/image/v2/abc.jpg?e=1784764800&t=2";
    expect(leadAvatarUrlCanBePersisted(live, 1_780_000_000_000)).toBe(true);
    expect(leadAvatarUrlCanBePersisted(expired, 1_789_600_000_000)).toBe(false);
    expect(leadAvatarUrlCanBePersisted("https://api.unipile.com/pictures/1", 1_789_600_000_000)).toBe(
      true,
    );
    expect(leadAvatarUrlCanBePersisted("", 1_789_600_000_000)).toBe(false);
  });
});

describe("personInitials", () => {
  test("uses the first letters of the name when the photo is missing", () => {
    expect(personInitials("Ada Lovelace")).toBe("AL");
    expect(personInitials("")).toBe("?");
  });
});
