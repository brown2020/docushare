import { generateText } from "ai";
import { match } from "ts-pattern";
import { createOpenAI } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createAnthropic } from "@ai-sdk/anthropic";
import {
  AI_MODEL_CLAUDE,
  AI_MODEL_GEMINI,
  AI_MODEL_GPT,
  AI_MODEL_LLAMA,
  AI_MODEL_MISTRAL,
  DEFAULT_AI_MODEL,
  COST_POINT_PER_TOKEN,
  MAX_OUTPUT_TOKEN,
  RESPONSE_CODE,
} from "@/lib/constants";
import { PROVIDER_MODEL_IDS } from "@/lib/ai/providerModels";
import { resolveStoredModel } from "@/lib/ai/loadUserModel";
import { assertAiRateLimit, AiRateLimitError } from "@/lib/ai/rateLimit";
import {
  debitCredits,
  InsufficientCreditsError,
  refundCredits,
} from "@/lib/billing/credits";
import {
  FirebaseAdminNotConfiguredError,
  isFirebaseAdminReady,
} from "@/firebase/firebaseAdminConfig";
import { getAuthenticatedUser } from "@/lib/auth/session";

const AI_OPTIONS = [
  "continue",
  "improve",
  "shorter",
  "longer",
  "fix",
  "zap",
  "aiBlock",
] as const;

type AiOption = (typeof AI_OPTIONS)[number];

function isAiOption(value: unknown): value is AiOption {
  return typeof value === "string" && (AI_OPTIONS as readonly string[]).includes(value);
}

async function getModel(modelName: string, apiKey: string) {
  switch (modelName) {
    case AI_MODEL_GPT:
      return createOpenAI({ apiKey })(PROVIDER_MODEL_IDS[AI_MODEL_GPT]);
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

function countTokens(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

export const POST = async (req: NextRequest) => {
  if (!isFirebaseAdminReady()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ error: "User is not signed in." }, { status: 401 });
  }

  let reserved = 0;
  try {
    await assertAiRateLimit(authUser.uid);

    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";
    const command = typeof body?.command === "string" ? body.command : "";
    const option: unknown = body?.option;
    if (!isAiOption(option)) {
      return NextResponse.json({ error: "Unsupported AI command." }, { status: 400 });
    }
    if (prompt.length > 20_000 || command.length > 4_000) {
      return NextResponse.json({ error: "Prompt is too long." }, { status: 400 });
    }

    const messages = match(option)
      .with("continue", () => ({
        system:
          "You are an AI writing assistant that continues existing text based on context from prior text. " +
          "Give more weight/priority to the later characters than the beginning ones. " +
          "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
          "Use Markdown formatting when appropriate.",
        prompt,
      }))
      .with("improve", () => ({
        system:
          "You are an AI writing assistant that improves existing text. " +
          "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
          "Use Markdown formatting when appropriate.",
        prompt: `The existing text is: ${prompt}`,
      }))
      .with("shorter", () => ({
        system:
          "You are an AI writing assistant that shortens existing text. " +
          "Use Markdown formatting when appropriate.",
        prompt: `The existing text is: ${prompt}`,
      }))
      .with("longer", () => ({
        system:
          "You are an AI writing assistant that lengthens existing text. " +
          "Use Markdown formatting when appropriate.",
        prompt: `The existing text is: ${prompt}`,
      }))
      .with("fix", () => ({
        system:
          "You are an AI writing assistant that fixes existing text. " +
          "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
          "Use Markdown formatting when appropriate.",
        prompt: `The existing text is: ${prompt}`,
      }))
      .with("zap", () => ({
        system:
          "You are an AI writing assistant that generates text based on a prompt. " +
          "You take an input from the user and a command for manipulating the text. " +
          "Use Markdown formatting when appropriate.",
        prompt: `For this text: ${prompt}. You have to respect the command: ${command}`,
      }))
      .with("aiBlock", () => ({
        system:
          "You are an AI writing assistant that generates text based on a prompt. " +
          "Use Markdown formatting when appropriate.",
        prompt: command,
      }))
      .exhaustive();

    const modelOfUser = await resolveStoredModel(authUser.uid);
    let modelName = DEFAULT_AI_MODEL;
    let apiKey = "";

    if (!modelOfUser.status) {
      if (modelOfUser.code !== RESPONSE_CODE.api_key_not_set) {
        return NextResponse.json(
          {
            status: false,
            message: "You have not added any credit or AI key.",
            code: modelOfUser.code,
          },
          { status: 400 }
        );
      }
      apiKey = process.env.OPENAI_API_KEY ?? "";
      if (!apiKey) {
        return NextResponse.json(
          {
            status: false,
            message: "You have not added any credit or AI key.",
            code: RESPONSE_CODE.api_key_not_set,
          },
          { status: 400 }
        );
      }
      reserved =
        (countTokens(messages.prompt) + MAX_OUTPUT_TOKEN) * COST_POINT_PER_TOKEN;
      await debitCredits(authUser.uid, reserved);
    } else {
      modelName = modelOfUser.model;
      apiKey = modelOfUser.key;
    }

    const aiModel = await getModel(modelName, apiKey);
    const { text } = await generateText({
      model: aiModel,
      ...messages,
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    });

    if (reserved > 0) {
      const actual =
        (countTokens(messages.prompt) + countTokens(text)) * COST_POINT_PER_TOKEN;
      if (actual < reserved) await refundCredits(authUser.uid, reserved - actual);
    }

    return NextResponse.json({ response: text });
  } catch (error) {
    if (reserved > 0) {
      try {
        await refundCredits(authUser.uid, reserved);
      } catch {
        // The original failure is more useful than a refund error.
      }
    }
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { status: false, message: error.message, code: RESPONSE_CODE.insufficient_points },
        { status: 402 }
      );
    }
    if (error instanceof AiRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof FirebaseAdminNotConfiguredError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    console.warn("[ai] request_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
};
