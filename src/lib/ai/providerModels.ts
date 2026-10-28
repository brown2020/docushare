import {
  AI_MODEL_CLAUDE,
  AI_MODEL_GEMINI,
  AI_MODEL_GPT,
  AI_MODEL_LLAMA,
  AI_MODEL_MISTRAL,
} from "@/lib/constants";

/**
 * Provider model ids. Internal preference keys stay stable; only retired
 * provider ids are replaced.
 */
export const PROVIDER_MODEL_IDS: Record<string, string> = {
  [AI_MODEL_GPT]: "gpt-4o",
  [AI_MODEL_GEMINI]: "gemini-2.5-pro",
  [AI_MODEL_MISTRAL]: "mistral-large-latest",
  [AI_MODEL_CLAUDE]: "claude-sonnet-5-5",
  [AI_MODEL_LLAMA]: "accounts/fireworks/models/llama-v3p1-405b-instruct",
};

export const RETIRED_PROVIDER_MODEL_IDS = [
  "models/gemini-1.5-pro-latest",
  "gemini-1.5-pro-latest",
  "claude-3-5-sonnet-20241022",
] as const;
