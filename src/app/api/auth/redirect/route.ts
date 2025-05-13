import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/utils/session";

export async function GET(request: NextRequest) {
  // Debug log the request URL and parameters
  console.log("Redirect handler called with URL:", request.url);
  
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const isSignup = searchParams.get("signup") === "true";
  
  console.log("Parameters:", { token, type, code, isSignup });

  // Check if this is a verification redirect from Supabase
  if (token && type === "signup") {
    // Redirect to the auth page with verification success parameter
    return NextResponse.redirect(
      new URL("/auth?verification=success", request.url)
    );
  }

  // Check if this is an OAuth redirect (has code parameter)
  if (code) {
    try {
      console.log("Exchanging code for session...");
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      console.log("Exchange result:", { 
        success: !!data && !error,
        hasSession: !!data?.session,
        error: error ? error.message : null 
      });

      if (error) {
        console.error("OAuth exchange error:", error);
        return NextResponse.redirect(
          new URL("/auth?error=oauth_failed", request.url)
        );
      }

      if (data.session) {
        console.log("Supabase session created, creating Iron session...");
        console.log("User ID:", data.session.user.id);
        
        try {
          // Get the iron session
          const cookieStore = await cookies();
          console.log("Got cookie store");
          
          const session = await getIronSession<SessionData>(
            cookieStore,
            sessionOptions
          );
          console.log("Got Iron session");

          // Set session data
          session.userId = data.session.user.id;
          session.isLoggedIn = true;
          session.accessToken = data.session.access_token;
          session.refreshToken = data.session.refresh_token;
          console.log("Set session data");

          // Save the session
          await session.save();
          console.log("Saved Iron session");

        // Create a response that will redirect to dashboard with a success parameter
        // This will trigger the same success toast as normal login
        const redirectUrl = new URL("/dashboard", request.url);
        
        // Set the appropriate parameter based on whether this is a signup or login
        if (isSignup) {
          redirectUrl.searchParams.set("signup", "success");
        } else {
          redirectUrl.searchParams.set("login", "success");
        }

        console.log("Redirecting to:", redirectUrl.toString());
        
        // Redirect to dashboard with success parameter
        return NextResponse.redirect(redirectUrl);
        } catch (sessionError) {
          console.error("Error creating Iron session:", sessionError);
          return NextResponse.redirect(
            new URL("/auth?error=session_failed", request.url)
          );
        }
      }
    } catch (error) {
      console.error("OAuth session error:", error);
      return NextResponse.redirect(
        new URL("/auth?error=oauth_failed", request.url)
      );
    }
  }

  // If not a verification or OAuth redirect, redirect to homepage
  return NextResponse.redirect(new URL("/", request.url));
}

// This ensures the route is treated as an Edge Function
export const runtime = "edge";
