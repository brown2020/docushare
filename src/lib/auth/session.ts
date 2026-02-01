import { admin } from "@/firebase/firebaseAdminConfig";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "__session";
const SESSION_EXPIRY_DAYS = 5;
const SESSION_EXPIRY_MS = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

/**
 * Create a session cookie from a Firebase ID token.
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  const sessionCookie = await admin
    .auth()
    .createSessionCookie(idToken, { expiresIn: SESSION_EXPIRY_MS });
  return sessionCookie;
}

/**
 * Verify a session cookie and return the decoded claims.
 */
export async function verifySessionCookie(sessionCookie: string) {
  try {
    const decodedClaims = await admin
      .auth()
      .verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch {
    return null;
  }
}

/**
 * Get the current session from cookies and verify it.
 * Returns the user ID if valid, null otherwise.
 */
export async function getAuthenticatedUser(): Promise<{
  uid: string;
  email?: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    const decodedClaims = await verifySessionCookie(sessionCookie);
    if (!decodedClaims) {
      return null;
    }

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
    };
  } catch {
    return null;
  }
}

/**
 * Session cookie configuration for setting cookies.
 */
export const sessionCookieOptions = {
  name: SESSION_COOKIE_NAME,
  maxAge: SESSION_EXPIRY_MS / 1000, // In seconds for cookies
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
