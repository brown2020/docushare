import { CHAT_MODELS, type ChatProvider } from "@/lib/ai/providerModels";
import { DEFAULT_AI_MODEL, type AiModelId } from "@/lib/constants";

type PlatformEnv = Readonly<Record<string, string | undefined>>;

function platformKey(provider: ChatProvider, env: PlatformEnv): string {
  switch (provider) {
    case "openai":
      return env.OPENAI_API_KEY?.trim() ?? "";
    case "anthropic":
      return env.ANTHROPIC_API_KEY?.trim() ?? "";
    case "google":
      return env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ?? "";
    case "xai":
      return env.XAI_API_KEY?.trim() ?? "";
  }
}

/**
 * Server key for users who saved no provider key. Uses the preferred model's
 * provider when configured, otherwise the default model's provider.
 */
export function resolvePlatformModel(
  preferred: AiModelId,
  env: PlatformEnv = process.env
): { model: AiModelId; key: string } | null {
  for (const model of new Set([preferred, DEFAULT_AI_MODEL])) {
    const key = platformKey(CHAT_MODELS[model].provider, env);
    if (key) return { model, key };
  }
  return null;
}
