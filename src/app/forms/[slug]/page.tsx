import { AppShell } from "@/components/AppShell";
import { FormPreview } from "@/components/FormPreview";
import { sampleFormBlueprint } from "@/lib/form-blueprint";

type FormPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicFormPage({ params }: FormPageProps) {
  const { slug } = await params;
  const form =
    slug === sampleFormBlueprint.slug ? sampleFormBlueprint : sampleFormBlueprint;

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
