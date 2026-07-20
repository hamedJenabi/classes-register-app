import { prisma } from "@/lib/prisma";

export type DashboardRegistration = {
  id: string;
  participantName: string | null;
  participantEmail: string | null;
  submittedAt: Date;
  status: string;
  paymentStatus: string;
  answers: Array<{
    id: string;
    fieldLabel: string;
    fieldKey: string;
    optionLabel: string | null;
    value: string;
  }>;
};

export async function getDashboardRegistrations(slug: string) {
  const form = await prisma.form.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      registrations: {
        orderBy: {
          submittedAt: "desc",
        },
        include: {
          answers: {
            include: {
              field: true,
              fieldOption: true,
            },
            orderBy: {
              field: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
    },
  });

  if (!form) {
    return null;
  }

  return {
    id: form.id,
    title: form.title,
    slug: form.slug,
    registrations: form.registrations.map((registration) => ({
      id: registration.id,
      participantName: registration.participantName,
      participantEmail: registration.participantEmail,
      submittedAt: registration.submittedAt,
      status: registration.status,
      paymentStatus: registration.paymentStatus,
      answers: registration.answers.map((answer) => ({
        id: answer.id,
        fieldLabel: answer.field.label,
        fieldKey: answer.field.key,
        optionLabel: answer.fieldOption?.label ?? null,
        value: formatAnswerValue(answer.value),
      })),
    })),
  };
}

function formatAnswerValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }

  return "";
}
