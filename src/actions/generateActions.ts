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
  AI_MODEL_MISTRAL,
} from "@/lib/constants";

async function getModel(modelName: string, api_key: string | null = null) {
  const aiOptions = api_key ? { apiKey: api_key } : {};

  switch (modelName) {
    case AI_MODEL_GPT: {
      const openai11 = createOpenAI(aiOptions);
      return openai11("gpt-4o");
    }
    case AI_MODEL_GEMINI:
      return createGoogleGenerativeAI(aiOptions)(
        "models/gemini-1.5-pro-latest"
      );
    case AI_MODEL_MISTRAL:
      return createMistral(aiOptions)("mistral-large-latest");
    case AI_MODEL_CLAUDE:
      return createAnthropic(aiOptions)("claude-3-5-sonnet-20241022");
    case "llama-v3p1-405b": {
      const fireworks = createOpenAI({
        ...aiOptions,
        baseURL: "https://api.fireworks.ai/inference/v1",
      });
      return fireworks("accounts/fireworks/models/llama-v3p1-405b-instruct");
    }
    default:
      throw new Error(`Unsupported model name: ${modelName}`);
  }
}

export async function generateResponse(
  systemPrompt: string,
  userPrompt: string,
  modelName: string,
  api_key: string | null = null
) {
  const model = await getModel(modelName, api_key);

  if (process.env.IS_UAT == "1") {
    return "This is a test response in UAT mode.";
  }

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
