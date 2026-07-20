import { NextResponse, type NextRequest } from "next/server";
import { adminSessionCookieName, isAdminSessionToken } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get(adminSessionCookieName)?.value;

  if (isAdminSessionToken(sessionToken)) {
    return NextResponse.next();
  }

  return new NextResponse("Not found", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
    status: 404,
  });
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
