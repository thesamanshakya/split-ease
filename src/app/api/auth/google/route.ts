import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function GET(req: NextRequest) {
  try {
    // Get the current URL to extract the origin for the redirect
    const url = new URL(req.url);
    const origin = url.origin;
    const searchParams = url.searchParams;
    
    // Check if this is a signup request
    const isSignup = searchParams.get('signup') === 'true';
    
    console.log("Starting Google OAuth flow", { origin, isSignup });
    
    // Get the redirect URL for Google OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Use the custom API route for the redirect
        redirectTo: `${origin}/api/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Generated OAuth URL:", data.url);
    
    // Store the signup state in a cookie if needed
    const response = NextResponse.redirect(data.url);
    if (isSignup) {
      response.cookies.set('oauth_signup', 'true', { 
        path: '/',
        maxAge: 60 * 10, // 10 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    
    // Redirect to the Google OAuth URL
    return response;
  } catch (error) {
    console.error("Unexpected Google OAuth error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
