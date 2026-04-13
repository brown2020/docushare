export const DOCUMENT_COLLECTION = "docs";
export const USER_COLLECTION = "users";

export const MAX_OUTPUT_TOKEN = 100;
export const COST_POINT_PER_TOKEN = 0.1;

export const AI_MODEL_GPT = "gpt-4o";
export const AI_MODEL_GEMINI = "gemini-1.5-pro";
export const AI_MODEL_MISTRAL = "mistral-large";
export const AI_MODEL_CLAUDE = "claude-3-5-sonnet";
export const AI_MODEL_LLAMA = "llama-v3p1-405b";

export const AI_MODELS_LIST = [
  AI_MODEL_GEMINI,
  AI_MODEL_GPT,
  AI_MODEL_MISTRAL,
  AI_MODEL_CLAUDE,
  AI_MODEL_LLAMA
];

export const DEFAULT_AI_MODEL = AI_MODEL_GPT;

export const RESPONSE_CODE = {
  api_key_not_found: "api_key_not_found",
  api_key_not_set: "api_key_not_set",
  insufficient_points: "insufficient_points"
}

export const userColors = ['#fb7185', '#fdba74', '#d9f99d', '#a7f3d0', '#a5f3fc', '#a5b4fc', '#f0abfc']

export const themeColors = ['#fb7185', '#fdba74', '#d9f99d', '#a7f3d0', '#a5f3fc', '#a5b4fc']
