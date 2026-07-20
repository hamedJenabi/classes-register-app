"use client";

import * as Ariakit from "@ariakit/react";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./AppShell.module.scss";

type AppShellAction = {
  label: string;
  href: string;
};

type AppShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: AppShellAction[];
  children: ReactNode;
};

export function AppShell({
  eyebrow,
  title,
  description,
  actions = [],
  children,
}: AppShellProps) {
  return (
    <main className={styles.shell}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link className={styles.brand} href="/">
          <span>BDV</span>
          <strong>Blues Dance Vienna</strong>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/forms/blues-foundations">Preview</Link>
        </div>
      </nav>

      <header className={styles.header}>
        <div>
          <p>{eyebrow}</p>
          <h1>{title}</h1>
          <span>{description}</span>
        </div>
        {actions.length > 0 ? (
          <div className={styles.actions}>
            {actions.map((action) => (
              <Ariakit.Button
                className={styles.actionButton}
                key={action.href}
                onClick={() => {
                  window.location.assign(action.href);
                }}
              >
                {action.label}
              </Ariakit.Button>
            ))}
          </div>
        ) : null}
      </header>

      <div className={styles.content}>{children}</div>
    </main>
  );
}
