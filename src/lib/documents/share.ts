import { isDocumentId } from "@/lib/images";

const SHARE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Keep plus-addresses. Firebase stores the mailbox in lowercase. */
export function normalizeShareEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length === 0 || email.length > 320) return null;
  if (!SHARE_EMAIL.test(email)) return null;
  return email;
}

export type ShareWritePlan =
  | { ok: true; documentId: string; email: string; targetUid: string }
  | { ok: false; status: number; error: string };

/**
 * Decide whether a share may be written. Callers must persist only when
 * `ok` is true. Failure is never a 2xx success.
 */
export function planShareWrite(input: {
  callerUid: string;
  documentId: unknown;
  email: unknown;
  targetUid: string | null;
  documentExists: boolean;
  owner: unknown;
}): ShareWritePlan {
  if (typeof input.documentId !== "string" || !isDocumentId(input.documentId)) {
    return { ok: false, status: 400, error: "Document ID is required." };
  }

  const email = normalizeShareEmail(input.email);
  if (!email) {
    return { ok: false, status: 400, error: "Enter a valid email address." };
  }

  if (!input.targetUid) {
    return { ok: false, status: 404, error: "User not found." };
  }

  if (input.targetUid === input.callerUid) {
    return { ok: false, status: 400, error: "Cannot share with yourself." };
  }

  if (!input.documentExists) {
    return { ok: false, status: 404, error: "Document not found." };
  }

  if (input.owner !== input.callerUid) {
    return { ok: false, status: 403, error: "Only the document owner can share." };
  }

  return {
    ok: true,
    documentId: input.documentId,
    email,
    targetUid: input.targetUid,
  };
}

export type ShareClientResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Success only after the server reports the write. A 200 body of
 * `{ status: false, message }` is a failed share, not a success.
 */
export function readShareResult(httpOk: boolean, data: unknown): ShareClientResult {
  const record =
    data && typeof data === "object"
      ? (data as { status?: unknown; error?: unknown; message?: unknown })
      : {};
  const message =
    typeof record.error === "string" && record.error.trim()
      ? record.error
      : typeof record.message === "string" && record.message.trim()
        ? record.message
        : "Failed to share document.";

  if (!httpOk || record.status !== true) {
    return { ok: false, message };
  }

  return { ok: true };
}
