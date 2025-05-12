import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// import { getIronSession } from "iron-session";
// import { sessionOptions, SessionData } from "@/utils/session";

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

  // Create a response object that we'll manipulate and return
  // let response = NextResponse.next();

  try {
    // Get the session from iron-session
    // const res = new Response();
    // const session = await getIronSession<SessionData>(
    //   request,
    //   res,
    //   sessionOptions
    // );
    // Check authentication status
    // const isAuthenticated = session.isLoggedIn && !!session.userId;
    // const isAuthPage = request.nextUrl.pathname === "/auth";
    // const isPublicPage = request.nextUrl.pathname === "/";
    // const isDashboardPage = request.nextUrl.pathname === "/dashboard";
    // Handle authentication redirects
    // if (!isAuthenticated && !isAuthPage && !isPublicPage) {
    //   // If not authenticated and not on auth page, redirect to auth
    //   const redirectUrl = new URL("/auth", request.url);
    //   if (request.nextUrl.pathname !== "/auth") {
    //     response = NextResponse.redirect(redirectUrl);
    //     console.log(
    //       `Redirecting unauthenticated user from ${request.nextUrl.pathname} to /auth`
    //     );
    //   }
    // }
    // else if (isAuthenticated && !isDashboardPage) {
    //   // If authenticated and on auth page, redirect to dashboard
    //   const redirectUrl = new URL("/dashboard", request.url);
    //   if (request.nextUrl.pathname !== "/dashboard") {
    //     response = NextResponse.redirect(redirectUrl);
    //     console.log(`Redirecting authenticated user from /auth to /dashboard`);
    //   }
    // }
    // Get the Set-Cookie header from the response
    // const setCookieHeader = res.headers.get("Set-Cookie");
    // if (setCookieHeader) {
    //   // Apply the Set-Cookie header to the NextResponse
    //   response.headers.set("Set-Cookie", setCookieHeader);
    // }
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of error, just continue to the page without redirecting
    return NextResponse.next();
  }

  // return response;
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
