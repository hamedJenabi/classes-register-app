import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { formatFormStatus, getDashboardFormSummaries } from "@/lib/forms";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const forms = await getDashboardFormSummaries();
  const primaryForm = forms[0];
  const fieldCount = forms.reduce((total, form) => total + form.fieldCount, 0);
  const capacityOptionCount = forms.reduce(
    (total, form) => total + form.capacityOptionCount,
    0,
  );

  return (
    <AppShell
      eyebrow="Dashboard"
      title="Forms"
      description="Draft and published registration forms for classes and events."
      actions={
        primaryForm ? [{ label: "Preview", href: `/forms/${primaryForm.slug}` }] : []
      }
    >
      <section className={styles.toolbar}>
        <div>
          <span>Local MVP</span>
          <strong>
            {forms.length} {forms.length === 1 ? "form" : "forms"} persisted
          </strong>
        </div>
        <p>
          {fieldCount} fields / {capacityOptionCount} capacity options
        </p>
      </section>

      {forms.length > 0 ? (
        <section className={styles.grid}>
          {forms.map((form) => (
            <article className={styles.formCard} key={form.id}>
              <div>
                <span>{formatFormStatus(form.status)}</span>
                <h2>{form.title}</h2>
                <p>{form.description}</p>
              </div>
              <dl>
                <div>
                  <dt>Fields</dt>
                  <dd>{form.fieldCount}</dd>
                </div>
                <div>
                  <dt>Capacity options</dt>
                  <dd>{form.capacityOptionCount}</dd>
                </div>
                <div>
                  <dt>Registrations</dt>
                  <dd>{form.registrationCount}</dd>
                </div>
              </dl>
              <div className={styles.cardActions}>
                <Link href={`/dashboard/forms/${form.slug}`}>Details</Link>
                <Link href={`/forms/${form.slug}`}>Preview</Link>
              </div>
            </article>
          ))}

          <article className={styles.panel}>
            <span>Next</span>
            <h2>Field editing</h2>
            <p>
              The dashboard now reads form definitions from Prisma. The next
              slice can add mutation routes and editor controls for MVP field
              types.
            </p>
          </article>
        </section>
      ) : (
        <section className={styles.emptyState}>
          <span>Seed data</span>
          <h2>No forms found</h2>
          <p>
            Run the Prisma migration and seed commands to create the first Blues
            Dance Vienna registration form.
          </p>
        </section>
      )}
    </AppShell>
  );
}
