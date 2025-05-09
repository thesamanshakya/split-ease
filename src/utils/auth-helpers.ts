import { NextRequest } from "next/server";
import { getSessionFromCookies, SessionData } from "@/utils/session";
import { supabase } from "@/utils/supabase";

// Get the user session from cookies and verify with Supabase
export async function getAuthenticatedSession(
  request: NextRequest
): Promise<{ session: SessionData; user: any } | null> {
  try {
    // Get the session from iron-session
    const session = await getSessionFromCookies(request);

    if (!session.isLoggedIn || !session.userId || !session.accessToken) {
      return null;
    }

    // Verify the session with Supabase
    const { data, error } = await supabase.auth.getUser(session.accessToken);

    if (error || !data.user) {
      return null;
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

    const user = profileData || {
      id: data.user.id,
      email: data.user.email || "",
      name:
        data.user.user_metadata?.name ||
        (data.user.email ? data.user.email.split("@")[0] : "User"),
    };

    return { session, user };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}
