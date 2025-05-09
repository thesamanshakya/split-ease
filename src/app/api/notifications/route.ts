import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";
import { getSession } from "@/utils/session";

// GET handler to fetch notifications for the current user
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get the current session from Iron Session
    const ironSession = await getSession();

    if (!ironSession.isLoggedIn || !ironSession.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify with Supabase if needed
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Double-check with Supabase session as well
    if (sessionError || !session) {
      console.warn("Iron session valid but Supabase session invalid");
      // We'll continue with the Iron session userId anyway
    }

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
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get the current session from Iron Session
    const ironSession = await getSession();

    if (!ironSession.isLoggedIn || !ironSession.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify with Supabase if needed
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Double-check with Supabase session as well
    if (sessionError || !session) {
      console.warn("Iron session valid but Supabase session invalid");
      // We'll continue with the Iron session userId anyway
    }

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
