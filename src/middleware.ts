import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth/");

  // Allow auth routes to pass through
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // Check authentication for API routes
  if (isApiRoute && !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check authentication for protected pages
  if (!isApiRoute && !token && !request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
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
