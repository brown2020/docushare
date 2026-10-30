import { USER_COLLECTION } from "@/lib/constants";

/** Subcollection and document the profile page reads. */
export const PROFILE_COLLECTION = "profile";
export const PROFILE_DOC_ID = "userData";
export const CREDITS_FIELD = "credits";

/**
 * Firestore path for the profile document. The profile page and the AI
 * charge must use this exact document.
 */
export function userProfileDocPath(uid: string): string {
  return `${USER_COLLECTION}/${uid}/${PROFILE_COLLECTION}/${PROFILE_DOC_ID}`;
}

/**
 * Firebase Auth uid, the same id the profile uses (`user.uid` / token `sub`).
 * `uid` is filled in by Admin from `sub`; `user_id` is the same claim.
 */
export function firebaseAuthUid(
  claims: { uid?: unknown; sub?: unknown; user_id?: unknown } | null | undefined
): string | null {
  if (!claims) return null;
  for (const candidate of [claims.sub, claims.uid, claims.user_id]) {
    if (typeof candidate !== "string") continue;
    const uid = candidate.trim();
    if (uid.length > 0 && uid.length <= 128 && !uid.includes("/")) return uid;
  }
  return null;
}

function coerceCredits(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return Number.NaN;
    return Number(trimmed);
  }
  if (value && typeof value === "object") {
    const record = value as { value?: unknown; toNumber?: () => unknown };
    if (typeof record.toNumber === "function") {
      const n = record.toNumber();
      if (typeof n === "number" || typeof n === "bigint" || typeof n === "string") {
        return coerceCredits(n);
      }
    }
    if ("value" in record) {
      const inner = record.value;
      if (
        inner !== value &&
        (typeof inner === "number" || typeof inner === "bigint" || typeof inner === "string")
      ) {
        return coerceCredits(inner);
      }
    }
    const boxed = value.valueOf();
    if (
      boxed !== value &&
      (typeof boxed === "number" || typeof boxed === "bigint" || typeof boxed === "string")
    ) {
      return coerceCredits(boxed);
    }
  }
  return Number.NaN;
}

/**
 * The integer rendered as "Credits Available".
 * Matches `Math.round` on the profile page.
 */
export function displayedCredits(value: unknown): number {
  const n = coerceCredits(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

/**
 * Profile credit line. Null until a read has applied the balance, so the
 * default of 0 is not shown as "Credits Available: 0".
 */
export function creditsAvailableLabel(loaded: boolean, credits: number): string | null {
  if (!loaded) return null;
  const shown = Number.isFinite(credits) ? Math.round(credits) : 0;
  return `Credits Available: ${shown}`;
}

type CreditSnapshot = {
  get?: (field: string) => unknown;
  data?: () => Record<string, unknown> | undefined | null;
};

/** The `credits` field on the profile document, via get() or data(). */
export function readCreditField(snapshot: CreditSnapshot): unknown {
  if (typeof snapshot.get === "function") {
    const direct = snapshot.get(CREDITS_FIELD);
    if (direct !== undefined) return direct;
  }
  const data = snapshot.data?.();
  if (data && typeof data === "object" && CREDITS_FIELD in data) {
    return data[CREDITS_FIELD];
  }
  return undefined;
}

export type CreditSettlement =
  | { ok: true; balance: number; next: number }
  | { ok: false; balance: number };

/**
 * Compare `amount` to the balance the profile displays.
 * When `deduct` is set, `next` is that balance minus the charge.
 */
export function settleCreditCharge(
  rawBalance: unknown,
  amount: number,
  deduct: boolean
): CreditSettlement {
  const balance = displayedCredits(rawBalance);
  const affordable =
    Number.isFinite(balance) &&
    Number.isFinite(amount) &&
    amount > 0 &&
    balance >= amount;
  if (!affordable) return { ok: false, balance };
  return { ok: true, balance, next: deduct ? balance - amount : balance };
}
