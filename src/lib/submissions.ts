import {
  ConditionOperator,
  FieldType,
  PaymentStatus,
  RegistrationStatus,
} from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type SubmittedValue = string | boolean | string[];
export type SubmissionAnswers = Record<string, SubmittedValue | undefined>;

export type SubmissionResult =
  | {
      ok: true;
      registrationId: string;
      message: string;
    }
  | {
      ok: false;
      errors: string[];
    };

export async function submitRegistration(
  slug: string,
  answers: SubmissionAnswers,
): Promise<SubmissionResult> {
  const form = await prisma.form.findUnique({
    where: {
      slug,
    },
    include: {
      fields: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          options: true,
          targetRules: {
            include: {
              sourceField: true,
            },
          },
        },
      },
    },
  });

  if (!form) {
    return {
      ok: false,
      errors: ["Form not found."],
    };
  }

  const visibleFields = form.fields.filter((field) =>
    isFieldVisible(field, answers),
  );
  const errors = validateRequiredFields(visibleFields, answers);
  const optionAnswers = collectOptionAnswers(visibleFields, answers, errors);

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return prisma.$transaction(async (tx) => {
    const selectedOptionIds = optionAnswers.map((answer) => answer.option.id);
    const selectedCapacityOptions = optionAnswers
      .map((answer) => answer.option)
      .filter((option) => typeof option.capacity === "number");
    const counts = await getSelectedOptionCountsInTransaction(
      tx,
      selectedCapacityOptions.map((option) => option.id),
    );
    const capacityErrors = selectedCapacityOptions.flatMap((option) => {
      const registeredCount = counts.get(option.id) ?? 0;

      return registeredCount >= (option.capacity ?? 0)
        ? [`${option.label} is already full.`]
        : [];
    });

    if (capacityErrors.length > 0) {
      return {
        ok: false,
        errors: capacityErrors,
      };
    }

    const registration = await tx.registration.create({
      data: {
        formId: form.id,
        status: RegistrationStatus.SUBMITTED,
        paymentStatus: PaymentStatus.NOT_REQUIRED,
        participantName: getParticipantName(visibleFields, answers),
        participantEmail: getParticipantEmail(visibleFields, answers),
      },
      select: {
        id: true,
      },
    });

    const selectedOptionIdSet = new Set(selectedOptionIds);
    const answerRows: Prisma.AnswerCreateManyInput[] = [];

    for (const field of visibleFields) {
      const value = answers[field.key];

      if (isEmptyValue(value)) {
        continue;
      }

      if (field.type === FieldType.SINGLE_SELECT) {
        const option = field.options.find(
          (fieldOption) => fieldOption.value === value,
        );

        if (option) {
          answerRows.push({
            registrationId: registration.id,
            fieldId: field.id,
            fieldOptionId: option.id,
            value,
          });
        }

        continue;
      }

      if (field.type === FieldType.MULTI_SELECT && Array.isArray(value)) {
        answerRows.push(
          ...field.options
            .filter((option) => selectedOptionIdSet.has(option.id))
            .map((option) => ({
              registrationId: registration.id,
              fieldId: field.id,
              fieldOptionId: option.id,
              value: option.value,
            })),
        );

        continue;
      }

      answerRows.push({
        registrationId: registration.id,
        fieldId: field.id,
        value,
      });
    }

    if (answerRows.length > 0) {
      await tx.answer.createMany({
        data: answerRows,
      });
    }

    return {
      ok: true,
      registrationId: registration.id,
      message: form.successMessage ?? "Registration saved.",
    };
  });
}

function validateRequiredFields(
  fields: Array<SubmissionField>,
  answers: SubmissionAnswers,
) {
  return fields.flatMap((field) => {
    const value = answers[field.key];

    return field.required && isEmptyValue(value)
      ? [`${field.label} is required.`]
      : [];
  });
}

function collectOptionAnswers(
  fields: Array<SubmissionField>,
  answers: SubmissionAnswers,
  errors: string[],
) {
  return fields.flatMap((field) => {
    const value = answers[field.key];

    if (isEmptyValue(value)) {
      return [];
    }

    if (field.type === FieldType.SINGLE_SELECT) {
      const option = field.options.find((fieldOption) => fieldOption.value === value);

      if (!option) {
        errors.push(`${field.label} has an invalid option.`);
        return [];
      }

      return [{ field, option }];
    }

    if (field.type === FieldType.MULTI_SELECT) {
      if (!Array.isArray(value)) {
        errors.push(`${field.label} has invalid selections.`);
        return [];
      }

      return value.flatMap((selectedValue) => {
        const option = field.options.find(
          (fieldOption) => fieldOption.value === selectedValue,
        );

        if (!option) {
          errors.push(`${field.label} has an invalid option.`);
          return [];
        }

        return [{ field, option }];
      });
    }

    return [];
  });
}

function isFieldVisible(field: SubmissionField, answers: SubmissionAnswers) {
  const rule = field.targetRules[0];

  if (!rule) {
    return true;
  }

  const currentValue = answers[rule.sourceField.key];
  const expectedValue = normalizeComparisonValue(rule.comparisonValue);

  if (rule.operator === ConditionOperator.EQUALS) {
    return currentValue === expectedValue;
  }

  if (rule.operator === ConditionOperator.NOT_EQUALS) {
    return currentValue !== expectedValue;
  }

  if (rule.operator === ConditionOperator.INCLUDES) {
    return Array.isArray(currentValue) && currentValue.includes(String(expectedValue));
  }

  return true;
}

function isEmptyValue(value: SubmittedValue | undefined) {
  if (value === undefined || value === "") {
    return true;
  }

  return Array.isArray(value) && value.length === 0;
}

function getParticipantName(
  fields: Array<SubmissionField>,
  answers: SubmissionAnswers,
) {
  const nameField = fields.find((field) => field.key === "name");
  const value = nameField ? answers[nameField.key] : undefined;

  return typeof value === "string" ? value : null;
}

function getParticipantEmail(
  fields: Array<SubmissionField>,
  answers: SubmissionAnswers,
) {
  const emailField = fields.find(
    (field) => field.key === "email" || field.type === FieldType.EMAIL,
  );
  const value = emailField ? answers[emailField.key] : undefined;

  return typeof value === "string" ? value : null;
}

async function getSelectedOptionCountsInTransaction(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  optionIds: string[],
) {
  if (optionIds.length === 0) {
    return new Map<string, number>();
  }

  const answerCounts = await tx.answer.groupBy({
    by: ["fieldOptionId"],
    where: {
      fieldOptionId: {
        in: optionIds,
      },
      registration: {
        status: RegistrationStatus.SUBMITTED,
      },
    },
    _count: {
      _all: true,
    },
  });

  return new Map(
    answerCounts.flatMap((answerCount) =>
      answerCount.fieldOptionId
        ? [[answerCount.fieldOptionId, answerCount._count._all]]
        : [],
    ),
  );
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

type SubmissionField = {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: Array<{
    id: string;
    label: string;
    value: string;
    capacity: number | null;
  }>;
  targetRules: Array<{
    operator: ConditionOperator;
    comparisonValue: unknown;
    sourceField: {
      key: string;
    };
  }>;
};
