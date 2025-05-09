import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { getSession } from "@/utils/session";

// GET handler to fetch notifications for the current user
export async function GET(req: NextRequest) {
  try {
    // Use Iron Session for authentication instead of Supabase cookies
    const ironSession = await getSession();

    if (!ironSession.isLoggedIn || !ironSession.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a direct Supabase client without using cookies
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // No need to verify with Supabase session, we're using the service role key
    // which has admin privileges and bypasses RLS

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    // Build the query
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", ironSession.userId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Add filter for unread notifications if requested
    if (unreadOnly) {
      query = query.eq("read", false);
    }

    // Execute the query
    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    // Get count of unread notifications
    const { count, error: countError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", ironSession.userId)
      .eq("read", false);

    if (countError) {
      console.error("Error counting unread notifications:", countError);
      return NextResponse.json(
        { error: "Failed to count unread notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notifications,
      unreadCount: count || 0,
    });
  } catch (error) {
    console.error("Unexpected error in notifications API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// PATCH handler to mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    // Use Iron Session for authentication instead of Supabase cookies
    const ironSession = await getSession();

    if (!ironSession.isLoggedIn || !ironSession.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a direct Supabase client without using cookies
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // No need to verify with Supabase session, we're using the service role key

    // Get request body
    const body = await req.json();
    const { ids, all = false } = body;

    if (!all && (!ids || !Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json(
        {
          error:
            "Invalid request: must provide notification IDs or set all=true",
        },
        { status: 400 }
      );
    }

    let updateQuery;

    if (all) {
      // Mark all notifications as read
      updateQuery = supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", ironSession.userId)
        .eq("read", false);
    } else {
      // Mark specific notifications as read
      updateQuery = supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", ironSession.userId)
        .in("id", ids);
    }

    const { error } = await updateQuery;

    if (error) {
      console.error("Error updating notifications:", error);
      return NextResponse.json(
        { error: "Failed to update notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in notifications API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
