import type { ConditionOperator } from "./form-blueprint";

export type ConditionalValue = string | boolean | number | string[] | undefined;

export function evaluateCondition(
  operator: ConditionOperator,
  currentValue: ConditionalValue,
  expectedValue: string | boolean | number,
) {
  if (operator === "equals") {
    return currentValue === expectedValue;
  }

  if (operator === "not-equals") {
    return currentValue !== expectedValue;
  }

  if (operator === "includes") {
    return (
      Array.isArray(currentValue) && currentValue.includes(String(expectedValue))
    );
  }

  return true;
}
