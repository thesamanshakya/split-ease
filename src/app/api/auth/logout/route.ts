import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/utils/supabase";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/utils/session";

export async function POST() {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the iron session
    // Properly await the cookies() function
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    // Clear session data
    session.userId = undefined;
    session.isLoggedIn = false;
    session.accessToken = undefined;
    session.refreshToken = undefined;

    // Save the session (with cleared data)
    await session.save();

    // Create a response
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Unexpected logout error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
