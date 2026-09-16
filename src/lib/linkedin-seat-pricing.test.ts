import { describe, expect, test } from "bun:test";
import {
  extraLinkedInSeatMonthlyTotalUsd,
  extraLinkedInSeatPlanTitle,
  extraLinkedInSeatUnitPriceUsd,
  extraLinkedInSeatsFromMetadata,
  extraLinkedInSeatsFromPlanTitle,
  extraLinkedInSeatsFromWhopFields,
  isLinkedInSeatCheckoutMetadata,
  isLinkedInSeatProduct,
  isLinkedInSeatWhopObject,
  LINKEDIN_SEAT_PRODUCT_TITLE,
  mergeLinkedInSeatFields,
  parseExtraLinkedInSeatCount,
} from "./linkedin-seat-pricing";

describe("extra LinkedIn seat pricing", () => {
  test("charges $20 per extra account through 10 so ten extra seats checkout at $200", () => {
    expect(extraLinkedInSeatUnitPriceUsd(1)).toBe(20);
    expect(extraLinkedInSeatMonthlyTotalUsd(10)).toBe(200);
  });

  test("drops every extra seat to $10/month once the buyer adds more than 10", () => {
    expect(extraLinkedInSeatUnitPriceUsd(11)).toBe(10);
    expect(extraLinkedInSeatMonthlyTotalUsd(11)).toBe(110);
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
});
