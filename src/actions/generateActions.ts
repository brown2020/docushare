"use server";

import { generateText } from "ai";
import { isAiModelId } from "@/lib/constants";
import { callSettingsFor } from "@/lib/ai/providerModels";
import { createChatModel } from "@/lib/ai/languageModel";
import { getAuthenticatedUser } from "@/lib/auth/session";

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
  if (!isAiModelId(modelName)) {
    throw new Error(`Unsupported model name: ${modelName}`);
  }

  if (process.env.IS_UAT == "1") {
    return "This is a test response in UAT mode.";
  }

  const { text } = await generateText({
    model: createChatModel(modelName, apiKey),
    system: systemPrompt,
    prompt: userPrompt,
    ...callSettingsFor(modelName, {
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    }),
  });
  return text;
}
