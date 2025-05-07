import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/utils/session";
import { supabaseAdmin } from "@/utils/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    // Get the session from iron-session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    // Check if user is logged in
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: "You must be logged in to update your profile" },
        { status: 401 }
      );
    }

    // Get profile data from request body
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Update profile in Supabase using the admin client
    // This bypasses RLS policies since we're using the service role key
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        name,
        email,
        // Don't update avatar_url here, that's handled by the upload endpoint
      })
      .eq("id", session.userId)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error("Unexpected profile update error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
