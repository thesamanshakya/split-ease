import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/utils/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// This is a server-side only route that handles adding a user to a group after verification
export async function POST(req: NextRequest) {
  try {
    // Get the group ID and user ID from the request body
    const { groupId } = await req.json();

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Get the current user from the session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Create an admin client to access Supabase with elevated privileges
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user is already a member of the group
    const { data: existingMember, error: checkError } = await supabaseAdmin
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', session.userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // If user is already a member, return success
    if (existingMember) {
      return NextResponse.json({
        success: true,
        message: 'User is already a member of this group',
      });
    }

    // Add user to the group
    const { error: memberError } = await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: session.userId,
      });

    if (memberError) throw memberError;

    return NextResponse.json({
      success: true,
      message: 'User added to group successfully',
    });
  } catch (error: any) {
    console.error('Error handling invite:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while handling the invitation' },
      { status: 500 }
    );
  }
}
