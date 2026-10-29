import { FieldValue } from "firebase-admin/firestore";
import { db, requireFirebaseAdmin } from "@/firebase/firebaseAdminConfig";
import { CREDIT_PACK_CREDITS } from "@/lib/billing";
import {
  displayedCredits,
  readCreditField,
  settleCreditCharge,
  userProfileDocPath,
} from "@/lib/billing/creditBalance";
import { USER_COLLECTION } from "@/lib/constants";

export class InsufficientCreditsError extends Error {
  readonly code = "insufficient_points";

  constructor() {
    super("You don't have enough points to run this command.");
    this.name = "InsufficientCreditsError";
  }
}

function profileRef(uid: string) {
  return db.doc(userProfileDocPath(uid));
}

/** A zero or missing balance cannot pay a positive charge. */
export function canAffordCredits(balance: number, amount: number): boolean {
  return (
    Number.isFinite(balance) &&
    Number.isFinite(amount) &&
    amount > 0 &&
    balance >= amount
  );
}

type CreditTx = {
  get: (ref: unknown) => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
  set: (ref: unknown, data: unknown, options?: { merge?: boolean }) => void;
};

/**
 * Read the balance and, when `deduct` is set, subtract `amount` in the same
 * transaction. A balance of 0 (or anything below `amount`) throws.
 */
export async function applyCreditCharge(
  uid: string,
  amount: number,
  deduct: boolean
): Promise<number> {
  requireFirebaseAdmin();
  if (!canAffordCredits(Number.POSITIVE_INFINITY, amount)) {
    throw new InsufficientCreditsError();
  }

  return db.runTransaction(async (tx: CreditTx) => {
    const ref = profileRef(uid);
    const snap = await tx.get(ref);
    const settled = settleCreditCharge(readCreditField(snap), amount, deduct);
    if (!settled.ok) {
      throw new InsufficientCreditsError();
    }
    if (deduct) {
      tx.set(ref, { credits: settled.next }, { merge: true });
    }
    return settled.next;
  });
}

export async function readCreditsBalance(uid: string): Promise<number> {
  requireFirebaseAdmin();
  const snap = await profileRef(uid).get();
  return displayedCredits(readCreditField(snap));
}

/** Subtract credits inside a transaction. A non-positive amount is ignored. */
export async function debitCredits(uid: string, amount: number): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) return;
  await applyCreditCharge(uid, amount, true);
}

export async function refundCredits(uid: string, amount: number): Promise<void> {
  requireFirebaseAdmin();
  if (!Number.isFinite(amount) || amount <= 0) return;

  await db.runTransaction(async (tx: CreditTx) => {
    const ref = profileRef(uid);
    const snap = await tx.get(ref);
    const credits = displayedCredits(readCreditField(snap));
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

  await db.runTransaction(async (tx: CreditTx) => {
    const existing = await tx.get(payRef);
    if (existing.exists) return;

    const profile = await tx.get(userProfile);
    const credits = displayedCredits(readCreditField(profile));
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
