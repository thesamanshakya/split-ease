import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  
  // Check if this is a verification redirect from Supabase
  if (token && type === 'signup') {
    // Redirect to the auth page with verification success parameter
    return NextResponse.redirect(new URL('/auth?verification=success', request.url));
  }
  
  // If not a verification redirect, redirect to homepage
  return NextResponse.redirect(new URL('/', request.url));
}

// This ensures the route is treated as an Edge Function
export const runtime = 'edge';
