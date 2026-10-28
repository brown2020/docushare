"use server";

import { generateResponse } from "./generateActions";
import {
  COST_POINT_PER_TOKEN,
  DEFAULT_AI_MODEL,
  MAX_OUTPUT_TOKEN,
  RESPONSE_CODE,
} from "@/lib/constants";
import { AIOptions } from "@/interfaces/general";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { requireFirebaseAdmin } from "@/firebase/firebaseAdminConfig";
import { assertAiRateLimit } from "@/lib/ai/rateLimit";
import { resolveStoredModel } from "@/lib/ai/loadUserModel";
import { debitCredits, refundCredits } from "@/lib/billing/credits";

const aiCommandPrompts: Record<
  AIOptions,
  (
    text: string,
    command: string
  ) => { systemPrompt: string; userPrompt: string }
> = {
  continue: (text: string) => ({
    systemPrompt:
      "You are an AI writing assistant that continues existing text based on context from prior text. " +
      "Give more weight/priority to the later characters than the beginning ones. " +
      "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
      "Use Markdown formatting when appropriate.",
    userPrompt: text,
  }),
  improve: (text: string) => ({
    systemPrompt:
      "You are an AI writing assistant that improves existing text. " +
      "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
      "Use Markdown formatting when appropriate.",
    userPrompt: `The existing text is: ${text}`,
  }),
  shorter: (text: string) => ({
    systemPrompt:
      "You are an AI writing assistant that shortens existing text. " +
      "Use Markdown formatting when appropriate.",
    userPrompt: `The existing text is: ${text}`,
  }),

  longer: (text: string) => ({
    systemPrompt:
      "You are an AI writing assistant that lengthens existing text. " +
      "Use Markdown formatting when appropriate.",
    userPrompt: `The existing text is: ${text}`,
  }),
  fix: (text: string) => ({
    systemPrompt:
      "You are an AI writing assistant that fixes existing text. " +
      "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
      "Use Markdown formatting when appropriate.",
    userPrompt: `The existing text is: ${text}`,
  }),
  zap: (text: string, command: string) => ({
    systemPrompt:
      "You are an AI writing assistant that generates text based on a prompt. " +
      "You take an input from the user and a command for manipulating the text" +
      "Use Markdown formatting when appropriate.",
    userPrompt: `For this text: ${text}. You have to respect the command: ${command}`,
  }),
};
function countTokens(text: string) {
  // Rough estimate by considering each word as a token
  return text.split(/\s+/).length;
}

function pointsForPrompt(tokens: number) {
  return tokens * COST_POINT_PER_TOKEN;
}

export async function generateText(
  prompt: string,
  option: AIOptions,
  command: string
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    throw new Error("User is not signed in.", { cause: { status: 401 } });
  }

  requireFirebaseAdmin();
  await assertAiRateLimit(authUser.uid);

  if (process.env.IS_UAT == "1") {
    return "This is a test response in UAT mode.";
  }

  const builder = aiCommandPrompts[option];
  if (!builder) {
    throw new Error("Unsupported AI command.");
  }
  const { systemPrompt, userPrompt } = builder(prompt, command);
  const modelOfUser = await resolveStoredModel(authUser.uid);

  let modelName = DEFAULT_AI_MODEL;
  let apiKey = "";
  let reserved = 0;

  if (modelOfUser.status === false) {
    if (modelOfUser.code !== RESPONSE_CODE.api_key_not_set) {
      throw new Error("You have not added any credit or AI key.", {
        cause: { code: modelOfUser.code },
      });
    }
    apiKey = process.env.OPENAI_API_KEY ?? "";
    if (!apiKey) {
      throw new Error("You have not added any credit or AI key.", {
        cause: { code: RESPONSE_CODE.api_key_not_set },
      });
    }
    reserved = pointsForPrompt(countTokens(userPrompt) + MAX_OUTPUT_TOKEN);
    await debitCredits(authUser.uid, reserved);
  } else {
    modelName = modelOfUser.model;
    apiKey = modelOfUser.key;
  }

  try {
    const response = await generateResponse(
      systemPrompt,
      userPrompt,
      modelName,
      apiKey
    );
    if (reserved > 0) {
      const actual = pointsForPrompt(
        countTokens(userPrompt) + countTokens(response)
      );
      if (actual < reserved) {
        await refundCredits(authUser.uid, reserved - actual);
      } else if (actual > reserved) {
        await debitCredits(authUser.uid, actual - reserved);
      }
    }
    return response;
  } catch (error) {
    if (reserved > 0) {
      await refundCredits(authUser.uid, reserved);
    }
    throw error;
  }
}
