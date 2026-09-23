import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/firebase/firebaseClient";
import { clearServerSession } from "@/lib/auth/sessionClient";
import { useAuthStore } from "@/zustand/useAuthStore";

const FIREBASE_SIGN_OUT_TIMEOUT_MS = 3_000;
const SESSION_COOKIE_NAME = "__session";
const AUTH_STORAGE_KEYS = ["emailForSignIn"] as const;

function isAuthStorageKey(key: string): boolean {
  if ((AUTH_STORAGE_KEYS as readonly string[]).includes(key)) return true;
  if (key.startsWith("firebase:")) return true;
  if (key.startsWith("firebaseLocalStorage")) return true;
  if (key.startsWith("firebaseui:")) return true;
  if (
    key.toLowerCase().includes("docushare") &&
    key.toLowerCase().includes("session")
  ) {
    return true;
  }
  return false;
}

function clearDocumentCookies(): void {
  if (typeof document === "undefined") return;

  const names = new Set<string>([SESSION_COOKIE_NAME]);
  try {
    for (const part of document.cookie.split(";")) {
      const name = part.split("=")[0]?.trim();
      if (name) names.add(name);
    }
  } catch {
    // ignore
  }

  const expire = "Thu, 01 Jan 1970 00:00:00 GMT";
  const host =
    typeof window !== "undefined" ? window.location.hostname : "";
  const domains = ["", host ? `domain=${host}` : "", host ? `domain=.${host}` : ""];

  for (const name of names) {
    // Best-effort: httpOnly cookies (e.g. __session) cannot be cleared here;
    // DELETE /api/auth/session handles those.
    for (const domain of domains) {
      const domainPart = domain ? `; ${domain}` : "";
      try {
        document.cookie = `${name}=; expires=${expire}; path=/${domainPart}`;
        document.cookie = `${name}=; Max-Age=0; path=/${domainPart}`;
      } catch {
        // ignore
      }
    }
  }
}

function clearAuthWebStorage(): void {
  if (typeof window === "undefined") return;

  for (const storageName of ["localStorage", "sessionStorage"] as const) {
    try {
      const storage = window[storageName];
      if (storageName === "sessionStorage") {
        storage.clear();
        continue;
      }
      const toRemove: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key && isAuthStorageKey(key)) toRemove.push(key);
      }
      toRemove.forEach((key) => storage.removeItem(key));
    } catch {
      // Storage may be unavailable.
    }
  }
}

async function firebaseSignOutBestEffort(): Promise<void> {
  if (!auth || typeof auth.signOut !== "function") return;

  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    await Promise.race([
      firebaseSignOut(auth),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Firebase sign-out timed out")),
          FIREBASE_SIGN_OUT_TIMEOUT_MS
        );
      }),
    ]);
  } catch {
    // Soft-catch: still clear cookies/storage and hard-navigate.
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Hard sign-out: Firebase signOut + DELETE session cookie + clear client
 * storage/cookies, then force a full navigation (no soft router push).
 */
export async function hardSignOut(
  redirectTo: string = "/signin"
): Promise<void> {
  // 1) Firebase client sign-out
  await firebaseSignOutBestEffort();

  // 2) Best-effort DELETE /api/auth/session (soft-catches Failed to fetch)
  try {
    await clearServerSession();
  } catch {
    // ignore
  }

  // 3) Client cookie + storage cleanup
  clearDocumentCookies();
  clearAuthWebStorage();

  try {
    useAuthStore.getState().clearAuthDetails();
  } catch {
    // ignore
  }

  // 4) Hard navigation with cache bypass (not router.push)
  if (typeof window !== "undefined") {
    const url = new URL(redirectTo, window.location.origin);
    url.searchParams.set("_", String(Date.now()));
    window.location.replace(url.toString());
  }
}
