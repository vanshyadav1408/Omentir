import { describe, expect, test } from "bun:test";
import {
  hasUsableBookingLink,
  normalizeSchedulingLink,
  resolveBookingLink,
  shouldSyncCampaignBookingLink,
} from "./scheduling-link";

describe("normalizeSchedulingLink", () => {
  test("accepts any https scheduler URL because setup copy tells people to paste any meeting link", () => {
    expect(normalizeSchedulingLink("https://calendly.com/vansh/intro")).toBe(
      "https://calendly.com/vansh/intro",
    );
    expect(normalizeSchedulingLink("https://cal.com/vansh/intro")).toBe(
      "https://cal.com/vansh/intro",
    );
    expect(normalizeSchedulingLink("https://meetings.hubspot.com/vansh")).toBe(
      "https://meetings.hubspot.com/vansh",
    );
    expect(normalizeSchedulingLink("https://calendar.app.google/abc")).toBe(
      "https://calendar.app.google/abc",
    );
    expect(normalizeSchedulingLink("https://savvycal.com/vansh/intro")).toBe(
      "https://savvycal.com/vansh/intro",
    );
    expect(normalizeSchedulingLink("https://book.acme.io/demo")).toBe(
      "https://book.acme.io/demo",
    );
    expect(normalizeSchedulingLink("https://outlook.office.com/bookwithme/")).toBe(
      "https://outlook.office.com/bookwithme/",
    );
  });

  test("accepts a scheme-less custom book page so an unknown scheduler still saves", () => {
    expect(normalizeSchedulingLink("book.acme.io/demo")).toBe(
      "https://book.acme.io/demo",
    );
  });

  test("prefixes https when people paste calendly.com without a scheme, which is the usual copy-paste", () => {
    expect(normalizeSchedulingLink("calendly.com/vansh/30min")).toBe(
      "https://calendly.com/vansh/30min",
    );
  });

  test("upgrades http so an http Calendly share link still saves", () => {
    expect(normalizeSchedulingLink("http://cal.com/vansh")).toBe("https://cal.com/vansh");
  });

  test("treats empty as unset so saving My Product without a booking link does not fail", () => {
    expect(normalizeSchedulingLink("")).toBe("");
    expect(normalizeSchedulingLink("   ")).toBe("");
  });

  test("rejects javascript and hostless values so a garbage paste cannot be stored as a booking link", () => {
    expect(normalizeSchedulingLink("javascript:alert(1)")).toBe(null);
    expect(normalizeSchedulingLink("not a link")).toBe(null);
    expect(normalizeSchedulingLink("https://localhost/book")).toBe(null);
  });
});

describe("hasUsableBookingLink", () => {
  test("marks the overview booking step done for the pastes that used to error on save", () => {
    expect(hasUsableBookingLink("https://meetings.hubspot.com/vansh")).toBe(true);
    expect(hasUsableBookingLink("calendly.com/vansh/30min")).toBe(true);
    expect(hasUsableBookingLink("https://cal.com/vansh/intro")).toBe(true);
    expect(hasUsableBookingLink("https://book.acme.io/demo")).toBe(true);
    expect(hasUsableBookingLink("savvycal.com/vansh/intro")).toBe(true);
    expect(hasUsableBookingLink("")).toBe(false);
    expect(hasUsableBookingLink("not a link")).toBe(false);
  });
});

describe("resolveBookingLink", () => {
  test("prefers a campaign override and then the My Product link so until-booked agents can share one calendar", () => {
    expect(
      resolveBookingLink("https://cal.com/agent", "https://calendly.com/workspace"),
    ).toBe("https://cal.com/agent");
    expect(resolveBookingLink("", "meetings.hubspot.com/vansh")).toBe(
      "https://meetings.hubspot.com/vansh",
    );
  });
});

describe("shouldSyncCampaignBookingLink", () => {
  test("updates until-booked agents that still have the old My Product URL so changing Calendly later actually sticks", () => {
    expect(
      shouldSyncCampaignBookingLink({
        replyHandling: "ai_until_booked",
        campaignBookingLink: "https://calendly.com/old/intro",
        previousWorkspaceLink: "https://calendly.com/old/intro",
        nextWorkspaceLink: "https://cal.com/new/intro",
      }),
    ).toBe(true);
    expect(
      shouldSyncCampaignBookingLink({
        replyHandling: "ai_until_booked",
        campaignBookingLink: "",
        previousWorkspaceLink: "https://calendly.com/old/intro",
        nextWorkspaceLink: "https://cal.com/new/intro",
      }),
    ).toBe(true);
  });

  test("leaves a per-agent override alone so editing My Product does not rewrite a different calendar", () => {
    expect(
      shouldSyncCampaignBookingLink({
        replyHandling: "ai_until_booked",
        campaignBookingLink: "https://cal.com/agent-override",
        previousWorkspaceLink: "https://calendly.com/workspace",
        nextWorkspaceLink: "https://calendly.com/workspace-new",
      }),
    ).toBe(false);
    expect(
      shouldSyncCampaignBookingLink({
        replyHandling: "ai_until_interest",
        campaignBookingLink: "",
        previousWorkspaceLink: "",
        nextWorkspaceLink: "https://cal.com/new",
      }),
    ).toBe(false);
  });
});
