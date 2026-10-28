"use server";

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createAnthropic } from "@ai-sdk/anthropic";
import {
  AI_MODEL_CLAUDE,
  AI_MODEL_GEMINI,
  AI_MODEL_GPT,
  AI_MODEL_LLAMA,
  AI_MODEL_MISTRAL,
} from "@/lib/constants";
import { PROVIDER_MODEL_IDS } from "@/lib/ai/providerModels";
import { getAuthenticatedUser } from "@/lib/auth/session";

async function getModel(modelName: string, apiKey: string) {
  switch (modelName) {
    case AI_MODEL_GPT: {
      const openai = createOpenAI({ apiKey });
      return openai(PROVIDER_MODEL_IDS[AI_MODEL_GPT]);
    }
    case AI_MODEL_GEMINI:
      return createGoogleGenerativeAI({ apiKey })(PROVIDER_MODEL_IDS[AI_MODEL_GEMINI]);
    case AI_MODEL_MISTRAL:
      return createMistral({ apiKey })(PROVIDER_MODEL_IDS[AI_MODEL_MISTRAL]);
    case AI_MODEL_CLAUDE:
      return createAnthropic({ apiKey })(PROVIDER_MODEL_IDS[AI_MODEL_CLAUDE]);
    case AI_MODEL_LLAMA: {
      const fireworks = createOpenAI({
        apiKey,
        baseURL: "https://api.fireworks.ai/inference/v1",
      });
      return fireworks(PROVIDER_MODEL_IDS[AI_MODEL_LLAMA]);
    }
    default:
      throw new Error(`Unsupported model name: ${modelName}`);
  }
}

export async function generateResponse(
  systemPrompt: string,
  userPrompt: string,
  modelName: string,
  apiKey: string
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    throw new Error("User is not signed in.");
  }
  if (!apiKey) {
    throw new Error("AI key not configured.");
  }

  if (process.env.IS_UAT == "1") {
    return "This is a test response in UAT mode.";
  }

  const model = await getModel(modelName, apiKey);

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.7,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  });
  return text;
}
