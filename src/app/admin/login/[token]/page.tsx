import { notFound } from "next/navigation";
import { isAdminLoginToken } from "@/lib/auth";
import { loginAction } from "../actions";
import styles from "../page.module.scss";

type LoginPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const { token } = await params;
  const query = await searchParams;

  if (!isAdminLoginToken(token)) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.brand}>
          <span>BDV</span>
          <strong>Blues Dance Vienna</strong>
        </div>
        <div>
          <p>Admin</p>
          <h1>Sign in</h1>
        </div>

        {query.error ? (
          <p className={styles.error}>{getErrorMessage(query.error)}</p>
        ) : null}

        <form action={loginAction} className={styles.form}>
          <input name="token" type="hidden" value={token} />
          <input name="next" type="hidden" value={query.next ?? "/dashboard"} />
          <label>
            Password
            <input
              autoComplete="current-password"
              autoFocus
              name="password"
              required
              type="password"
            />
          </label>
          <button type="submit">Sign in</button>
        </form>
      </section>
    </main>
  );
}

function getErrorMessage(error: string) {
  if (error === "config") {
    return "Admin login is not configured. Set ADMIN_PASSWORD, ADMIN_SESSION_TOKEN, and ADMIN_LOGIN_TOKEN.";
  }

  return "That password did not work.";
}
