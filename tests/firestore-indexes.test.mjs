import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the action reservation query has its required composite index", async () => {
  const indexes = JSON.parse(
    await readFile(new URL("../firestore.indexes.json", import.meta.url), "utf8"),
  );
  const fieldPaths = indexes.indexes.map((index) =>
    index.fields.map((field) => field.fieldPath),
  );

  assert.deepEqual(
    fieldPaths.find(
      (fields) =>
        fields.length === 3 &&
        fields.includes("campaignId") &&
        fields.includes("workspaceId") &&
        fields.includes("nextActionAt"),
    ),
    ["campaignId", "workspaceId", "nextActionAt"],
    "campaignId uses an IN filter, so Firestore requires it before workspaceId and nextActionAt",
  );
});
