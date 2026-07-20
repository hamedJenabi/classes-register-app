import {
  ConditionOperator as PrismaConditionOperator,
  FieldType as PrismaFieldType,
} from "@/generated/prisma/enums";
import type {
  ConditionOperator as PrismaConditionOperatorValue,
  FieldType as PrismaFieldTypeValue,
  FormStatus,
} from "@/generated/prisma/enums";
import type {
  ConditionOperator,
  FieldBlueprint,
  FieldType,
  FormBlueprint,
} from "@/lib/form-blueprint";
import { getOptionSelectionCounts } from "@/lib/availability";
import { prisma } from "@/lib/prisma";

const fieldTypeMap: Record<PrismaFieldTypeValue, FieldType> = {
  [PrismaFieldType.TEXT]: "text",
  [PrismaFieldType.TEXTAREA]: "textarea",
  [PrismaFieldType.EMAIL]: "email",
  [PrismaFieldType.PHONE]: "phone",
  [PrismaFieldType.SINGLE_SELECT]: "single-select",
  [PrismaFieldType.MULTI_SELECT]: "multi-select",
  [PrismaFieldType.BOOLEAN]: "boolean",
  [PrismaFieldType.DATE]: "date",
  [PrismaFieldType.NUMBER]: "number",
};

const conditionOperatorMap: Record<
  PrismaConditionOperatorValue,
  ConditionOperator
> = {
  [PrismaConditionOperator.EQUALS]: "equals",
  [PrismaConditionOperator.NOT_EQUALS]: "not-equals",
  [PrismaConditionOperator.INCLUDES]: "includes",
};

export type DashboardFormSummary = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: FormStatus;
  fieldCount: number;
  capacityOptionCount: number;
  registrationCount: number;
};

export type PersistedFieldDefinition = FieldBlueprint & {
  id: string;
  dbType: PrismaFieldTypeValue;
  sortOrder: number;
  conditionalRule?: {
    id: string;
    sourceFieldId: string;
    sourceFieldKey: string;
    operator: PrismaConditionOperatorValue;
    comparisonValue: string;
  };
};

export type PersistedFormDefinition = Omit<FormBlueprint, "fields"> & {
  id: string;
  status: FormStatus;
  successMessage: string | null;
  registrationCount: number;
  capacityOptionCount: number;
  fields: PersistedFieldDefinition[];
};

async function fetchFormRecordBySlug(slug: string) {
  return prisma.form.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          registrations: true,
        },
      },
      fields: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          options: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
          targetRules: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: {
              sourceField: true,
            },
          },
        },
      },
    },
  });
}

type FormRecord = NonNullable<Awaited<ReturnType<typeof fetchFormRecordBySlug>>>;

export async function getDashboardFormSummaries(): Promise<
  DashboardFormSummary[]
> {
  const forms = await prisma.form.findMany({
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    include: {
      _count: {
        select: {
          registrations: true,
        },
      },
      fields: {
        select: {
          id: true,
          options: {
            select: {
              capacity: true,
            },
          },
        },
      },
    },
  });

  return forms.map((form) => ({
    id: form.id,
    title: form.title,
    slug: form.slug,
    description: form.description,
    status: form.status,
    fieldCount: form.fields.length,
    capacityOptionCount: form.fields.reduce(
      (total, field) =>
        total +
        field.options.filter((option) => typeof option.capacity === "number")
          .length,
      0,
    ),
    registrationCount: form._count.registrations,
  }));
}

export async function getPersistedFormDefinition(
  slug: string,
): Promise<PersistedFormDefinition | null> {
  const form = await fetchFormRecordBySlug(slug);

  if (!form) {
    return null;
  }

  const optionCounts = await getSelectedOptionCounts(form);
  const blueprint = toFormBlueprint(form, optionCounts);

  return {
    ...blueprint,
    id: form.id,
    status: form.status,
    registrationCount: form._count.registrations,
    capacityOptionCount: blueprint.fields.reduce(
      (total, field) =>
        total +
        (field.options ?? []).filter(
          (option) => typeof option.capacity === "number",
        ).length,
      0,
    ),
  };
}

export function formatFormStatus(status: FormStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

async function getSelectedOptionCounts(form: FormRecord) {
  const optionIds = form.fields.flatMap((field) =>
    field.options
      .filter((option) => typeof option.capacity === "number")
      .map((option) => option.id),
  );

  return getOptionSelectionCounts(optionIds);
}

function toFormBlueprint(
  form: FormRecord,
  optionCounts: Map<string, number>,
): Omit<PersistedFormDefinition, "id" | "status" | "registrationCount" | "capacityOptionCount"> {
  return {
    title: form.title,
    slug: form.slug,
    description: form.description ?? "",
    submitButtonLabel: form.submitButtonLabel,
    successMessage: form.successMessage,
    fields: form.fields.map((field) => toFieldBlueprint(field, optionCounts)),
  };
}

function toFieldBlueprint(
  field: FormRecord["fields"][number],
  optionCounts: Map<string, number>,
): PersistedFieldDefinition {
  const visibleWhenRule = field.targetRules[0];
  const comparisonValue = visibleWhenRule
    ? normalizeComparisonValue(visibleWhenRule.comparisonValue)
    : undefined;

  return {
    id: field.id,
    key: field.key,
    dbType: field.type,
    label: field.label,
    type: fieldTypeMap[field.type],
    required: field.required,
    sortOrder: field.sortOrder,
    placeholder: field.placeholder ?? undefined,
    helpText: field.helpText ?? undefined,
    options: field.options.map((option) => ({
      id: option.id,
      label: option.label,
      value: option.value,
      sortOrder: option.sortOrder,
      capacity: option.capacity ?? undefined,
      registeredCount: optionCounts.get(option.id) ?? 0,
    })),
    visibleWhen: visibleWhenRule
      ? {
          sourceFieldKey: visibleWhenRule.sourceField.key,
          operator: conditionOperatorMap[visibleWhenRule.operator],
          value: comparisonValue ?? "",
        }
      : undefined,
    conditionalRule:
      visibleWhenRule && comparisonValue !== undefined
        ? {
            id: visibleWhenRule.id,
            sourceFieldId: visibleWhenRule.sourceFieldId,
            sourceFieldKey: visibleWhenRule.sourceField.key,
            operator: visibleWhenRule.operator,
            comparisonValue: String(comparisonValue),
          }
        : undefined,
  };
}

function normalizeComparisonValue(value: unknown): string | boolean | number {
  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return value;
  }

  return String(value ?? "");
}
