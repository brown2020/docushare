import { db, requireFirebaseAdmin } from "@/firebase/firebaseAdminConfig";
import { USER_COLLECTION } from "@/lib/constants";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

export class AiRateLimitError extends Error {
  readonly statusCode = 429;

  constructor() {
    super("Too many AI requests. Please try again in a minute.");
    this.name = "AiRateLimitError";
  }
}

export async function assertAiRateLimit(uid: string): Promise<void> {
  requireFirebaseAdmin();
  const ref = db
    .collection(USER_COLLECTION)
    .doc(uid)
    .collection("private")
    .doc("aiRate");

  await db.runTransaction(async (tx: {
    get: (ref: unknown) => Promise<{ data: () => Record<string, unknown> | undefined }>;
    set: (ref: unknown, data: unknown, options?: { merge?: boolean }) => void;
  }) => {
    const snap = await tx.get(ref);
    const data = snap.data() ?? {};
    const now = Date.now();
    const windowStart = typeof data.windowStart === "number" ? data.windowStart : 0;
    const count = typeof data.count === "number" ? data.count : 0;

    if (now - windowStart >= WINDOW_MS) {
      tx.set(ref, { windowStart: now, count: 1 });
      return;
    }

    if (count >= MAX_REQUESTS) {
      throw new AiRateLimitError();
    }

    tx.set(ref, { windowStart, count: count + 1 }, { merge: true });
  });
}
