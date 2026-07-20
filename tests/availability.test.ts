import assert from "node:assert/strict";
import test from "node:test";
import { buildOptionAvailability } from "../src/lib/availability-rules.ts";

test("buildOptionAvailability marks a full option", () => {
  assert.deepEqual(
    buildOptionAvailability({
      id: "option-1",
      fieldId: "field-1",
      fieldKey: "class",
      label: "Intermediate blues",
      value: "intermediate",
      capacity: 16,
      registeredCount: 16,
    }),
    {
      id: "option-1",
      fieldId: "field-1",
      fieldKey: "class",
      label: "Intermediate blues",
      value: "intermediate",
      capacity: 16,
      registeredCount: 16,
      remaining: 0,
      full: true,
    },
  );
});

test("buildOptionAvailability reports remaining spaces", () => {
  const availability = buildOptionAvailability({
    id: "option-2",
    fieldId: "field-1",
    fieldKey: "class",
    label: "Beginner blues",
    value: "beginner",
    capacity: 18,
    registeredCount: 11,
  });

  assert.equal(availability.remaining, 7);
  assert.equal(availability.full, false);
});
