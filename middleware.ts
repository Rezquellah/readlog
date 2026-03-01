import { NextResponse, type NextRequest } from "next/server";

import { updateAuthSession } from "@/lib/supabase/middleware";

const AUTH_ROUTES = new Set(["/login", "/signup"]);

export async function middleware(request: NextRequest) {
  const { user, response } = await updateAuthSession(request);

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = AUTH_ROUTES.has(pathname);

  if (!user && !isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
