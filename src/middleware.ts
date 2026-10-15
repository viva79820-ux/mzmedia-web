import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const { pathname } = request.nextUrl;
  const isOsPage =
    (pathname === "/os" || pathname.startsWith("/os/")) &&
    !pathname.startsWith("/os/login") &&
    !pathname.startsWith("/api/");

  if (isOsPage) {
    const token = request.cookies.get("mz_staff")?.value;
    if (!token) {
      const login = new URL("/os/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
