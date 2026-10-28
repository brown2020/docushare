/** Sizes offered by the editor toolbar. Empty string clears the size. */
export const ALLOWED_FONT_SIZES = ["", "12px", "14px", "18px", "24px"] as const;

const ALLOWED = new Set<string>(ALLOWED_FONT_SIZES);

export function isAllowedFontSize(value: unknown): value is string {
  return typeof value === "string" && ALLOWED.has(value);
}
