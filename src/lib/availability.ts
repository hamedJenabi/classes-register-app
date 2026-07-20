import { RegistrationStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

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

export async function getFormAvailability(slug: string) {
  const form = await prisma.form.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      slug: true,
      fields: {
        select: {
          id: true,
          key: true,
          options: {
            where: {
              capacity: {
                not: null,
              },
            },
            select: {
              id: true,
              label: true,
              value: true,
              capacity: true,
              fieldId: true,
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!form) {
    return null;
  }

  const options = form.fields.flatMap((field) =>
    field.options.map((option) => ({
      ...option,
      capacity: option.capacity ?? 0,
      fieldKey: field.key,
    })),
  );
  const counts = await getOptionSelectionCounts(options.map((option) => option.id));

  return {
    formId: form.id,
    formSlug: form.slug,
    options: options.map((option): OptionAvailability => {
      const registeredCount = counts.get(option.id) ?? 0;
      const remaining = Math.max(option.capacity - registeredCount, 0);

      return {
        id: option.id,
        fieldId: option.fieldId,
        fieldKey: option.fieldKey,
        label: option.label,
        value: option.value,
        capacity: option.capacity,
        registeredCount,
        remaining,
        full: remaining <= 0,
      };
    }),
  };
}

export async function getOptionSelectionCounts(optionIds: string[]) {
  if (optionIds.length === 0) {
    return new Map<string, number>();
  }

  const answerCounts = await prisma.answer.groupBy({
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
