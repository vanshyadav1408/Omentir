import { describe, expect, test } from "bun:test";
import {
  campaignStepsFromActions,
  sequenceHasManualCopy,
} from "./campaign-sequence";

describe("campaignStepsFromActions", () => {
  test("inserts wait steps between actions because the planner only sends after a delay, not immediately after connect", () => {
    const steps = campaignStepsFromActions([
      { kind: "connect", mode: "ai" },
      { kind: "message", mode: "manual", manualMessage: "Hi {{firstName}}", waitValue: 15, waitUnit: "minutes" },
    ]);
    expect(steps?.map((step) => step.type)).toEqual(["connect", "wait", "message"]);
    expect(steps?.[1]).toMatchObject({ type: "wait", delayMinutes: 15 });
    expect(steps?.[2]).toMatchObject({ type: "message", messageTemplate: "Hi {{firstName}}" });
  });

  test("treats an AI message as empty copy so Steal Customers can keep post and comment context", () => {
    const steps = campaignStepsFromActions([
      { kind: "connect", mode: "ai" },
      { kind: "message", mode: "ai", waitValue: 1, waitUnit: "hours" },
    ]);
    expect(sequenceHasManualCopy(steps || [])).toBe(false);
  });

  test("flags a typed connection note as manual copy so Steal Customers can reject it", () => {
    const steps = campaignStepsFromActions([
      { kind: "connect", mode: "manual", includeNote: true, manualMessage: "Saw your comment" },
    ]);
    expect(sequenceHasManualCopy(steps || [])).toBe(true);
  });
});
