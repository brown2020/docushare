import { generateText, type LanguageModel } from "ai";
import { CHAT_MODELS, callSettingsFor } from "@/lib/ai/providerModels";
import type { AiModelId } from "@/lib/constants";

export interface ChatTextRequest {
  model: LanguageModel;
  modelId: AiModelId;
  system: string;
  prompt: string;
  settings: {
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  abortSignal: AbortSignal;
}

/** Run one chat completion with the model's settings, provider options, and deadline. */
export async function generateChatText({
  model,
  modelId,
  system,
  prompt,
  settings,
  abortSignal,
}: ChatTextRequest): Promise<string> {
  const { providerOptions } = CHAT_MODELS[modelId];
  const { text } = await generateText({
    model,
    system,
    prompt,
    ...callSettingsFor(modelId, settings),
    ...(providerOptions ? { providerOptions } : {}),
    abortSignal,
  });
  return text;
}
