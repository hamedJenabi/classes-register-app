import { AppShell } from "@/components/AppShell";
import { getDashboardFormSummaries } from "@/lib/forms";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

export default async function Home() {
  const forms = await getDashboardFormSummaries();
  const primaryForm = forms[0];
  const stats = [
    {
      label: "Draft forms",
      value: String(forms.filter((form) => form.status === "DRAFT").length),
    },
    {
      label: "Published forms",
      value: String(forms.filter((form) => form.status === "PUBLISHED").length),
    },
    {
      label: "Capacity-managed options",
      value: String(
        forms.reduce((total, form) => total + form.capacityOptionCount, 0),
      ),
    },
  ];

  return (
    <AppShell
      eyebrow="Blues Dance Vienna"
      title="Registration builder"
      description="Local MVP workspace for building reusable class registration forms."
      actions={[
        { label: "Dashboard", href: "/dashboard" },
        ...(primaryForm
          ? [{ label: "Preview form", href: `/forms/${primaryForm.slug}` }]
          : []),
      ]}
    >
      <section className={styles.hero}>
        <div className={styles.heroImage} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <p>Current slice</p>
          <h2>Generic form builder foundation</h2>
        </div>
      </section>

      <section className={styles.stats} aria-label="Project status">
        {stats.map((stat) => (
          <article className={styles.stat} key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
