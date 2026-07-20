import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getDashboardRegistrations } from "@/lib/registrations";
import styles from "./page.module.scss";

type RegistrationsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function RegistrationsPage({
  params,
}: RegistrationsPageProps) {
  const { slug } = await params;
  const form = await getDashboardRegistrations(slug);

  if (!form) {
    notFound();
  }

  return (
    <AppShell
      eyebrow="Registrations"
      title={form.title}
      description="Submitted participants and their answers."
      actions={[
        { label: "Form detail", href: `/dashboard/forms/${form.slug}` },
        { label: "Preview", href: `/forms/${form.slug}` },
      ]}
    >
      <section className={styles.toolbar}>
        <span>{form.registrations.length} submissions</span>
      </section>

      <section className={styles.list} aria-label="Submitted registrations">
        {form.registrations.length > 0 ? (
          form.registrations.map((registration) => (
            <article className={styles.registration} key={registration.id}>
              <header>
                <div>
                  <span>{formatDate(registration.submittedAt)}</span>
                  <h2>{registration.participantName ?? "Unnamed participant"}</h2>
                  <p>{registration.participantEmail ?? "No email"}</p>
                </div>
                <div className={styles.statusStack}>
                  <strong>{formatStatus(registration.status)}</strong>
                  <small>{formatStatus(registration.paymentStatus)}</small>
                </div>
              </header>

              <dl>
                {registration.answers.map((answer) => (
                  <div key={answer.id}>
                    <dt>{answer.fieldLabel}</dt>
                    <dd>{answer.optionLabel ?? answer.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))
        ) : (
          <article className={styles.emptyState}>
            <span>No registrations yet</span>
            <p>New public submissions will appear here after they are saved.</p>
          </article>
        )}
      </section>
    </AppShell>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}
