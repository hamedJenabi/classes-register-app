export type OptionAvailability = {
  id: string;
  fieldId: string;
  fieldKey: string;
  label: string;
  value: string;
  capacity: number;
  registeredCount: number;
  remaining: number;
  full: boolean;
};

export function buildOptionAvailability(option: {
  id: string;
  fieldId: string;
  fieldKey: string;
  label: string;
  value: string;
  capacity: number;
  registeredCount: number;
}): OptionAvailability {
  const remaining = Math.max(option.capacity - option.registeredCount, 0);

  return {
    id: option.id,
    fieldId: option.fieldId,
    fieldKey: option.fieldKey,
    label: option.label,
    value: option.value,
    capacity: option.capacity,
    registeredCount: option.registeredCount,
    remaining,
    full: remaining <= 0,
  };
}
