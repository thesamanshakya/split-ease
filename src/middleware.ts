import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/utils/session";

export async function middleware(request: NextRequest) {
  // Skip API routes
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Create a response object that we'll manipulate and return
  let response = NextResponse.next();

  try {
    // Get the session from iron-session
    const res = new Response();
    const session = await getIronSession<SessionData>(
      request,
      res,
      sessionOptions
    );

    // Check authentication status
    const isAuthenticated = session.isLoggedIn && !!session.userId;

    const isAuthPage = request.nextUrl.pathname === "/auth";
    const isPublicPage = request.nextUrl.pathname === "/";

    // Handle authentication redirects
    if (!isAuthenticated && !isAuthPage && !isPublicPage) {
      // If not authenticated and not on auth page, redirect to auth
      const redirectUrl = new URL("/auth", request.url);
      response = NextResponse.redirect(redirectUrl);
    } else if (isAuthenticated && isAuthPage) {
      // If authenticated and on auth page, redirect to dashboard
      const redirectUrl = new URL("/dashboard", request.url);
      response = NextResponse.redirect(redirectUrl);
    }

    // Get the Set-Cookie header from the response
    const setCookieHeader = res.headers.get("Set-Cookie");
    if (setCookieHeader) {
      // Apply the Set-Cookie header to the NextResponse
      response.headers.set("Set-Cookie", setCookieHeader);
    }
  } catch (error) {
    console.error("Middleware error:", error);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
