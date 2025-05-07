import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/utils/supabase";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/utils/session";

export async function POST(req: NextRequest) {
  try {
    // Get credentials from request body
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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
