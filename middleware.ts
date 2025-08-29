import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // super dashboard protection
    if (req.nextUrl.pathname.startsWith("/app/(super)") && token.role !== "SUPER") {
      return NextResponse.redirect(new URL("/app/(tenant)/dashboard", req.url));
    }

    // tenant dashboard protection
    if (req.nextUrl.pathname.startsWith("/app/(tenant)") && token.role !== "TENANT") {
      return NextResponse.redirect(new URL("/app/(super)/dashboard", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/app/(super)/:path*", "/app/(tenant)/:path*"],
};
