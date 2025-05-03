import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  // Create supabase client for middleware
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Refresh session if available
  const { data: { session } } = await supabase.auth.getSession();

  // Check authentication status
  const isAuthenticated = !!session;
  const isAuthPage = request.nextUrl.pathname === '/auth';
  const isPublicPage = request.nextUrl.pathname === '/';

  // // Handle authentication redirects
  // if (!isAuthenticated && !isAuthPage && !isPublicPage) {
  //   // If not authenticated and not on auth page, redirect to auth
  //   const redirectUrl = new URL('/auth', request.url);
  //   return NextResponse.redirect(redirectUrl);
  // }

  // if (isAuthenticated && isAuthPage) {
  //   // If authenticated and on auth page, redirect to dashboard
  //   const redirectUrl = new URL('/dashboard', request.url);
  //   return NextResponse.redirect(redirectUrl);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 