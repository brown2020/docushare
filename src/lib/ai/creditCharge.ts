import {
  applyCreditCharge,
  canAffordCredits,
  InsufficientCreditsError,
} from "@/lib/billing/credits";
import { COST_POINT_PER_TOKEN, MAX_OUTPUT_TOKEN } from "@/lib/constants";
import { OUT_OF_CREDITS_MESSAGE } from "@/lib/ai/userMessages";

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Token estimate times the credit rate. Zero when there is nothing to bill. */
export function chargeForWords(words: number): number {
  if (!Number.isFinite(words) || words <= 0) return 0;
  const raw = words * COST_POINT_PER_TOKEN;
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

/** Estimated platform charge for one AI command. Always at least 1. */
export function estimateAiCharge(prompt: string): number {
  const raw = chargeForWords(wordCount(prompt) + MAX_OUTPUT_TOKEN);
  return raw > 0 ? Math.max(1, raw) : 1;
}

export function isUatAi(): boolean {
  return process.env.IS_UAT == "1";
}

export type AiSpend =
  | { ok: true; charged: number }
  | { ok: false; message: string; amount: number; detail?: Record<string, unknown> };

/**
 * Atomically require a positive balance before any AI result.
 * Live calls deduct the estimate in that same transaction.
 * UAT still rejects a zero balance, then returns without deducting.
 */
export async function authorizeAiSpend(uid: string, prompt: string): Promise<AiSpend> {
  const amount = estimateAiCharge(prompt);
  if (!canAffordCredits(Number.POSITIVE_INFINITY, amount)) {
    return { ok: false, message: OUT_OF_CREDITS_MESSAGE, amount, detail: { stage: "amount" } };
  }
  try {
    const deduct = !isUatAi();
    await applyCreditCharge(uid, amount, deduct);
    return { ok: true, charged: deduct ? amount : 0 };
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return { ok: false, message: OUT_OF_CREDITS_MESSAGE, amount, detail: error.detail };
    }
    throw error;
  }
}
