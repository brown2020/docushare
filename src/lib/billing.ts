/** Fixed catalog price. $99.99 in cents (Stripe minimum unit), not `99.99 * 100`. */
export const CREDIT_PACK_PRICE_CENTS = 9999;

export const CREDIT_PACK_AMOUNT_USD = 99.99;

/** Credits granted for one successful pack purchase. */
export const CREDIT_PACK_CREDITS = 10_000;

export const CREDIT_PACK_PURPOSE = "credit_pack";

export function isCreditPackPayment(amount: number, currency: string): boolean {
  return (
    amount === CREDIT_PACK_PRICE_CENTS && currency.toLowerCase() === "usd"
  );
}
