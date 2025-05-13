import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { createSession } from '@/utils/session';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/utils/session';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const code = searchParams.get('code');
  
  // Check if this is a verification redirect from Supabase
  if (token && type === 'signup') {
    // Redirect to the auth page with verification success parameter
    return NextResponse.redirect(new URL('/auth?verification=success', request.url));
  }
  
  // Check if this is an OAuth redirect (has code parameter)
  if (code) {
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('OAuth exchange error:', error);
        return NextResponse.redirect(new URL('/auth?error=oauth_failed', request.url));
      }
      
      if (data.session) {
        // Get the iron session
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
        
        // Create a response that will redirect to dashboard with a success parameter
        // This will trigger the same success toast as normal login
        const redirectUrl = new URL('/dashboard', request.url);
        redirectUrl.searchParams.set('login', 'success');
        
        // Redirect to dashboard with success parameter
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('OAuth session error:', error);
      return NextResponse.redirect(new URL('/auth?error=oauth_failed', request.url));
    }
  }
  
  // If not a verification or OAuth redirect, redirect to homepage
  return NextResponse.redirect(new URL('/', request.url));
}

// This ensures the route is treated as an Edge Function
export const runtime = 'edge';
