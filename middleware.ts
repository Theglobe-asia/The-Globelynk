import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // skip next-auth routes and public assets
  if (
    path.startsWith("/api/auth") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.startsWith("/signin")
  ) {
    return NextResponse.next();
  }

  // pages that must be protected
  const protectedPaths = ["/send", "/report", "/customize", "/create", "/dashboard", "/logs"];
  const isProtected = protectedPaths.some((p) => path === p || path.startsWith(`${p}/`));

  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/signin";
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// explicit match configuration
export const config = {
  matcher: [
    "/send/:path*",
    "/report/:path*",
    "/customize/:path*",
    "/create/:path*",
    "/dashboard/:path*",
    "/logs/:path*",
  ],
};
