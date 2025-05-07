import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Define the session data structure
export interface SessionData {
  userId?: string;
  isLoggedIn: boolean;
  accessToken?: string;
  refreshToken?: string;
}

// Define the iron session options
export const sessionOptions = {
  password: process.env.SESSION_PASSWORD || "", // At least 32 chars
  cookieName: "splitease_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

// Get the session from the request in middleware
export async function getSessionFromCookies(
  req: NextRequest
): Promise<SessionData> {
  // Create a new response to capture the cookie
  const res = new Response();

  try {
    // Get the session
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    // Initialize the session if it doesn't exist
    if (session.isLoggedIn === undefined) {
      session.isLoggedIn = false;
    }

    return session;
  } catch (error) {
    console.error("Error getting session from cookies:", error);
    // Return a default session if there's an error
    return { isLoggedIn: false };
  }
}

// Create a middleware response with session
export async function createMiddlewareResponse(
  req: NextRequest,
  baseResponse: NextResponse,
  session: SessionData
): Promise<NextResponse> {
  try {
    // Create a new response to capture the cookie
    const res = new Response();

    // Get the session and update it
    const ironSession = await getIronSession<SessionData>(
      req,
      res,
      sessionOptions
    );

    // Update the session
    ironSession.userId = session.userId;
    ironSession.isLoggedIn = session.isLoggedIn;
    ironSession.accessToken = session.accessToken;
    ironSession.refreshToken = session.refreshToken;

    // Get the Set-Cookie header from the response
    const setCookieHeader = res.headers.get("Set-Cookie");

    if (setCookieHeader) {
      // Apply the Set-Cookie header to the NextResponse
      baseResponse.headers.set("Set-Cookie", setCookieHeader);
    }

    return baseResponse;
  } catch (error) {
    console.error("Error creating middleware response:", error);
    return baseResponse;
  }
}

// API route functions for session management
export async function createSession(
  userId: string,
  accessToken: string,
  refreshToken: string
): Promise<Response> {
  // Create a new response
  const res = new Response(null, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  try {
    // Get the session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    // Update the session
    session.userId = userId;
    session.isLoggedIn = true;
    session.accessToken = accessToken;
    session.refreshToken = refreshToken;

    // The session is automatically saved when it's modified
    return res;
  } catch (error) {
    console.error("Error creating session:", error);
    return new Response(JSON.stringify({ error: "Failed to create session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function getSession(): Promise<SessionData> {
  try {
    // Get the session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    // Initialize the session if it doesn't exist
    if (session.isLoggedIn === undefined) {
      session.isLoggedIn = false;
    }

    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    // Return a default session if there's an error
    return { isLoggedIn: false };
  }
}

export async function destroySession(): Promise<Response> {
  // Create a new response
  const res = new Response(null, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  try {
    // Get the session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    // Clear the session
    session.userId = undefined;
    session.isLoggedIn = false;
    session.accessToken = undefined;
    session.refreshToken = undefined;

    // The session is automatically saved when it's modified
    return res;
  } catch (error) {
    console.error("Error destroying session:", error);
    return new Response(
      JSON.stringify({ error: "Failed to destroy session" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Legacy client-side functions (keeping for compatibility)
export async function createClientSession(
  req: Request,
  userId: string,
  accessToken: string,
  refreshToken: string
): Promise<Response> {
  const res = new Response();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  session.userId = userId;
  session.isLoggedIn = true;
  session.accessToken = accessToken;
  session.refreshToken = refreshToken;

  return res;
}

export async function getClientSession(req: Request): Promise<SessionData> {
  const res = new Response();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (session.isLoggedIn === undefined) {
    session.isLoggedIn = false;
  }

  return session;
}

export async function destroyClientSession(req: Request): Promise<Response> {
  const res = new Response();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  session.userId = undefined;
  session.isLoggedIn = false;
  session.accessToken = undefined;
  session.refreshToken = undefined;

  return res;
}
