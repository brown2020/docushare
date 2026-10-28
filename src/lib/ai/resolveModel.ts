import {
  AI_MODEL_CLAUDE,
  AI_MODEL_GEMINI,
  AI_MODEL_GPT,
  AI_MODEL_LLAMA,
  AI_MODEL_MISTRAL,
  AI_MODELS_LIST,
  DEFAULT_AI_MODEL,
  RESPONSE_CODE,
} from "@/lib/constants";
import { API_KEY_FIELDS, type ApiKeyField } from "@/lib/ai/apiKeyFields";

export type KeyBag = Partial<Record<ApiKeyField | "ai_model", unknown>>;

const MODEL_TO_FIELD: Record<string, ApiKeyField> = {
  [AI_MODEL_GPT]: "openai_api_key",
  [AI_MODEL_CLAUDE]: "anthropic_api_key",
  [AI_MODEL_GEMINI]: "google_gen_ai_api_key",
  [AI_MODEL_MISTRAL]: "mistral_api_key",
  [AI_MODEL_LLAMA]: "fireworks_api_key",
};

function keyFor(data: KeyBag, field: ApiKeyField): string {
  const value = data[field];
  return typeof value === "string" ? value.trim() : "";
}

export type ModelSelection =
  | { status: true; model: string; key: string }
  | { status: false; code: string };

/** Pick the user's selected model when its key is present. */
export function resolveModelSelection(data: KeyBag | undefined): ModelSelection {
  const bag = data ?? {};
  const available = API_KEY_FIELDS.flatMap((field) => {
    const model = Object.entries(MODEL_TO_FIELD).find(([, f]) => f === field)?.[0];
    if (!model || !keyFor(bag, field)) return [];
    return [model];
  });

  if (available.length === 0) {
    return { status: false, code: RESPONSE_CODE.api_key_not_set };
  }

  const selected = bag.ai_model;
  if (typeof selected === "string" && AI_MODELS_LIST.includes(selected)) {
    if (!available.includes(selected)) {
      return { status: false, code: RESPONSE_CODE.api_key_not_found };
    }
    const field = MODEL_TO_FIELD[selected];
    return { status: true, model: selected, key: keyFor(bag, field) };
  }

  if (available.includes(DEFAULT_AI_MODEL)) {
    const field = MODEL_TO_FIELD[DEFAULT_AI_MODEL];
    return {
      status: true,
      model: DEFAULT_AI_MODEL,
      key: keyFor(bag, field),
    };
  }

  const first = available[0];
  const field = MODEL_TO_FIELD[first];
  return { status: true, model: first, key: keyFor(bag, field) };
}
