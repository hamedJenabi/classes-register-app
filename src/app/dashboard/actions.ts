"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FormStatus } from "@/generated/prisma/enums";
import type { FormStatus as FormStatusValue } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function createFormAction(formData: FormData) {
  const title = getRequiredString(formData, "title");
  const slug = await getUniqueFormSlug(
    normalizeSlug(getOptionalString(formData, "slug") ?? title),
  );
  const form = await prisma.form.create({
    data: {
      title,
      slug,
      description: getOptionalString(formData, "description"),
      status: getFormStatus(formData),
      submitButtonLabel:
        getOptionalString(formData, "submitButtonLabel") ?? "Register",
      successMessage: getOptionalString(formData, "successMessage"),
    },
    select: {
      slug: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect(`/dashboard/forms/${form.slug}`);
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

async function getUniqueFormSlug(slug: string) {
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

    if (!existingForm) {
      return candidate;
    }

    candidate = `${slug}-${suffix}`;
    suffix += 1;
  }
}
