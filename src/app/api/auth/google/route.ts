import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function GET(req: NextRequest) {
  try {
    // Get the current URL to extract the origin for the redirect
    const url = new URL(req.url);
    const origin = url.origin;
    
    // Get the redirect URL for Google OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/api/auth/redirect`,
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

    // Redirect to the Google OAuth URL
    return NextResponse.redirect(data.url);
  } catch (error) {
    console.error("Unexpected Google OAuth error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
