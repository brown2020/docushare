import { NextRequest, NextResponse } from "next/server";
import {
  createSessionCookie,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/session
 * Create a session cookie from a Firebase ID token.
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    const sessionCookie = await createSessionCookie(idToken);

    const cookieStore = await cookies();
    cookieStore.set({
      ...sessionCookieOptions,
      value: sessionCookie,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Clear the session cookie (sign out).
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(sessionCookieOptions.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing session:", error);
    return NextResponse.json(
      { error: "Failed to clear session" },
      { status: 500 }
    );
  }
}
