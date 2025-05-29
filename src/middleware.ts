import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  try {
    // Initialize Supabase client
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });
    
    // Get NextAuth token, explicitly specifying the custom cookie name
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: "next-auth.session-token", 
    });

    const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
    const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth/");
    const isRscRequest = request.nextUrl.searchParams.has("_rsc");
    const isPublicRoute = request.nextUrl.pathname.startsWith("/_next") || 
                         request.nextUrl.pathname.startsWith("/static") ||
                         request.nextUrl.pathname.startsWith("/favicon.ico") ||
                         request.nextUrl.pathname === "/manifest.json" ||
                         request.nextUrl.pathname.startsWith("/logo-at.png");

    // Allow public routes and RSC requests to pass through
    if (isPublicRoute || isRscRequest) {
      return res;
    }

    // Allow auth routes to pass through
    if (isAuthRoute) {
      return res;
    }

    const publicPages = ["/login", "/register", "/reset-password", "/set-password"];
    const isPublicPage = publicPages.some((page) =>
      request.nextUrl.pathname.startsWith(page)
    );

    // If it's a public page, allow access regardless of auth status
    if (isPublicPage) {
      return res;
    }

    // Handle unauthorized access for protected routes
    if (!token) {
      // For API routes, return JSON response
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      // For all other routes, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of error, allow the request to proceed to avoid blocking users
    return NextResponse.next();
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (web app manifest)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|logo-at.png|public/).*)",
  ],
};