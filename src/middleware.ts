import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/utils/session";

export async function middleware(request: NextRequest) {
  // Skip API routes and static files
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const isStaticFile =
    request.nextUrl.pathname.includes(".") || // Files with extensions (like .jpg, .svg, etc.)
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon.ico");

  if (isApiRoute || isStaticFile) {
    return NextResponse.next();
  }

  try {
    // Create a new Response object for iron-session
    const res = new Response();

    // Get the session from iron-session
    const session = await getIronSession<SessionData>(
      request,
      res,
      sessionOptions
    );

    // Check authentication status
    const isAuthenticated = session.isLoggedIn && !!session.userId;

    // Define public and protected paths
    const isAuthPage = request.nextUrl.pathname === "/auth";
    const isPublicPage = request.nextUrl.pathname === "/";
    const isProtectedPage = !isAuthPage && !isPublicPage;

    // Create a response based on authentication status and requested path
    let response;

    // Handle redirects based on auth status and requested path
    if (!isAuthenticated && isProtectedPage) {
      // Not authenticated trying to access protected page - redirect to auth
      const url = new URL("/auth", request.url);
      response = NextResponse.redirect(url);
    } else if (isAuthenticated && isAuthPage) {
      // Authenticated trying to access auth page - redirect to dashboard
      const url = new URL("/dashboard", request.url);
      response = NextResponse.redirect(url);
    } else {
      // Default: proceed to the requested page
      response = NextResponse.next();
    }

    // Get the Set-Cookie header from the iron-session response
    const setCookieHeader = res.headers.get("Set-Cookie");
    if (setCookieHeader) {
      // Apply the Set-Cookie header to our response
      response.headers.set("Set-Cookie", setCookieHeader);
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of an error, proceed to the requested page
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - .*\\..* (files with extensions like .jpg, .png, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).+)",
  ],
};
