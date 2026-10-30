import { FieldValue } from "firebase-admin/firestore";
import { db, requireFirebaseAdmin } from "@/firebase/firebaseAdminConfig";
import { CREDIT_PACK_CREDITS } from "@/lib/billing";
import {
  CREDITS_FIELD,
  displayedCredits,
  readCreditField,
  settleCreditCharge,
  userProfileDocPath,
} from "@/lib/billing/creditBalance";
import { USER_COLLECTION } from "@/lib/constants";

export class InsufficientCreditsError extends Error {
  readonly code = "insufficient_points";
  readonly detail?: Record<string, unknown>;

  constructor(detail?: Record<string, unknown>) {
    super("You don't have enough points to run this command.");
    this.name = "InsufficientCreditsError";
    this.detail = detail;
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

type CreditSnap = {
  exists?: boolean;
  constructor?: { name?: string };
  get?: (field: string) => unknown;
  data?: () => Record<string, unknown> | undefined;
};

type CreditTx = {
  get: (ref: unknown) => Promise<CreditSnap>;
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
      let fromGet: unknown;
      try {
        fromGet = typeof snap.get === "function" ? snap.get("credits") : "no-get";
      } catch (error) {
        fromGet = error instanceof Error ? `throw:${error.message}` : "throw";
      }
      const data = typeof snap.data === "function" ? snap.data() : undefined;
      throw new InsufficientCreditsError({
        txExists: snap.exists === true,
        txExistsType: typeof snap.exists,
        txBalance: settled.balance,
        txGet: creditPreview(fromGet),
        txData: creditPreview(data && typeof data === "object" ? data.credits : undefined),
        txKeys: data && typeof data === "object" ? Object.keys(data).slice(0, 12) : [],
        snapName: snap.constructor?.name ?? typeof snap,
      });
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

function creditPreview(value: unknown): string {
  if (value === undefined) return "missing";
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "string") {
    return String(value).slice(0, 32);
  }
  const name = value instanceof Object ? value.constructor?.name || "object" : typeof value;
  const keys =
    value && typeof value === "object" ? Object.keys(value as object).slice(0, 6).join(",") : "";
  return keys ? `${name}:{${keys}}` : name;
}

/** What a direct profile read sees. Used to explain a rejected charge. */
export async function inspectCreditDocument(uid: string): Promise<{
  path: string;
  projectId: string;
  databaseId: string;
  exists: boolean;
  balance: number;
  getBalance: number;
  dataBalance: number;
  getPreview: string;
  dataPreview: string;
}> {
  requireFirebaseAdmin();
  const ref = profileRef(uid);
  const snap = await ref.get();
  let fromGet: unknown;
  if (typeof snap.get === "function") {
    try {
      fromGet = snap.get(CREDITS_FIELD);
    } catch (error) {
      fromGet = error instanceof Error ? `throw:${error.message}` : "throw";
    }
  }
  const data = snap.data?.();
  const fromData =
    data && typeof data === "object" && CREDITS_FIELD in data ? data[CREDITS_FIELD] : undefined;
  const firestore = ref.firestore as { projectId?: string; databaseId?: string } | undefined;
  return {
    path: typeof ref.path === "string" ? ref.path : userProfileDocPath(uid),
    projectId: firestore?.projectId ?? "",
    databaseId: firestore?.databaseId ?? "",
    exists: snap.exists === true,
    balance: displayedCredits(readCreditField(snap)),
    getBalance: displayedCredits(fromGet),
    dataBalance: displayedCredits(fromData),
    getPreview: creditPreview(fromGet),
    dataPreview: creditPreview(fromData),
  };
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
