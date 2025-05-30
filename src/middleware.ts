import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Special handling for onboarding routes and session endpoint - completely skip auth checks
  if (path.startsWith("/users/onboard") || 
      path.startsWith("/api/users/validate-invite") || 
      path.startsWith("/api/users/onboard") ||
      path === "/api/auth/session" ||
      path.startsWith("/api/auth/session")) {
    return NextResponse.next();
  }

  // Define public routes that don't need authentication
  const publicRoutes = [
    "/login",
    "/register",
    "/_next",
    "/static",
    "/api/auth",
  ];

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    path === route || 
    path.startsWith(route)
  );

  // If it's a public route, allow access without checking auth
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Handle RSC requests
  if (path.includes("_rsc")) {
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

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