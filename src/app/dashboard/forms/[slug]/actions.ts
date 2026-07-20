"use server";

import { revalidatePath } from "next/cache";
import { FieldType as PrismaFieldType } from "@/generated/prisma/enums";
import type { FieldType as PrismaFieldTypeValue } from "@/generated/prisma/enums";
import { isFieldType } from "@/lib/field-types";
import { prisma } from "@/lib/prisma";

export async function createFieldAction(formData: FormData) {
  const formId = getRequiredString(formData, "formId");
  const formSlug = getRequiredString(formData, "formSlug");
  const label = getRequiredString(formData, "label");
  const key = normalizeFieldKey(
    getOptionalString(formData, "key") ?? label,
  );
  const type = getFieldType(formData);

  const latestField = await prisma.field.findFirst({
    where: {
      formId,
    },
    orderBy: {
      sortOrder: "desc",
    },
    select: {
      sortOrder: true,
    },
  });

  await prisma.field.create({
    data: {
      formId,
      key,
      label,
      type,
      required: formData.get("required") === "on",
      sortOrder:
        getOptionalNumber(formData, "sortOrder") ??
        (latestField ? latestField.sortOrder + 1 : 0),
      helpText: getOptionalString(formData, "helpText"),
      placeholder: getOptionalString(formData, "placeholder"),
    },
  });

  revalidateFormPaths(formSlug);
}

export async function updateFieldAction(formData: FormData) {
  const fieldId = getRequiredString(formData, "fieldId");
  const formSlug = getRequiredString(formData, "formSlug");
  const label = getRequiredString(formData, "label");
  const key = normalizeFieldKey(getRequiredString(formData, "key"));
  const type = getFieldType(formData);

  await prisma.field.update({
    where: {
      id: fieldId,
    },
    data: {
      key,
      label,
      type,
      required: formData.get("required") === "on",
      sortOrder: getOptionalNumber(formData, "sortOrder") ?? 0,
      helpText: getOptionalString(formData, "helpText"),
      placeholder: getOptionalString(formData, "placeholder"),
    },
  });

  revalidateFormPaths(formSlug);
}

function revalidateFormPaths(formSlug: string) {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/forms/${formSlug}`);
  revalidatePath(`/forms/${formSlug}`);
}

function getFieldType(formData: FormData): PrismaFieldTypeValue {
  const type = formData.get("type");

  if (!isFieldType(type)) {
    return PrismaFieldType.TEXT;
  }

  return type;
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return value.trim();
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function normalizeFieldKey(value: string) {
  const normalizedKey = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (normalizedKey.length === 0) {
    throw new Error("Field key must include at least one letter or number.");
  }

  return normalizedKey;
}
