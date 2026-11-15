import type { JSONValue } from "ai";
import type { ApiKeyField } from "@/lib/ai/apiKeyFields";
import {
  AI_MODEL_CLAUDE,
  AI_MODEL_GEMINI,
  AI_MODEL_GPT,
  AI_MODEL_GROK,
  isAiModelId,
  type AiModelId,
} from "@/lib/constants";

export type ChatProvider = "openai" | "anthropic" | "google" | "xai";

export type CallSettingName =
  | "temperature"
  | "topP"
  | "topK"
  | "frequencyPenalty"
  | "presencePenalty"
  | "stopSequences"
  | "toolChoice";

export interface ChatModelSpec {
  id: AiModelId;
  label: string;
  provider: ChatProvider;
  /** Vercel AI Gateway id. Grok is published as `spacexai/`, with no `xai/` alias. */
  gatewayId: string;
  keyField: ApiKeyField;
  /** Call settings the provider API rejects for this model. */
  rejectedSettings: readonly CallSettingName[];
  providerOptions?: Readonly<Record<string, Readonly<Record<string, JSONValue>>>>;
}

export const CHAT_MODELS: Record<AiModelId, ChatModelSpec> = {
  [AI_MODEL_GPT]: {
    id: AI_MODEL_GPT,
    label: "OpenAI GPT-6.1 Sol",
    provider: "openai",
    gatewayId: "openai/gpt-6.1-sol",
    keyField: "openai_api_key",
    // Always reasoning (effort low..max, no `none`), so sampling is unsupported;
    // the Responses API has no penalty parameters.
    rejectedSettings: ["temperature", "topP", "frequencyPenalty", "presencePenalty"],
  },
  [AI_MODEL_CLAUDE]: {
    id: AI_MODEL_CLAUDE,
    label: "Anthropic Claude Opus 5.5",
    provider: "anthropic",
    gatewayId: "anthropic/claude-opus-5.5",
    keyField: "anthropic_api_key",
    // Adaptive thinking is always on.
    rejectedSettings: ["temperature", "topP", "topK", "toolChoice"],
  },
  [AI_MODEL_GEMINI]: {
    id: AI_MODEL_GEMINI,
    label: "Google Gemini 4 Argon",
    provider: "google",
    gatewayId: "google/gemini-4-argon",
    keyField: "google_gen_ai_api_key",
    rejectedSettings: [],
  },
  [AI_MODEL_GROK]: {
    id: AI_MODEL_GROK,
    label: "xAI Grok 4.7",
    provider: "xai",
    gatewayId: "spacexai/grok-4.7",
    keyField: "xai_api_key",
    rejectedSettings: ["presencePenalty", "frequencyPenalty", "stopSequences"],
    // Grok defaults to high effort, which can outlast the route's time limit.
    providerOptions: { xai: { reasoningEffort: "low" } },
  },
};

/** Ids this app used to send or store before the current four models. */
export const RETIRED_PROVIDER_MODEL_IDS = [
  "gpt-4o",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "models/gemini-1.5-pro-latest",
  "gemini-2.5-pro",
  "claude-3-5-sonnet",
  "claude-3-5-sonnet-20241022",
  "claude-sonnet-5-5",
  "mistral-large",
  "mistral-large-latest",
  "llama-v3p1-405b",
  "accounts/fireworks/models/llama-v3p1-405b-instruct",
  "grok-beta",
] as const;

/** Stored ids whose provider is gone. They resolve to nothing, not to another vendor. */
export const REMOVED_PROVIDER_MODEL_IDS = [
  "mistral-large",
  "mistral-large-latest",
  "llama-v3p1-405b",
  "accounts/fireworks/models/llama-v3p1-405b-instruct",
] as const;

/** Exact successors for ids previously persisted as `ai_model`. */
export const LEGACY_MODEL_SUCCESSORS: ReadonlyMap<string, AiModelId> = new Map([
  ["gpt-4o", AI_MODEL_GPT],
  ["gemini-1.5-pro", AI_MODEL_GEMINI],
  ["gemini-1.5-pro-latest", AI_MODEL_GEMINI],
  ["models/gemini-1.5-pro-latest", AI_MODEL_GEMINI],
  ["gemini-2.5-pro", AI_MODEL_GEMINI],
  ["claude-3-5-sonnet", AI_MODEL_CLAUDE],
  ["claude-3-5-sonnet-20241022", AI_MODEL_CLAUDE],
  ["claude-sonnet-5-5", AI_MODEL_CLAUDE],
  ["grok-beta", AI_MODEL_GROK],
]);

/** Any other dated id from a still-offered provider maps to that provider's flagship. */
const FAMILY_SUCCESSORS: ReadonlyArray<readonly [RegExp, AiModelId]> = [
  [/^(?:openai\/)?(?:gpt-|chatgpt-|o\d)/, AI_MODEL_GPT],
  [/^(?:anthropic\/)?claude-/, AI_MODEL_CLAUDE],
  [/^(?:google\/)?(?:models\/)?gemini-/, AI_MODEL_GEMINI],
  [/^(?:(?:spacex|x)ai\/)?grok-/, AI_MODEL_GROK],
];

/**
 * Resolve a stored or requested model id to one of the current models.
 * Returns null for unknown ids and ids from removed providers.
 */
export function resolveChatModelId(value: unknown): AiModelId | null {
  if (typeof value !== "string") return null;
  const id = value.trim().toLowerCase();
  if (!id) return null;
  if (isAiModelId(id)) return id;
  const legacy = LEGACY_MODEL_SUCCESSORS.get(id);
  if (legacy) return legacy;
  for (const [pattern, successor] of FAMILY_SUCCESSORS) {
    if (pattern.test(id)) return successor;
  }
  return null;
}

export type ChatCallSettings = Partial<Record<CallSettingName, unknown>>;

/** Drop the call settings the model's API rejects. */
export function callSettingsFor<T extends ChatCallSettings>(
  model: AiModelId,
  settings: T
): Partial<T> {
  const rejected = new Set<string>(CHAT_MODELS[model].rejectedSettings);
  return Object.fromEntries(
    Object.entries(settings).filter(([name]) => !rejected.has(name))
  ) as Partial<T>;
}
