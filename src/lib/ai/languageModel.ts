import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";
import { CHAT_MODELS } from "@/lib/ai/providerModels";
import type { AiModelId } from "@/lib/constants";

/** Build the provider client for one of the four chat models. */
export function createChatModel(model: AiModelId, apiKey: string) {
  const { id, provider } = CHAT_MODELS[model];
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey }).responses(id);
    case "anthropic":
      return createAnthropic({ apiKey })(id);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(id);
    case "xai":
      return createXai({ apiKey }).responses(id);
  }
}
