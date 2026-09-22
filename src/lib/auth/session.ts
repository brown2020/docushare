import { admin } from "@/firebase/firebaseAdminConfig";
import { cookies } from "next/headers";
import { verifyFirebaseIdToken } from "@/lib/auth/verifyFirebaseIdToken";

const SESSION_COOKIE_NAME = "__session";
const SESSION_EXPIRY_DAYS = 5;
const SESSION_EXPIRY_MS = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
const ID_TOKEN_PREFIX = "idt.";

function adminAuthAvailable(): boolean {
  try {
    return Boolean(admin?.apps?.length);
  } catch {
    return false;
  }
}

/**
 * Create a session cookie from a Firebase ID token.
 * Prefers Admin session cookies; falls back to a verified ID-token cookie
 * when Admin credentials are not configured (local/dev).
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  if (adminAuthAvailable()) {
    try {
      return await admin
        .auth()
        .createSessionCookie(idToken, { expiresIn: SESSION_EXPIRY_MS });
    } catch {
      // fall through to ID-token session
    }
  }

  const verified = await verifyFirebaseIdToken(idToken);
  if (!verified) {
    throw new Error("Invalid ID token");
  }
  return `${ID_TOKEN_PREFIX}${idToken}`;
}

/**
 * Verify a session cookie and return the decoded claims.
 */
export async function verifySessionCookie(sessionCookie: string) {
  if (sessionCookie.startsWith(ID_TOKEN_PREFIX)) {
    const idToken = sessionCookie.slice(ID_TOKEN_PREFIX.length);
    const verified = await verifyFirebaseIdToken(idToken);
    if (!verified) return null;
    return { uid: verified.uid, email: verified.email };
  }

  if (adminAuthAvailable()) {
    try {
      return await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch {
      return null;
    }
  }

  // Last resort: treat raw value as ID token
  const verified = await verifyFirebaseIdToken(sessionCookie);
  if (!verified) return null;
  return { uid: verified.uid, email: verified.email };
}

/**
 * Get the current session from cookies and verify it.
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
      email: decodedClaims.email as string | undefined,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  name: SESSION_COOKIE_NAME,
  maxAge: SESSION_EXPIRY_MS / 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
