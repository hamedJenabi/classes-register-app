import Link from "next/link";
import { FormStatus } from "@/generated/prisma/enums";
import { AppShell } from "@/components/AppShell";
import { formatFormStatus, getDashboardFormSummaries } from "@/lib/forms";
import { createFormAction } from "./actions";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

const formStatusOptions = [
  { label: "Draft", value: FormStatus.DRAFT },
  { label: "Published", value: FormStatus.PUBLISHED },
  { label: "Archived", value: FormStatus.ARCHIVED },
];

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
      adminPreviewHref={primaryForm ? `/forms/${primaryForm.slug}` : undefined}
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

      <section className={styles.builderPanel} aria-label="Create a new form">
        <div className={styles.sectionHeader}>
          <div>
            <span>Form builder</span>
            <h2>Build a new form</h2>
          </div>
          <p>Create the form first, then add fields and class options.</p>
        </div>

        <form action={createFormAction} className={styles.formBuilder}>
          <label>
            Title
            <input name="title" placeholder="Summer intensive registration" required />
          </label>
          <label>
            Public slug
            <input name="slug" placeholder="summer-intensive" />
          </label>
          <label>
            Status
            <select name="status" defaultValue={FormStatus.DRAFT}>
              {formStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Submit button
            <input name="submitButtonLabel" placeholder="Register" />
          </label>
          <label className={styles.wideControl}>
            Description
            <textarea
              name="description"
              placeholder="Short public description for participants"
              rows={3}
            />
          </label>
          <label className={styles.wideControl}>
            Success message
            <textarea
              name="successMessage"
              placeholder="Thanks for registering. We will be in touch soon."
              rows={3}
            />
          </label>
          <button type="submit">Create form</button>
        </form>
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
