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
import { assertAiRateLimit, AiRateLimitError } from "@/lib/ai/rateLimit";
import { resolveStoredModel } from "@/lib/ai/loadUserModel";
import {
  AI_FAILED_MESSAGE,
  AI_KEY_MISSING_MESSAGE,
  AI_RATE_LIMIT_MESSAGE,
  AI_UNAVAILABLE_MESSAGE,
  OUT_OF_CREDITS_MESSAGE,
} from "@/lib/ai/userMessages";
import {
  debitCredits,
  InsufficientCreditsError,
  refundCredits,
} from "@/lib/billing/credits";
import { isFirebaseAdminReady } from "@/firebase/firebaseAdminConfig";

export type GenerateTextResult =
  | { ok: true; text: string }
  | { ok: false; message: string };

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

function failure(message: string): GenerateTextResult {
  return { ok: false, message };
}

export async function generateText(
  prompt: string,
  option: AIOptions,
  command: string
): Promise<GenerateTextResult> {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return failure("You are not signed in.");
  }
  if (!isFirebaseAdminReady()) {
    return failure(AI_UNAVAILABLE_MESSAGE);
  }

  try {
    await assertAiRateLimit(authUser.uid);
  } catch (error) {
    if (error instanceof AiRateLimitError) {
      return failure(AI_RATE_LIMIT_MESSAGE);
    }
    console.warn(
      "[ai] rate_limit_failed",
      error instanceof Error ? error.message : "unknown"
    );
    return failure(AI_UNAVAILABLE_MESSAGE);
  }

  if (process.env.IS_UAT == "1") {
    return { ok: true, text: "This is a test response in UAT mode." };
  }

  const builder = aiCommandPrompts[option];
  if (!builder) {
    return failure("Unsupported AI command.");
  }
  const { systemPrompt, userPrompt } = builder(prompt, command);
  let modelOfUser;
  try {
    modelOfUser = await resolveStoredModel(authUser.uid);
  } catch (error) {
    console.warn(
      "[ai] model_lookup_failed",
      error instanceof Error ? error.message : "unknown"
    );
    return failure(AI_UNAVAILABLE_MESSAGE);
  }

  let modelName = DEFAULT_AI_MODEL;
  let apiKey = "";
  let reserved = 0;

  if (modelOfUser.status === false) {
    if (modelOfUser.code !== RESPONSE_CODE.api_key_not_set) {
      return failure(AI_KEY_MISSING_MESSAGE);
    }
    apiKey = process.env.OPENAI_API_KEY ?? "";
    if (!apiKey) {
      return failure(OUT_OF_CREDITS_MESSAGE);
    }
    reserved = pointsForPrompt(countTokens(userPrompt) + MAX_OUTPUT_TOKEN);
    try {
      await debitCredits(authUser.uid, reserved);
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return failure(OUT_OF_CREDITS_MESSAGE);
      }
      console.warn(
        "[ai] debit_failed",
        error instanceof Error ? error.message : "unknown"
      );
      return failure(AI_UNAVAILABLE_MESSAGE);
    }
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
    return { ok: true, text: response };
  } catch (error) {
    if (reserved > 0) {
      try {
        await refundCredits(authUser.uid, reserved);
      } catch {
        // Keep the original failure visible to the user.
      }
    }
    if (error instanceof InsufficientCreditsError) {
      return failure(OUT_OF_CREDITS_MESSAGE);
    }
    console.warn(
      "[ai] generate_failed",
      error instanceof Error ? error.message : "unknown"
    );
    return failure(AI_FAILED_MESSAGE);
  }
}
