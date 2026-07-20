import { FieldType as PrismaFieldType } from "@/generated/prisma/enums";
import type { FieldType as PrismaFieldTypeValue } from "@/generated/prisma/enums";

export const fieldTypeOptions: Array<{
  label: string;
  value: PrismaFieldTypeValue;
}> = [
  { label: "Text", value: PrismaFieldType.TEXT },
  { label: "Textarea", value: PrismaFieldType.TEXTAREA },
  { label: "Email", value: PrismaFieldType.EMAIL },
  { label: "Phone", value: PrismaFieldType.PHONE },
  { label: "Single select", value: PrismaFieldType.SINGLE_SELECT },
  { label: "Multi select", value: PrismaFieldType.MULTI_SELECT },
  { label: "Checkbox / yes-no", value: PrismaFieldType.BOOLEAN },
  { label: "Date", value: PrismaFieldType.DATE },
  { label: "Number", value: PrismaFieldType.NUMBER },
];

export function isFieldType(
  value: FormDataEntryValue | null,
): value is PrismaFieldTypeValue {
  return fieldTypeOptions.some((option) => option.value === value);
}

export function formatFieldTypeLabel(value: string) {
  return (
    fieldTypeOptions.find((option) => option.value === value)?.label ??
    value.replaceAll("_", " ").toLowerCase()
  );
}
