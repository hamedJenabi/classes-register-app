import { RegistrationStatus } from "@/generated/prisma/enums";
import {
  buildOptionAvailability,
  type OptionAvailability,
} from "@/lib/availability-rules";
import { prisma } from "@/lib/prisma";

export type { OptionAvailability };

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
    options: options.map((option) =>
      buildOptionAvailability({
        id: option.id,
        fieldId: option.fieldId,
        fieldKey: option.fieldKey,
        label: option.label,
        value: option.value,
        capacity: option.capacity,
        registeredCount: counts.get(option.id) ?? 0,
      }),
    ),
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
