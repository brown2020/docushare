import { NextRequest, NextResponse } from "next/server";
import {
  createSessionCookie,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { isTrustedSessionRequest } from "@/lib/auth/requestOrigin";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const GENERIC_CREATE_ERROR = "Failed to create session";
const GENERIC_CLEAR_ERROR = "Failed to clear session";

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST /api/auth/session
 * Create a session cookie from a Firebase ID token.
 */
export async function POST(request: NextRequest) {
  if (!isTrustedSessionRequest(request.headers, request.url)) {
    return forbidden();
  }

  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== "string") {
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
    const message = error instanceof Error ? error.message : GENERIC_CREATE_ERROR;
    console.warn("[auth/session] create failed:", message);
    return NextResponse.json({ error: GENERIC_CREATE_ERROR }, { status: 401 });
  }
}

/**
 * DELETE /api/auth/session
 * Clear the session cookie (sign out).
 */
export async function DELETE(request: NextRequest) {
  if (!isTrustedSessionRequest(request.headers, request.url)) {
    return forbidden();
  }

  try {
    const cookieStore = await cookies();
    cookieStore.delete(sessionCookieOptions.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : GENERIC_CLEAR_ERROR;
    console.warn("[auth/session] clear failed:", message);
    return NextResponse.json({ error: GENERIC_CLEAR_ERROR }, { status: 500 });
  }
}
