import { AppShell } from "@/components/AppShell";
import styles from "./page.module.scss";

const stats = [
  { label: "Draft forms", value: "1" },
  { label: "Published forms", value: "0" },
  { label: "Capacity-managed options", value: "2" },
];

export default function Home() {
  return (
    <AppShell
      eyebrow="Blues Dance Vienna"
      title="Registration builder"
      description="Local MVP workspace for building reusable class registration forms."
      actions={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Preview form", href: "/forms/blues-foundations" },
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
