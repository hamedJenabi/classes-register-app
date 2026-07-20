"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ConditionOperator,
  FieldType as PrismaFieldType,
  FormStatus,
} from "@/generated/prisma/enums";
import type {
  FieldType as PrismaFieldTypeValue,
  FormStatus as FormStatusValue,
} from "@/generated/prisma/enums";
import { isFieldType } from "@/lib/field-types";
import { prisma } from "@/lib/prisma";

export async function updateFormAction(formData: FormData) {
  const formId = getRequiredString(formData, "formId");
  const currentSlug = getRequiredString(formData, "currentSlug");
  const title = getRequiredString(formData, "title");
  const slug = await getUniqueFormSlug(
    normalizeSlug(getOptionalString(formData, "slug") ?? title),
    formId,
  );

  await prisma.form.update({
    where: {
      id: formId,
    },
    data: {
      title,
      slug,
      description: getOptionalString(formData, "description"),
      status: getFormStatus(formData),
      submitButtonLabel:
        getOptionalString(formData, "submitButtonLabel") ?? "Register",
      successMessage: getOptionalString(formData, "successMessage"),
    },
  });

  revalidateFormPaths(currentSlug);
  revalidateFormPaths(slug);

  if (slug !== currentSlug) {
    redirect(`/dashboard/forms/${slug}`);
  }
}

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

export async function createOptionAction(formData: FormData) {
  const fieldId = getRequiredString(formData, "fieldId");
  const formSlug = getRequiredString(formData, "formSlug");
  const label = getRequiredString(formData, "label");
  const value = normalizeOptionValue(
    getOptionalString(formData, "value") ?? label,
  );

  const latestOption = await prisma.fieldOption.findFirst({
    where: {
      fieldId,
    },
    orderBy: {
      sortOrder: "desc",
    },
    select: {
      sortOrder: true,
    },
  });

  await prisma.fieldOption.create({
    data: {
      fieldId,
      label,
      value,
      sortOrder:
        getOptionalNumber(formData, "sortOrder") ??
        (latestOption ? latestOption.sortOrder + 1 : 0),
      capacity: getOptionalNumber(formData, "capacity"),
    },
  });

  revalidateFormPaths(formSlug);
}

export async function updateOptionAction(formData: FormData) {
  const optionId = getRequiredString(formData, "optionId");
  const formSlug = getRequiredString(formData, "formSlug");
  const label = getRequiredString(formData, "label");
  const value = normalizeOptionValue(getRequiredString(formData, "value"));

  await prisma.fieldOption.update({
    where: {
      id: optionId,
    },
    data: {
      label,
      value,
      sortOrder: getOptionalNumber(formData, "sortOrder") ?? 0,
      capacity: getOptionalNumber(formData, "capacity"),
    },
  });

  revalidateFormPaths(formSlug);
}

export async function updateConditionalRuleAction(formData: FormData) {
  const formId = getRequiredString(formData, "formId");
  const targetFieldId = getRequiredString(formData, "targetFieldId");
  const formSlug = getRequiredString(formData, "formSlug");
  const sourceFieldId = getOptionalString(formData, "sourceFieldId");

  if (!sourceFieldId) {
    await prisma.conditionalRule.deleteMany({
      where: {
        formId,
        targetFieldId,
      },
    });

    revalidateFormPaths(formSlug);
    return;
  }

  const operator = getConditionOperator(formData);
  const comparisonValue = parseComparisonValue(
    getRequiredString(formData, "comparisonValue"),
  );

  await prisma.conditionalRule.deleteMany({
    where: {
      formId,
      targetFieldId,
      NOT: {
        sourceFieldId,
      },
    },
  });

  await prisma.conditionalRule.upsert({
    where: {
      id:
        getOptionalString(formData, "ruleId") ??
        `missing_rule_${targetFieldId}`,
    },
    create: {
      formId,
      targetFieldId,
      sourceFieldId,
      operator,
      comparisonValue,
    },
    update: {
      sourceFieldId,
      operator,
      comparisonValue,
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

function getFormStatus(formData: FormData): FormStatusValue {
  const status = formData.get("status");

  if (
    status === FormStatus.DRAFT ||
    status === FormStatus.PUBLISHED ||
    status === FormStatus.ARCHIVED
  ) {
    return status;
  }

  return FormStatus.DRAFT;
}

function getConditionOperator(formData: FormData) {
  const operator = formData.get("operator");

  if (
    operator === ConditionOperator.EQUALS ||
    operator === ConditionOperator.NOT_EQUALS ||
    operator === ConditionOperator.INCLUDES
  ) {
    return operator;
  }

  return ConditionOperator.EQUALS;
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

function normalizeSlug(value: string) {
  const normalizedSlug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalizedSlug.length === 0) {
    throw new Error("Slug must include at least one letter or number.");
  }

  return normalizedSlug;
}

function normalizeOptionValue(value: string) {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalizedValue.length === 0) {
    throw new Error("Option value must include at least one letter or number.");
  }

  return normalizedValue;
}

async function getUniqueFormSlug(slug: string, currentFormId: string) {
  let candidate = slug;
  let suffix = 2;

  while (true) {
    const existingForm = await prisma.form.findUnique({
      where: {
        slug: candidate,
      },
      select: {
        id: true,
      },
    });

    if (!existingForm || existingForm.id === currentFormId) {
      return candidate;
    }

    candidate = `${slug}-${suffix}`;
    suffix += 1;
  }
}

function parseComparisonValue(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue === "true") {
    return true;
  }

  if (trimmedValue === "false") {
    return false;
  }

  if (trimmedValue !== "" && Number.isFinite(Number(trimmedValue))) {
    return Number(trimmedValue);
  }

  return trimmedValue;
}
