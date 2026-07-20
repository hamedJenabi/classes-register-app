import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FormPreview } from "@/components/FormPreview";
import { getPersistedFormDefinition } from "@/lib/forms";

type FormPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PublicFormPage({ params }: FormPageProps) {
  const { slug } = await params;
  const form = await getPersistedFormDefinition(slug);

  if (!form) {
    notFound();
  }

  return (
    <AppShell
      eyebrow="Public form"
      title={form.title}
      description={form.description}
      actions={[{ label: "Dashboard", href: "/dashboard" }]}
    >
      <FormPreview form={form} />
    </AppShell>
  );
}
