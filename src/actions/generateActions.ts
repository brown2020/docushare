"use server";

import { isAiModelId } from "@/lib/constants";
import { createChatModel } from "@/lib/ai/languageModel";
import { generateChatText } from "@/lib/ai/generateChatText";
import { aiDeadlineSignal } from "@/lib/ai/deadline";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function generateResponse(
  systemPrompt: string,
  userPrompt: string,
  modelName: string,
  apiKey: string
) {
  const startedAt = Date.now();
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

  return generateChatText({
    model: createChatModel(modelName, apiKey),
    modelId: modelName,
    system: systemPrompt,
    prompt: userPrompt,
    settings: {
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    abortSignal: aiDeadlineSignal(startedAt),
  });
}
