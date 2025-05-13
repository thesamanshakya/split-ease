import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/utils/supabase";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/utils/session";

export async function POST(req: NextRequest) {
  try {
    // Get credentials from request body
    const body = await req.json();
    const { email, password, provider, access_token, refresh_token } = body;

    let data: any = null;
    let error: any = null;

    // Check if this is an OAuth login or a password login
    if (provider === "google" && access_token && refresh_token) {
      console.log("Processing OAuth login");

      // For OAuth logins, we already have the tokens, so we just need to verify them
      // We'll set the session directly
      ({ data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      }));
    } else if (email && password) {
      console.log("Processing password login");

      // For password logins, authenticate with Supabase
      ({ data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      }));
    } else {
      return NextResponse.json(
        { error: "Invalid login credentials" },
        { status: 400 }
      );
    }

    if (error) {
      console.error("Login error:", error);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // Get the iron session
    // Properly await the cookies() function
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    // Set session data
    session.userId = data.session.user.id;
    session.isLoggedIn = true;
    session.accessToken = data.session.access_token;
    session.refreshToken = data.session.refresh_token;

    // Save the session
    await session.save();

    // Create a response with the user data
    return NextResponse.json({
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
      },
      success: true,
    });
  } catch (error) {
    console.error("Unexpected login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
