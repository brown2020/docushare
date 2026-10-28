export const API_KEY_FIELDS = [
  "openai_api_key",
  "anthropic_api_key",
  "google_gen_ai_api_key",
  "mistral_api_key",
  "fireworks_api_key",
] as const;

export type ApiKeyField = (typeof API_KEY_FIELDS)[number];

export const API_KEY_MAX_LENGTH = 400;

export function isApiKeyField(value: string): value is ApiKeyField {
  return (API_KEY_FIELDS as readonly string[]).includes(value);
}

export function sanitizeApiKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > API_KEY_MAX_LENGTH) return null;
  if (/[\r\n\0]/.test(trimmed)) return null;
  return trimmed;
}
