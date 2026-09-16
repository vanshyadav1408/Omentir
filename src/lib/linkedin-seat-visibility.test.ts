import { describe, expect, test } from "bun:test";
import { billedLinkedInAccountLimit } from "./plan-limits";
import {
  extraLinkedInSeatMerchandisingVisible,
  extraSeatsSubscriptionBuyVisible,
  extraSeatsSubscriptionManageVisible,
  shouldRecoverLinkedInSeatsFromWhop,
} from "./linkedin-seat-visibility";

describe("extra LinkedIn seat Settings visibility", () => {
  test("lets a Pro workspace see Extra Seats merchandising with extraLinkedInSeats 0 so Subscriptions can sell extras before any add-on is stored", () => {
    expect(
      extraSeatsSubscriptionBuyVisible({ localMode: false, plan: "solo", extraSeats: 0 }),
    ).toBe(true);
    expect(
      extraSeatsSubscriptionManageVisible({ localMode: false, plan: "solo", extraSeats: 0 }),
    ).toBe(false);
    expect(extraLinkedInSeatMerchandisingVisible({ localMode: false, plan: "solo" })).toBe(true);
  });

  test("lets lifetime and retired startup plans see Extra Seats because they still include one LinkedIn account", () => {
    expect(extraLinkedInSeatMerchandisingVisible({ localMode: false, plan: "lifetime" })).toBe(
      true,
    );
    expect(
      extraSeatsSubscriptionBuyVisible({ localMode: false, plan: "startup", extraSeats: 0 }),
    ).toBe(true);
  });

  test("keeps the Extra Seats subscription card once extras are paid so they can be cancelled without cancelling Pro", () => {
    expect(
      extraSeatsSubscriptionManageVisible({ localMode: false, plan: "solo", extraSeats: 3 }),
    ).toBe(true);
    expect(
      extraSeatsSubscriptionBuyVisible({ localMode: false, plan: "solo", extraSeats: 3 }),
    ).toBe(false);
    expect(extraLinkedInSeatMerchandisingVisible({ localMode: false, plan: "solo" })).toBe(true);
  });

  test("hides extra-seat merchandising on enterprise because that LinkedIn cap is already unlimited", () => {
    expect(
      extraLinkedInSeatMerchandisingVisible({ localMode: false, plan: "enterprise" }),
    ).toBe(false);
    expect(
      extraSeatsSubscriptionBuyVisible({ localMode: false, plan: "enterprise", extraSeats: 0 }),
    ).toBe(false);
    expect(
      extraSeatsSubscriptionManageVisible({ localMode: false, plan: "enterprise", extraSeats: 2 }),
    ).toBe(false);
  });

  test("hides billed extra-seat UI in local mode because self-hosted LinkedIn accounts are unlimited", () => {
    expect(extraLinkedInSeatMerchandisingVisible({ localMode: true, plan: "solo" })).toBe(false);
    expect(
      extraSeatsSubscriptionBuyVisible({ localMode: true, plan: "solo", extraSeats: 0 }),
    ).toBe(false);
    expect(
      extraSeatsSubscriptionManageVisible({ localMode: true, plan: "solo", extraSeats: 4 }),
    ).toBe(false);
  });

  test("does not raise the LinkedIn cap when Extra Seats merchandising is visible but unpaid", () => {
    expect(
      extraSeatsSubscriptionBuyVisible({ localMode: false, plan: "solo", extraSeats: 0 }),
    ).toBe(true);
    expect(billedLinkedInAccountLimit("solo", 0)).toBe(1);
  });
});

describe("shouldRecoverLinkedInSeatsFromWhop", () => {
  test("looks up Extra Seats on Settings load for a subscribed Pro workspace so a missed webhook can still write extraLinkedInSeats", () => {
    expect(
      shouldRecoverLinkedInSeatsFromWhop({
        localMode: false,
        subscriptionActive: true,
        plan: "solo",
      }),
    ).toBe(true);
  });

  test("skips Extra Seats recovery when Pro is not active so a seats membership cannot grant LinkedIn capacity alone", () => {
    expect(
      shouldRecoverLinkedInSeatsFromWhop({
        localMode: false,
        subscriptionActive: false,
        plan: "solo",
      }),
    ).toBe(false);
  });

  test("skips Extra Seats recovery for enterprise and local because those LinkedIn caps are already unlimited", () => {
    expect(
      shouldRecoverLinkedInSeatsFromWhop({
        localMode: false,
        subscriptionActive: true,
        plan: "enterprise",
      }),
    ).toBe(false);
    expect(
      shouldRecoverLinkedInSeatsFromWhop({
        localMode: true,
        subscriptionActive: true,
        plan: "solo",
      }),
    ).toBe(false);
  });
});
