"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminSessionCookieName,
  getAdminLoginToken,
  getAdminPassword,
  getAdminSessionToken,
  isAdminLoginToken,
} from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = formData.get("password");
  const next = formData.get("next");
  const token = formData.get("token");
  const adminPassword = getAdminPassword();
  const loginToken = getAdminLoginToken();
  const sessionToken = getAdminSessionToken();

  if (!adminPassword || !loginToken || !sessionToken) {
    redirect(getLoginRedirect(token, next, "config"));
  }

  if (typeof token !== "string" || !isAdminLoginToken(token)) {
    redirect("/forms/blues-foundations");
  }

  if (typeof password !== "string" || password !== adminPassword) {
    redirect(getLoginRedirect(token, next, "invalid"));
  }

  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookieName, sessionToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect(getSafeNextPath(next));
}

function getLoginRedirect(
  token: FormDataEntryValue | null,
  next: FormDataEntryValue | null,
  error: string,
) {
  const searchParams = new URLSearchParams({
    error,
    next: getSafeNextPath(next),
  });
  const loginToken =
    typeof token === "string" && token.length > 0 ? token : "missing-token";

  return `/admin/login/${loginToken}?${searchParams.toString()}`;
}

function getSafeNextPath(next: FormDataEntryValue | null) {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  if (next.startsWith("/admin/login")) {
    return "/dashboard";
  }

  return next;
}
