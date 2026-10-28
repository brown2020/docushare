import { FieldValue } from "firebase-admin/firestore";
import { db, requireFirebaseAdmin } from "@/firebase/firebaseAdminConfig";
import { CREDIT_PACK_CREDITS } from "@/lib/billing";
import { USER_COLLECTION } from "@/lib/constants";

export class InsufficientCreditsError extends Error {
  readonly code = "insufficient_points";

  constructor() {
    super("You don't have enough points to run this command.");
    this.name = "InsufficientCreditsError";
  }
}

function profileRef(uid: string) {
  return db.collection(USER_COLLECTION).doc(uid).collection("profile").doc("userData");
}

function readCredits(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function readCreditsBalance(uid: string): Promise<number> {
  requireFirebaseAdmin();
  const snap = await profileRef(uid).get();
  return readCredits(snap.data()?.credits);
}

/** Subtract credits inside a transaction. Refund with a negative amount is not allowed. */
export async function debitCredits(uid: string, amount: number): Promise<void> {
  requireFirebaseAdmin();
  if (!Number.isFinite(amount) || amount <= 0) return;

  await db.runTransaction(async (tx: {
    get: (ref: unknown) => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
    set: (ref: unknown, data: unknown, options?: { merge?: boolean }) => void;
  }) => {
    const ref = profileRef(uid);
    const snap = await tx.get(ref);
    const credits = readCredits(snap.data()?.credits);
    if (credits < amount) {
      throw new InsufficientCreditsError();
    }
    tx.set(ref, { credits: credits - amount }, { merge: true });
  });
}

export async function refundCredits(uid: string, amount: number): Promise<void> {
  requireFirebaseAdmin();
  if (!Number.isFinite(amount) || amount <= 0) return;

  await db.runTransaction(async (tx: {
    get: (ref: unknown) => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
    set: (ref: unknown, data: unknown, options?: { merge?: boolean }) => void;
  }) => {
    const ref = profileRef(uid);
    const snap = await tx.get(ref);
    const credits = readCredits(snap.data()?.credits);
    tx.set(ref, { credits: credits + amount }, { merge: true });
  });
}

export async function grantCreditPack(
  uid: string,
  payment: { id: string; amount: number; created: number }
): Promise<void> {
  requireFirebaseAdmin();
  const payRef = db
    .collection(USER_COLLECTION)
    .doc(uid)
    .collection("payments")
    .doc(payment.id);
  const userProfile = profileRef(uid);

  await db.runTransaction(async (tx: {
    get: (ref: unknown) => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
    set: (ref: unknown, data: unknown, options?: { merge?: boolean }) => void;
  }) => {
    const existing = await tx.get(payRef);
    if (existing.exists) return;

    const profile = await tx.get(userProfile);
    const credits = readCredits(profile.data()?.credits);
    tx.set(userProfile, { credits: credits + CREDIT_PACK_CREDITS }, { merge: true });
    tx.set(payRef, {
      id: payment.id,
      amount: payment.amount,
      status: "succeeded",
      createdAt: FieldValue.serverTimestamp(),
      stripeCreated: payment.created,
    });
  });
}
