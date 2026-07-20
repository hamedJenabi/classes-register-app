import assert from "node:assert/strict";
import test from "node:test";
import { evaluateCondition } from "../src/lib/condition-evaluation.ts";

test("equals matches primitive values exactly", () => {
  assert.equal(evaluateCondition("equals", true, true), true);
  assert.equal(evaluateCondition("equals", "true", true), false);
});

test("not-equals rejects matching primitive values", () => {
  assert.equal(evaluateCondition("not-equals", "solo", "partner"), true);
  assert.equal(evaluateCondition("not-equals", "partner", "partner"), false);
});

test("includes checks multi-select values as strings", () => {
  assert.equal(
    evaluateCondition("includes", ["beginner", "solo"], "solo"),
    true,
  );
  assert.equal(evaluateCondition("includes", "solo", "solo"), false);
});
