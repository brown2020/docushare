export const PAYMENTS_UNAVAILABLE_MESSAGE =
  "Payments are not configured for this environment.";

export function isCheckoutConfigured(input: {
  publishableKey?: string | null;
  secretKey?: string | null;
  webhookSecret?: string | null;
  productName?: string | null;
  adminReady: boolean;
}): boolean {
  return Boolean(
    input.publishableKey &&
      input.secretKey &&
      input.webhookSecret &&
      input.productName &&
      input.adminReady
  );
}
