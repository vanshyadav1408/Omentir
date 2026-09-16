import { describe, expect, test } from "bun:test";
import {
  displayAvatarUrl,
  httpsAvatarUrl,
  isLinkedInMediaUrl,
  personInitials,
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
});

describe("displayAvatarUrl", () => {
  test("proxies licdn hosts so the browser does not send omentir.com as Referer", () => {
    const source = "https://media.licdn.com/dms/image/v2/abc.jpg?e=1&t=2";
    expect(isLinkedInMediaUrl(source)).toBe(true);
    expect(displayAvatarUrl(source)).toBe(`/api/app/avatar?u=${encodeURIComponent(source)}`);
    expect(displayAvatarUrl("https://images.example.com/a.jpg")).toBe(
      "https://images.example.com/a.jpg",
    );
    expect(displayAvatarUrl("")).toBeUndefined();
  });
});

describe("personInitials", () => {
  test("uses the first letters of the name when the photo is missing", () => {
    expect(personInitials("Ada Lovelace")).toBe("AL");
    expect(personInitials("")).toBe("?");
  });
});
