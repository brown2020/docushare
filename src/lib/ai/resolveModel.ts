import {
  AI_MODELS_LIST,
  DEFAULT_AI_MODEL,
  RESPONSE_CODE,
  type AiModelId,
} from "@/lib/constants";
import type { ApiKeyField } from "@/lib/ai/apiKeyFields";
import { CHAT_MODELS, resolveChatModelId } from "@/lib/ai/providerModels";

export type KeyBag = Partial<Record<ApiKeyField | "ai_model", unknown>>;

function keyFor(data: KeyBag, field: ApiKeyField): string {
  const value = data[field];
  return typeof value === "string" ? value.trim() : "";
}

export type ModelSelection =
  | { status: true; model: AiModelId; key: string }
  | { status: false; code: string; model: AiModelId };

function selection(bag: KeyBag, model: AiModelId): ModelSelection {
  return { status: true, model, key: keyFor(bag, CHAT_MODELS[model].keyField) };
}

/**
 * Pick the user's selected model when its key is present. Legacy stored ids
 * resolve to the same provider's current flagship.
 */
export function resolveModelSelection(data: KeyBag | undefined): ModelSelection {
  const bag = data ?? {};
  const available = AI_MODELS_LIST.filter((model) =>
    Boolean(keyFor(bag, CHAT_MODELS[model].keyField))
  );
  const selected = resolveChatModelId(bag.ai_model);

  if (available.length === 0) {
    return {
      status: false,
      code: RESPONSE_CODE.api_key_not_set,
      model: selected ?? DEFAULT_AI_MODEL,
    };
  }

  if (selected) {
    if (!available.includes(selected)) {
      return { status: false, code: RESPONSE_CODE.api_key_not_found, model: selected };
    }
    return selection(bag, selected);
  }

  if (available.includes(DEFAULT_AI_MODEL)) {
    return selection(bag, DEFAULT_AI_MODEL);
  }
  return selection(bag, available[0]);
}
