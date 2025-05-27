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

    const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
    const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth/");
    const isPublicRoute = request.nextUrl.pathname.startsWith("/_next") || 
                         request.nextUrl.pathname.startsWith("/static") ||
                         request.nextUrl.pathname.startsWith("/favicon.ico");

    // Allow public routes to pass through
    if (isPublicRoute) {
      return res;
    }

    // Allow auth routes to pass through
    if (isAuthRoute) {
      return res;
    }

    // Check authentication for API routes
    if (isApiRoute && !token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publicPages = ["/login", "/register", "/reset-password", "/set-password"];
    const isPublicPage = publicPages.some((page) =>
      request.nextUrl.pathname.startsWith(page)
    );

    // Check authentication for protected pages
    if (!isApiRoute && !token && !isPublicPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of error, allow the request to proceed to avoid blocking users
    return NextResponse.next();
  }
}

// export async function middleware(request: NextRequest) {
//   console.log("request-object", request);
//   const token = await getToken({ req: request });

//   const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
//   const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth/");
//   console.log("token-object", token);

//   // Allow auth routes to pass through
//   if (isAuthRoute) {
//     return NextResponse.next();
//   }

//   // Check authentication for API routes
//   if (isApiRoute && !token) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }
//   const publicPages = ["/login", "/register", "/reset-password"];
//   const isPublicPage = publicPages.some((page) =>
//     request.nextUrl.pathname.startsWith(page)
//   );

//   // Check authentication for protected pages
//   if (!isApiRoute && !token && !isPublicPage) {
//     return NextResponse.redirect(new URL("/login", request.url));
//   }

//   return NextResponse.next();
// }

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
