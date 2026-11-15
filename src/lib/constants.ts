export const DOCUMENT_COLLECTION = "docs";
export const USER_COLLECTION = "users";

export const MAX_OUTPUT_TOKEN = 100;
export const COST_POINT_PER_TOKEN = 0.1;

export const AI_MODEL_GPT = "gpt-6.1-sol";
export const AI_MODEL_CLAUDE = "claude-opus-5-5";
export const AI_MODEL_GEMINI = "gemini-4-argon";
export const AI_MODEL_GROK = "grok-4.7";

export const AI_MODELS_LIST = [
  AI_MODEL_GPT,
  AI_MODEL_CLAUDE,
  AI_MODEL_GEMINI,
  AI_MODEL_GROK,
] as const;

export type AiModelId = (typeof AI_MODELS_LIST)[number];

export function isAiModelId(value: unknown): value is AiModelId {
  return typeof value === "string" && (AI_MODELS_LIST as readonly string[]).includes(value);
}

export const DEFAULT_AI_MODEL: AiModelId = AI_MODEL_GPT;

export const RESPONSE_CODE = {
  api_key_not_found: "api_key_not_found",
  api_key_not_set: "api_key_not_set",
  insufficient_points: "insufficient_points",
  ai_timeout: "ai_timeout",
}

export const userColors = ['#fb7185', '#fdba74', '#d9f99d', '#a7f3d0', '#a5f3fc', '#a5b4fc', '#f0abfc']

export const themeColors = ['#fb7185', '#fdba74', '#d9f99d', '#a7f3d0', '#a5f3fc', '#a5b4fc']
