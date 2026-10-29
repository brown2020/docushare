import { db, requireFirebaseAdmin } from "@/firebase/firebaseAdminConfig";
import { STARTER_CREDITS } from "@/lib/billing";
import {
  displayedCredits,
  readCreditField,
  userProfileDocPath,
} from "@/lib/billing/creditBalance";
import { USER_COLLECTION } from "@/lib/constants";

export type StarterGrantInput = {
  alreadyGranted: boolean;
  credits: number;
  hasPayment: boolean;
};

export type StarterGrantDecision = {
  /** Credits to add. Zero when the account should not receive a starter balance. */
  grant: number;
  markGranted: boolean;
};

/**
 * New accounts with no balance and no purchase receive STARTER_CREDITS once.
 * An existing balance or a recorded payment means the starter grant was already
 * consumed or never applied, so it is marked done without adding credits.
 */
export function decideStarterGrant(input: StarterGrantInput): StarterGrantDecision {
  if (input.alreadyGranted) {
    return { grant: 0, markGranted: true };
  }
  if (input.hasPayment || input.credits > 0) {
    return { grant: 0, markGranted: true };
  }
  return { grant: STARTER_CREDITS, markGranted: true };
}

function profileRef(uid: string) {
  return db.doc(userProfileDocPath(uid));
}

function markerRef(uid: string) {
  return db
    .collection(USER_COLLECTION)
    .doc(uid)
    .collection("private")
    .doc("starterCredits");
}

type TxSnap = {
  exists?: boolean;
  empty?: boolean;
  docs?: unknown[];
  data: () => Record<string, unknown> | undefined;
};

type Tx = {
  get: (ref: unknown) => Promise<TxSnap>;
  set: (ref: unknown, data: unknown, options?: { merge?: boolean }) => void;
};

export async function ensureStarterCredits(uid: string): Promise<number> {
  requireFirebaseAdmin();
  const profile = profileRef(uid);
  const marker = markerRef(uid);
  const payments = db
    .collection(USER_COLLECTION)
    .doc(uid)
    .collection("payments")
    .limit(1);

  return db.runTransaction(async (tx: Tx) => {
    const [profileSnap, markerSnap, paymentSnap] = await Promise.all([
      tx.get(profile),
      tx.get(marker),
      tx.get(payments),
    ]);
    const credits = displayedCredits(readCreditField(profileSnap));
    const hasPayment = Array.isArray(paymentSnap.docs)
      ? paymentSnap.docs.length > 0
      : paymentSnap.empty === false;
    const decision = decideStarterGrant({
      alreadyGranted: markerSnap.exists === true,
      credits,
      hasPayment,
    });
    const next = credits + decision.grant;
    if (decision.grant > 0) {
      tx.set(profile, { credits: next }, { merge: true });
    }
    if (decision.markGranted && markerSnap.exists !== true) {
      tx.set(marker, { granted: true, amount: decision.grant });
    }
    return next;
  });
}
