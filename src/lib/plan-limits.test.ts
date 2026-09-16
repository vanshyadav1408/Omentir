import { describe, expect, test } from "bun:test";
import { billedLinkedInAccountLimit } from "./plan-limits";

describe("billedLinkedInAccountLimit", () => {
  test("adds paid extra seats on top of the included LinkedIn account so a 10-seat add-on can connect 11 accounts", () => {
    expect(billedLinkedInAccountLimit("solo", 0)).toBe(1);
    expect(billedLinkedInAccountLimit("solo", 10)).toBe(11);
  });

  test("leaves enterprise uncapped so extra-seat checkout is not required there", () => {
    expect(billedLinkedInAccountLimit("enterprise", 3)).toBe(Number.POSITIVE_INFINITY);
  });
});
