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
  brandHref?: string;
  children: ReactNode;
  surface?: "admin" | "public";
};

export function AppShell({
  eyebrow,
  title,
  description,
  actions = [],
  brandHref = "/",
  children,
  surface = "admin",
}: AppShellProps) {
  return (
    <main className={styles.shell}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link className={styles.brand} href={brandHref}>
          <span>BDV</span>
          <strong>Blues Dance Vienna</strong>
        </Link>
        {surface === "admin" ? (
          <div className={styles.navLinks}>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/forms/blues-foundations">Preview</Link>
            <Link href="/admin/logout">Sign out</Link>
          </div>
        ) : null}
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
