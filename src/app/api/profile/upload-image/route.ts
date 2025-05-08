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
        { error: "You must be logged in to upload a profile image" },
        { status: 401 }
      );
    }

    // Get the form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "avatar";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Generate a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${session.userId}-${Date.now()}.${fileExt}`;
    const folder = type === "qr_code" ? "qr-codes" : "avatars";
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase Storage using admin client
    const { error: uploadError } = await supabaseAdmin.storage
      .from("profile-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Image upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get the public URL for the uploaded image
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("profile-images")
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;

    // Update the user's profile with the new URL using the admin client
    // This bypasses RLS policies since we're using the service role key
    const updateData =
      type === "qr_code"
        ? { qr_code_url: avatarUrl }
        : { avatar_url: avatarUrl };

    const { data, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", session.userId)
      .select()
      .single();

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: data,
      avatarUrl,
      type,
    });
  } catch (error) {
    console.error("Unexpected profile image upload error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
