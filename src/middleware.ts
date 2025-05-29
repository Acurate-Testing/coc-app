import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  try {
    // Initialize Supabase client
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });
    
    // Get NextAuth token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Add debugging
    console.log("Middleware - Path:", request.nextUrl.pathname);
    console.log("Middleware - Search params:", request.nextUrl.searchParams.toString());
    console.log("Middleware - Has token:", !!token);

    const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
    const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth/");
    const isRscRequest = request.nextUrl.searchParams.has("_rsc");
    const isPublicRoute = request.nextUrl.pathname.startsWith("/_next") || 
                         request.nextUrl.pathname.startsWith("/static") ||
                         request.nextUrl.pathname.startsWith("/favicon.ico") ||
                         request.nextUrl.pathname === "/manifest.json" ||
                         request.nextUrl.pathname.startsWith("/logo-at.png");

    // Allow public routes to pass through
    if (isPublicRoute) {
      console.log("Middleware - Allowing public route");
      return res;
    }

    // Allow auth routes to pass through
    if (isAuthRoute) {
      console.log("Middleware - Allowing auth route");
      return res;
    }

    // Check authentication for API routes
    if (isApiRoute && !token) {
      console.log("Middleware - Blocking unauthenticated API route");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publicPages = ["/login", "/register", "/reset-password", "/set-password"];
    const isPublicPage = publicPages.some((page) =>
      request.nextUrl.pathname.startsWith(page)
    );

    // For RSC requests to protected pages, check authentication
    if (isRscRequest && !token && !isPublicPage) {
      console.log("Middleware - Blocking unauthenticated RSC request");
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check authentication for protected pages
    if (!isApiRoute && !token && !isPublicPage) {
      console.log("Middleware - Redirecting to login");
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    console.log("Middleware - Allowing request");
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