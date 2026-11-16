import { expect, test } from "bun:test";
import { hasMonthlySearchLimit, parseCompanyResults, parseLinkedInSearchUrl, parsePeopleResults, parsePostResults } from "./web-search";

// Mirrors the shape of LinkedIn's current server-rendered search page:
// result anchors with plain text lines for name, degree, headline,
// location, in hashed-class markup.
const PEOPLE_HTML = `<div data-sdui-screen="com.linkedin.sdui.flagshipnav.search.SearchResultsPeople">
<a href="https://www.linkedin.com/in/ankittgaur/"><div>Ankitt Gaur</div><span>Ankitt Gaur</span><span>• 2nd</span><p>Founder &amp; CEO OrbitXpay.com</p><p>Dubai, United Arab Emirates</p><img src="https://media.licdn.com/dms/image/ankitt.jpg"></a>
<a href="https://www.linkedin.com/in/skandrani/"><div>Shai Skandrani</div><span>Shai Skandrani</span><span>• 3rd</span><p>CEO &amp; Founder at Webstick</p><p>Israel</p></a>
<a href="https://www.linkedin.com/in/ankittgaur/"><div>duplicate anchor</div></a>
</div>`;

const COMPANY_HTML = `<div data-sdui-screen="com.linkedin.sdui.flagshipnav.search.SearchResultsCompanies">
<a href="https://www.linkedin.com/company/tech-foundry-global/"></a>
<a href="https://www.linkedin.com/company/tech-foundry-global/"><div>Tech Foundry</div><span>Tech Foundry</span><p>Technology, Information and Internet</p><p>London</p><span>Follow</span></a>
<a href="https://www.linkedin.com/company/techbarcelona2021/"><div>Tech Barcelona</div><span>Tech Barcelona</span><p>Non-profit Organizations</p><p>Barcelona</p></a>
</div>`;

test("people results parse name, headline, location, degree and picture", () => {
  const items = parsePeopleResults(PEOPLE_HTML);
  expect(items).toHaveLength(2);
  expect(items[0]).toMatchObject({
    public_identifier: "ankittgaur",
    profile_url: "https://www.linkedin.com/in/ankittgaur/",
    name: "Ankitt Gaur",
    headline: "Founder & CEO OrbitXpay.com",
    location: "Dubai, United Arab Emirates",
    network_distance: "DISTANCE_2",
    profile_picture_url: "https://media.licdn.com/dms/image/ankitt.jpg",
  });
  expect(items[1].name).toBe("Shai Skandrani");
  expect(items[1].network_distance).toBe("DISTANCE_3");
});

test("company results parse name, industry and location, and keep the slug as public identifier", () => {
  const items = parseCompanyResults(COMPANY_HTML);
  expect(items).toHaveLength(2);
  expect(items[0]).toMatchObject({
    id: "tech-foundry-global",
    public_identifier: "tech-foundry-global",
    name: "Tech Foundry",
    industry: "Technology, Information and Internet",
    location: "London",
  });
});

test("post results pair activity ids with their card text in order", () => {
  const html = String.raw`<div data-sdui-screen="com.linkedin.sdui.flagshipnav.search.SearchResultsContent">
<div>Feed post</div><div>Mehdi Lakhdhar</div><span>• 3rd+</span><p>Applied AI Engineer</p><span>5d</span><span>Follow</span><p>AI is not just chatbots anymore.</p>
<script>{\"activityId\":\"7526055256527638528\"},{\"postSlugUrl\":\"https://www.linkedin.com/posts/mehdi_ugcPost-7526055158959493120-6Olb\"}</script>
</div>`;
  const items = parsePostResults(html);
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({
    id: "7526055256527638528",
    social_id: "urn:li:activity:7526055256527638528",
    share_url: "https://www.linkedin.com/posts/mehdi_ugcPost-7526055158959493120-6Olb",
    author: { name: "Mehdi Lakhdhar", headline: "Applied AI Engineer" },
  });
  expect(items[0].text).toContain("chatbots");
});

test("copied LinkedIn URLs parse into the search they describe", () => {
  expect(parseLinkedInSearchUrl("https://www.linkedin.com/search/results/people/?keywords=founder&geoUrn=%5B%22101282230%22%5D&currentCompany=%5B%22853178%22%5D")).toEqual({
    kind: "search",
    resultType: "PEOPLE",
    keywords: "founder",
    filters: [
      { key: "geoUrn", values: ["101282230"] },
      { key: "currentCompany", values: ["853178"] },
    ],
  });
  expect(parseLinkedInSearchUrl("https://www.linkedin.com/search/results/companies/?keywords=tech")).toMatchObject({ kind: "search", resultType: "COMPANIES", keywords: "tech" });
  expect(parseLinkedInSearchUrl("https://www.linkedin.com/search/results/content/?keywords=AI")).toMatchObject({ kind: "search", resultType: "CONTENT" });
  expect(parseLinkedInSearchUrl("https://www.linkedin.com/in/ankittgaur/")).toEqual({ kind: "profile", identifier: "ankittgaur" });
  expect(parseLinkedInSearchUrl("https://www.linkedin.com/company/tech-mahindra/")).toEqual({ kind: "company", identifier: "tech-mahindra" });
  expect(parseLinkedInSearchUrl("https://www.linkedin.com/sales/search/people?keywords=cto")).toMatchObject({ kind: "search", resultType: "PEOPLE", keywords: "cto" });
  expect(parseLinkedInSearchUrl("https://www.linkedin.com/sales/search/people?query=(keywords:%22vp%20sales%22)")).toMatchObject({ keywords: "vp sales" });
  expect(parseLinkedInSearchUrl("https://example.com/search/results/people/?keywords=x")).toBeNull();
  expect(parseLinkedInSearchUrl("https://www.linkedin.com/feed/")).toBeNull();
  expect(parseLinkedInSearchUrl("not a url")).toBeNull();
});

test("pages without a results region return nothing instead of navigation links", () => {
  expect(parsePeopleResults(`<a href="https://www.linkedin.com/in/me/">Me</a>`)).toEqual([]);
});

test("people cards with mutual-connection anchors still keep the card owner and extract Flight memberId + avatar", () => {
  const html = `<div data-sdui-screen="com.linkedin.sdui.flagshipnav.search.SearchResultsPeople">
    <div role="listitem">
      <a href="https://www.linkedin.com/in/ypatni/">
        <div id="label-1">Yash Patni</div>
        <figure aria-labelledby="label-1"></figure>
        <p>Yash Patni • 2nd</p>
        <p>Software Engineer @ Stripe</p>
        <p>Seattle, Washington, United States</p>
      </a>
      <div id="SearchResultsACoAADINs4gBDQbkrFTvSCwqfcldRd1sUoZ5s7A"></div>
      <div id="SearchResultssnippet_ACoAADINs4gBDQbkrFTvSCwqfcldRd1sUoZ5s7A">
        <p><a href="https://www.linkedin.com/in/sdow/">Sam Dow</a> &amp; <a href="https://www.linkedin.com/in/adam-helmey/">Adam Helmey</a> are mutual connections</p>
      </div>
    </div>
    <script id="rehydrate-data">window.__como_rehydration__ = ${JSON.stringify([
      JSON.stringify({
        profileNavTargets: {
          "ACoAADINs4gBDQbkrFTvSCwqfcldRd1sUoZ5s7A": "https://www.linkedin.com/in/ypatni",
        },
        "aria-labelledby": "label-1",
        renderPayload: {
          rootUrl: "https://media.licdn.com/dms/image/v2/photo_",
          imageRenditions: [{ width: 400, height: 400, suffixUrl: "400_400.jpg" }],
        },
      }),
    ])}</script>
  </div>`;
  const items = parsePeopleResults(html);
  expect(items).toEqual([
    {
      id: "ACoAADINs4gBDQbkrFTvSCwqfcldRd1sUoZ5s7A",
      provider_id: "ACoAADINs4gBDQbkrFTvSCwqfcldRd1sUoZ5s7A",
      public_identifier: "ypatni",
      profile_url: "https://www.linkedin.com/in/ypatni/",
      name: "Yash Patni",
      headline: "Software Engineer @ Stripe",
      location: "Seattle, Washington, United States",
      profile_picture_url: "https://media.licdn.com/dms/image/v2/photo_400_400.jpg",
      network_distance: "DISTANCE_2",
    },
  ]);
});

test("the monthly search limit is read from LinkedIn's notice on a nearly empty page", () => {
  const notice = "<section><h2>You've reached the monthly limit for profile searches</h2></section>";
  expect(hasMonthlySearchLimit(`${PEOPLE_HTML}${notice}`, 2)).toBe(true);
  expect(hasMonthlySearchLimit(PEOPLE_HTML, 2)).toBe(false);
  // A full page is not limited, whatever text a bundle carries.
  expect(hasMonthlySearchLimit(`${PEOPLE_HTML}${notice}`, 10)).toBe(false);
});
