import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  console.log("OAuth callback received:", request.url);

  try {
    // Get the cookie store
    const cookieStore = await cookies();

    // Check if this was a signup request
    const isSignup = cookieStore.get("oauth_signup")?.value === "true";
    console.log("Is signup:", isSignup);

    // Create a response that will redirect to the auth page
    // We'll let the client-side handle the OAuth flow completion
    const redirectUrl = new URL("/auth/oauth-callback", request.url);

    // Add any necessary parameters
    if (isSignup) {
      redirectUrl.searchParams.set("signup", "true");
    }

    // Add the full URL as a parameter for the client to process
    redirectUrl.searchParams.set("callback_url", request.url);

    console.log("Redirecting to client handler:", redirectUrl.toString());

    // Create the response
    const response = NextResponse.redirect(redirectUrl);

    // Clear the signup cookie
    response.cookies.set("oauth_signup", "", {
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/auth?error=oauth_failed", request.url)
    );
  }
}

// This ensures the route is treated as an Edge Function
export const runtime = "edge";
