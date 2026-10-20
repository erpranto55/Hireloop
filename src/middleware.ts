import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Session cookie check (handling both development and HTTPS/production __Secure- prefixes)
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/signup");
  const isDashboardPage = pathname.startsWith("/dashboard");

  // Unauthenticated user trying to access protected dashboard routes
  if (isDashboardPage && !sessionToken) {
    const callbackUrl = encodeURIComponent(`${pathname}${search}`);
    const redirectUrl = new URL(`/signin?callbackUrl=${callbackUrl}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Already authenticated user visiting signin/signup
  if (isAuthPage && sessionToken) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl && callbackUrl.startsWith("/")) {
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/signin",
    "/signup",
  ],
};
