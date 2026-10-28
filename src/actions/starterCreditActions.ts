"use server";

import { isFirebaseAdminReady } from "@/firebase/firebaseAdminConfig";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { ensureStarterCredits } from "@/lib/billing/starterCredits";

/** Grant the one-time starter balance. Returns null when Admin is unavailable. */
export async function claimStarterCredits(): Promise<{ credits: number } | null> {
  const authUser = await getAuthenticatedUser();
  if (!authUser || !isFirebaseAdminReady()) return null;

  try {
    const credits = await ensureStarterCredits(authUser.uid);
    return { credits };
  } catch (error) {
    console.warn(
      "[credits] starter_grant_failed",
      error instanceof Error ? error.message : "unknown"
    );
    return null;
  }
}
