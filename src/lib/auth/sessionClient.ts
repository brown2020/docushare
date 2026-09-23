const SESSION_TIMEOUT_MS = 12_000;

export type CreateSessionResult = {
  ok: boolean;
  error?: string;
};

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

/**
 * Exchange a Firebase ID token for an httpOnly session cookie.
 * Always settles within SESSION_TIMEOUT_MS so callers never hang forever.
 */
export async function createServerSession(
  idToken: string
): Promise<CreateSessionResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SESSION_TIMEOUT_MS);

  try {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let message =
        "Failed to create session. Check Firebase Admin / project env in local .env.";
      try {
        const data = (await response.json()) as { error?: unknown };
        if (typeof data?.error === "string" && data.error.trim()) {
          message = data.error;
        }
      } catch {
        // ignore JSON parse errors; keep default message
      }
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch (err) {
    if (isAbortError(err)) {
      return {
        ok: false,
        error:
          "Session setup timed out. /api/auth/session did not respond in time — check Firebase Admin credentials or NEXT_PUBLIC_FIREBASE_PROJECTID in your Mac .env.",
      };
    }
    return {
      ok: false,
      error:
        "Session setup failed. Check network and Firebase configuration in your local .env.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function clearServerSession(): Promise<void> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SESSION_TIMEOUT_MS);
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Best-effort clear; sign-out should still proceed locally.
  }
}
