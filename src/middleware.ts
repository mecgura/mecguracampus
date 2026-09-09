import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Edge-safe: verifies the Auth.js JWT session cookie without importing the DB.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isConsole = pathname === "/console" || pathname.startsWith("/console/");
  if (!isConsole) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const role = (token as { role?: string } | null)?.role;
  if (!token || (role !== "super" && role !== "school")) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    loginUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/console", "/console/:path*"],
};
