import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow public pages and static files
  if (
    path === "/login" ||
    path === "/register" ||
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow RSC requests to pass through
  if (path.includes("_rsc")) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Handle API routes
  if (path.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Handle all other routes
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};