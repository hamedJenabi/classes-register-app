import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminSessionCookieName, getAdminLoginToken } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete(adminSessionCookieName);

  const loginToken = getAdminLoginToken();

  redirect(loginToken ? `/admin/login/${loginToken}` : "/forms/blues-foundations");
}
