import { describe, expect, test } from "bun:test";
import {
  extraLinkedInSeatMonthlyTotalUsd,
  extraLinkedInSeatPlanTitle,
  extraLinkedInSeatRateDescription,
  extraLinkedInSeatUnitPriceUsd,
  extraLinkedInSeatsFromMetadata,
  extraLinkedInSeatsFromPlanTitle,
  extraLinkedInSeatsFromWhopFields,
  extraSeatBuyerEmails,
  extraSeatMonthlyPriceLabel,
  extraSeatMonthlyUsdFromWhopMoney,
  extraSeatMonthlyUsdFromWhopSources,
  extraSeatWhopMembershipMatchesBuyer,
  isAlreadyTerminatedWhopMembershipError,
  overlayOwnerExtraLinkedInSeats,
  isLinkedInSeatCheckoutMetadata,
  isLinkedInSeatProduct,
  isLinkedInSeatWhopObject,
  LINKEDIN_SEAT_PRODUCT_TITLE,
  mergeLinkedInSeatFields,
  parseExtraLinkedInSeatCount,
  selectExtraSeatMembership,
} from "./linkedin-seat-pricing";

describe("extra LinkedIn seat pricing", () => {
  test("stacks extra-seat bands so six extra accounts cost more than five instead of rewriting the cart", () => {
    expect(extraLinkedInSeatUnitPriceUsd(5)).toBe(40);
    expect(extraLinkedInSeatUnitPriceUsd(6)).toBe(30);
    expect(extraLinkedInSeatMonthlyTotalUsd(5)).toBe(200);
    expect(extraLinkedInSeatMonthlyTotalUsd(6)).toBe(230);
  });

  test("keeps the first ten extra seats billed when the eleventh is added at $25", () => {
    expect(extraLinkedInSeatUnitPriceUsd(10)).toBe(30);
    expect(extraLinkedInSeatUnitPriceUsd(11)).toBe(25);
    expect(extraLinkedInSeatMonthlyTotalUsd(10)).toBe(350);
    expect(extraLinkedInSeatMonthlyTotalUsd(11)).toBe(375);
  });

  test("never lowers the extra-seat bill when the buyer adds one more account", () => {
    for (let extraSeats = 2; extraSeats <= 100; extraSeats += 1) {
      expect(extraLinkedInSeatMonthlyTotalUsd(extraSeats)).toBeGreaterThan(
        extraLinkedInSeatMonthlyTotalUsd(extraSeats - 1),
      );
    }
  });

  test("describes stacked extra-seat rates so Settings cannot show one rewritten unit price", () => {
    expect(extraLinkedInSeatMonthlyTotalUsd(1)).toBe(40);
    expect(extraLinkedInSeatMonthlyTotalUsd(15)).toBe(475);
    expect(extraLinkedInSeatRateDescription()).toBe(
      "Extra accounts are $40/month each for the first 5, $30/month each for the next 5, then $25/month each.",
    );
  });

  test("rejects a zero or junk seat count so checkout cannot start an empty add-on", () => {
    expect(parseExtraLinkedInSeatCount("0")).toBeNull();
    expect(parseExtraLinkedInSeatCount("nope")).toBeNull();
    expect(parseExtraLinkedInSeatCount("7")).toBe(7);
  });

  test("keeps Whop plan titles at or under 30 characters so dynamic checkout is not rejected", () => {
    expect(extraLinkedInSeatPlanTitle(8)).toBe("Extra Seats (8)");
    expect(extraLinkedInSeatPlanTitle(1).length).toBeLessThanOrEqual(30);
    expect(extraLinkedInSeatPlanTitle(100).length).toBeLessThanOrEqual(30);
  });
});

describe("Whop extra-seat metadata", () => {
  test("only treats signed checkout metadata as extra seats so a Pro membership cannot be read as a seat add-on", () => {
    expect(
      isLinkedInSeatCheckoutMetadata({ kind: "linkedin_seats", extraSeats: "10" }),
    ).toBe(true);
    expect(isLinkedInSeatCheckoutMetadata({ plan: "solo" })).toBe(false);
    expect(
      extraLinkedInSeatsFromMetadata({ kind: "linkedin_seats", extraSeats: "10" }),
    ).toBe(10);
    expect(extraLinkedInSeatsFromMetadata({ plan: "solo", extraSeats: "10" })).toBeNull();
    expect(
      extraLinkedInSeatsFromMetadata({ kind: "linkedin_seats", extraSeats: 8 }),
    ).toBe(8);
  });

  test("reads extra seats from the Extra Seats plan title when checkout metadata never reaches the webhook", () => {
    expect(extraLinkedInSeatsFromPlanTitle("Extra Seats (8)")).toBe(8);
    expect(
      extraLinkedInSeatsFromWhopFields({
        product: { title: LINKEDIN_SEAT_PRODUCT_TITLE },
        planTitle: "Extra Seats (8)",
      }),
    ).toBe(8);
    expect(
      extraLinkedInSeatsFromWhopFields({
        product: { title: "Omentir Pro" },
        metadata: { extraSeats: "8" },
      }),
    ).toBeNull();
    expect(isLinkedInSeatWhopObject({ product: { title: LINKEDIN_SEAT_PRODUCT_TITLE } })).toBe(
      true,
    );
  });

  test("finds the extra-seat Whop product by kind so checkout does not attach add-on plans to Pro", () => {
    expect(
      isLinkedInSeatProduct({
        title: "Something else",
        metadata: { kind: "linkedin_seats" },
      }),
    ).toBe(true);
    expect(isLinkedInSeatProduct({ title: LINKEDIN_SEAT_PRODUCT_TITLE })).toBe(true);
    expect(isLinkedInSeatProduct({ title: "Omentir extra LinkedIn accounts" })).toBe(true);
    expect(isLinkedInSeatProduct({ title: "Omentir Pro" })).toBe(false);
  });

  test("a Pro billing write that omits extra seats keeps the paid add-on so a renewal cannot drop LinkedIn capacity", () => {
    expect(
      mergeLinkedInSeatFields(
        { extraLinkedInSeats: 4, seatMembershipId: "mem_seats" },
        {},
      ),
    ).toEqual({ extraLinkedInSeats: 4, seatMembershipId: "mem_seats" });
  });

  test("explicit extra-seat zero clears the add-on when Pro is cancelled", () => {
    expect(
      mergeLinkedInSeatFields(
        { extraLinkedInSeats: 4, seatMembershipId: "mem_seats" },
        { extraLinkedInSeats: 0 },
      ),
    ).toEqual({ extraLinkedInSeats: 0, seatMembershipId: "mem_seats" });
  });

  test("keeps a $0 Extra Seats price from Whop so a discounted add-on does not jump back to list price", () => {
    expect(
      mergeLinkedInSeatFields(
        { extraLinkedInSeats: 15, extraSeatMonthlyUsd: 0 },
        { extraLinkedInSeats: 15 },
      ),
    ).toEqual({ extraLinkedInSeats: 15, extraSeatMonthlyUsd: 0, seatMembershipId: undefined });
  });

  test("matches Extra Seats bought while logged into Whop as the company admin so production can copy the add-on", () => {
    const membership = {
      metadata: {
        kind: "linkedin_seats",
        extraSeats: "15",
        email: "buyer@example.com",
        workspaceId: "user_workspace",
      },
      userEmail: "owner@whop-company.example",
    };
    expect(
      extraSeatWhopMembershipMatchesBuyer(membership, {
        workspaceId: "user_workspace",
        emails: ["buyer@example.com"],
      }),
    ).toBe(true);
    expect(
      extraSeatWhopMembershipMatchesBuyer(membership, {
        emails: ["buyer@example.com"],
      }),
    ).toBe(true);
    expect(
      extraSeatWhopMembershipMatchesBuyer(membership, {
        emails: ["someone-else@example.com"],
      }),
    ).toBe(false);
  });

  test("matches Extra Seats when any of the buyer's emails is on the membership", () => {
    expect(
      extraSeatWhopMembershipMatchesBuyer(
        { metadata: { kind: "linkedin_seats", emails: "work@example.com,personal@example.com" } },
        { emails: ["personal@example.com", "other@example.com"] },
      ),
    ).toBe(true);
    expect(extraSeatBuyerEmails(["Work@example.com, personal@example.com"])).toEqual([
      "work@example.com",
      "personal@example.com",
    ]);
  });

  test("uses Extra Seats from the original account so an extra workspace can connect the paid LinkedIn accounts", () => {
    const extra = overlayOwnerExtraLinkedInSeats(
      {
        id: "ws_extra",
        billing: { extraLinkedInSeats: 0, seatMembershipId: undefined },
      },
      {
        id: "user_1",
        billing: { extraLinkedInSeats: 15, seatMembershipId: "mem_fifteen", extraSeatMonthlyUsd: 0 },
      },
    );
    expect(extra.billing).toEqual({
      extraLinkedInSeats: 15,
      seatMembershipId: "mem_fifteen",
      extraSeatMonthlyUsd: 0,
    });
  });

  test("keeps leftover Extra Seats on an extra workspace until they are stored on the original account", () => {
    const extra = overlayOwnerExtraLinkedInSeats(
      {
        id: "ws_extra",
        billing: { extraLinkedInSeats: 15, seatMembershipId: "mem_fifteen" },
      },
      {
        id: "user_1",
        billing: { extraLinkedInSeats: 0 },
      },
    );
    expect(extra.billing?.extraLinkedInSeats).toBe(15);
  });

  test("matches Extra Seats onto an extra workspace when checkout stored the original account id", () => {
    expect(
      extraSeatWhopMembershipMatchesBuyer(
        { metadata: { workspaceId: "user_1", kind: "linkedin_seats" } },
        { workspaceIds: ["ws_extra", "user_1"], emails: [] },
      ),
    ).toBe(true);
  });

  test("keeps the 15-seat add-on when a later 1-seat membership is still active because cancel never ran", () => {
    const selected = selectExtraSeatMembership([
      { extraSeats: 1, membershipId: "mem_one" },
      { extraSeats: 15, membershipId: "mem_fifteen" },
    ]);
    expect(selected?.winner).toEqual({ extraSeats: 15, membershipId: "mem_fifteen" });
    expect(selected?.duplicates).toEqual([{ extraSeats: 1, membershipId: "mem_one" }]);
  });

  test("does not treat a leftover Extra Seats membership as a cancel failure once Whop has already terminated it", () => {
    expect(
      isAlreadyTerminatedWhopMembershipError(
        new Error(
          '400 {"error":{"type":"bad_request","message":"This membership has already been terminated."}}',
        ),
      ),
    ).toBe(true);
    expect(isAlreadyTerminatedWhopMembershipError(new Error("Whop API 500"))).toBe(false);
  });

  test("reads a $0 Extra Seats receipt so Settings can show the discounted Whop price", () => {
    expect(extraSeatMonthlyUsdFromWhopMoney("0.00")).toBe(0);
    expect(extraSeatMonthlyUsdFromWhopMoney({ amount: "0.00" })).toBe(0);
    expect(
      extraSeatMonthlyUsdFromWhopSources({
        payment: {
          promo_code_id: "promo_demo100",
          subtotal: { amount: "150.00" },
          total: { amount: "0.00" },
          usd_total: { amount: "0.00" },
        },
        planRenewalPrice: 150,
      }),
    ).toBe(0);
    expect(
      extraSeatMonthlyUsdFromWhopSources({
        payment: { total: 0 },
        planRenewalPrice: 150,
      }),
    ).toBe(150);
    expect(extraSeatMonthlyPriceLabel(0, 15)).toBe("$0/month");
    expect(extraSeatMonthlyPriceLabel(undefined, 15)).toBe("$475/month");
  });
});
