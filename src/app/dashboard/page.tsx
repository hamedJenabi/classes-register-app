import { AppShell } from "@/components/AppShell";
import { sampleFormBlueprint } from "@/lib/form-blueprint";
import styles from "./page.module.scss";

export default function DashboardPage() {
  const fields = sampleFormBlueprint.fields.length;
  const capacityOptions = sampleFormBlueprint.fields
    .flatMap((field) => field.options ?? [])
    .filter((option) => typeof option.capacity === "number").length;

  return (
    <AppShell
      eyebrow="Dashboard"
      title="Forms"
      description="Draft and published registration forms for classes and events."
      actions={[{ label: "Preview", href: `/forms/${sampleFormBlueprint.slug}` }]}
    >
      <section className={styles.toolbar}>
        <div>
          <span>Local MVP</span>
          <strong>{sampleFormBlueprint.title}</strong>
        </div>
        <p>Draft</p>
      </section>

      <section className={styles.grid}>
        <article className={styles.formCard}>
          <div>
            <span>Form</span>
            <h2>{sampleFormBlueprint.title}</h2>
            <p>{sampleFormBlueprint.description}</p>
          </div>
          <dl>
            <div>
              <dt>Fields</dt>
              <dd>{fields}</dd>
            </div>
            <div>
              <dt>Capacity options</dt>
              <dd>{capacityOptions}</dd>
            </div>
            <div>
              <dt>Slug</dt>
              <dd>{sampleFormBlueprint.slug}</dd>
            </div>
          </dl>
        </article>

        <article className={styles.panel}>
          <span>Next</span>
          <h2>Schema and seed data</h2>
          <p>
            The Prisma schema is ready for forms, fields, options, rules,
            registrations, answers, and provider-separated payments.
          </p>
        </article>
      </section>
    </AppShell>
  );
}
