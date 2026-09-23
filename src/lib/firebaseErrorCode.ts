/**
 * Extract Firebase / Firestore error codes for toast + console.warn.
 * Prefer the code string — never console.error(Error) (Next overlays it).
 */

export function getFirebaseErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim() ? code : null;
}

/** Safe one-line for console.warn / logs. */
export function formatFirebaseErrorForLog(error: unknown): string {
  const code = getFirebaseErrorCode(error);
  if (code) return code;
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "unknown";
}

/** User-facing toast that always includes the Firebase code when present. */
export function formatFirebaseErrorForToast(
  error: unknown,
  fallback: string
): string {
  const code = getFirebaseErrorCode(error);
  if (code) return `${fallback} (${code})`;
  if (error instanceof Error && error.message.trim()) {
    const match = error.message.match(/\(([\w.-]+\/[\w.-]+)\)/);
    if (match) return `${fallback} (${match[1]})`;
  }
  return fallback;
}
