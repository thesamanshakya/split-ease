import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/utils/session";
import { supabase } from "@/utils/supabase";

export async function GET() {
  try {
    // Get the session from iron-session
    // Properly await the cookies() function
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    if (!session.isLoggedIn || !session.userId || !session.accessToken) {
      return NextResponse.json({
        isLoggedIn: false,
        user: null,
      });
    }

    // Verify the session with Supabase
    const { data, error } = await supabase.auth.getUser(session.accessToken);

    if (error || !data.user) {
      // Session is invalid, clear it
      session.userId = undefined;
      session.isLoggedIn = false;
      session.accessToken = undefined;
      session.refreshToken = undefined;

      // Save the cleared session
      await session.save();

      return NextResponse.json({
        isLoggedIn: false,
        user: null,
      });
    }

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    return NextResponse.json({
      isLoggedIn: true,
      user: profileData || {
        id: data.user.id,
        email: data.user.email || "",
        name:
          data.user.user_metadata?.name ||
          (data.user.email ? data.user.email.split("@")[0] : "User"),
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", isLoggedIn: false },
      { status: 500 }
    );
  }
}
