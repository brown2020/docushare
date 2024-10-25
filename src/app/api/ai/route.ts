import { generateText } from "ai";
import { match } from "ts-pattern";
import { createOpenAI } from "@ai-sdk/openai"; // Ensure OPENAI_API_KEY environment variable is set
import { NextRequest } from "next/server";
import { db } from "@/firebase/firebaseAdminConfig";
import {
  AI_MODEL_CLAUDE,
  AI_MODEL_GEMINI,
  AI_MODEL_GPT,
  AI_MODEL_LLAMA,
  AI_MODEL_MISTRAL,
  AI_MODELS_LIST,
  DEFAULT_AI_MODEL,
  RESPONSE_CODE,
  USER_COLLECTION,
} from "@/lib/constants";
import { auth } from "@clerk/nextjs/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createAnthropic } from "@ai-sdk/anthropic";

async function getModel(modelName: string, api_key: string) {
  switch (modelName) {
    case AI_MODEL_GPT:
      const openai11 = createOpenAI({ apiKey: api_key });
      return openai11("gpt-4o");
    case AI_MODEL_GEMINI:
      return createGoogleGenerativeAI({ apiKey: api_key })(
        "models/gemini-1.5-pro-latest"
      );
    case AI_MODEL_MISTRAL:
      return createMistral({ apiKey: api_key })("mistral-large-latest");
    case AI_MODEL_CLAUDE:
      return createAnthropic({ apiKey: api_key })("claude-3-5-sonnet-20241022");
    case "llama-v3p1-405b":
      const fireworks = createOpenAI({
        apiKey: api_key,
        baseURL: "https://api.fireworks.ai/inference/v1",
      });
      return fireworks("accounts/fireworks/models/llama-v3p1-405b-instruct");

    default:
      throw new Error(`Unsupported model name: ${modelName}`);
  }
}

async function getModelForUser(user_id: string) {
  const userRef = db
    .collection(USER_COLLECTION)
    .doc(user_id)
    .collection("profile")
    .doc("userData");
  const userSnapshot = await userRef.get();
  const data = userSnapshot.data();
  const availableModelKeys = [];
  if (data && data.openai_api_key) availableModelKeys.push(AI_MODEL_GPT);
  if (data && data.anthropic_api_key) availableModelKeys.push(AI_MODEL_GEMINI);
  if (data && data.google_gen_ai_api_key)
    availableModelKeys.push(AI_MODEL_MISTRAL);
  if (data && data.mistral_api_key) availableModelKeys.push(AI_MODEL_CLAUDE);
  if (data && data.fireworks_api_key) availableModelKeys.push(AI_MODEL_LLAMA);

  if (availableModelKeys.length == 0)
    return { status: false, code: RESPONSE_CODE.api_key_not_set };

  const aiModelKeys: Record<string, string> = {
    [AI_MODEL_GPT]: data && data.openai_api_key ? data.openai_api_key : "",
    [AI_MODEL_GEMINI]:
      data && data.anthropic_api_key ? data.anthropic_api_key : "",
    [AI_MODEL_MISTRAL]:
      data && data.google_gen_ai_api_key ? data.google_gen_ai_api_key : "",
    [AI_MODEL_CLAUDE]: data && data.mistral_api_key ? data.mistral_api_key : "",
    [AI_MODEL_LLAMA]:
      data && data.fireworks_api_key ? data.fireworks_api_key : "",
  };

  if (typeof data != "object") {
    return { status: false, message: "User data not found." };
  }

  if (
    Object.keys(data).includes("ai_model") &&
    typeof data.ai_model == "string" &&
    AI_MODELS_LIST.includes(data.ai_model)
  ) {
    // if user has selected ai model then use only that
    if (!availableModelKeys.includes(data.ai_model))
      return { status: false, code: RESPONSE_CODE.api_key_not_found };
  }

  // If not selected then use first default model
  if (availableModelKeys.includes(DEFAULT_AI_MODEL))
    return {
      status: true,
      data: { model: DEFAULT_AI_MODEL, key: aiModelKeys[DEFAULT_AI_MODEL] },
    };

  // If default ai model does not have key then use model which key is set
  const aiModel = availableModelKeys[0];
  return { status: true, data: { model: aiModel, key: aiModelKeys[aiModel] } };
}

export const POST = async (req: NextRequest) => {
  // const demotext = "Hello, World!";
  // await new Promise((resolve) => setTimeout(resolve, 3000));
  const companyOpenAIKey = process.env.OPENAI_API_KEY ?? "";
  if (companyOpenAIKey.length == 0) {
    return new Response(
      JSON.stringify({
        status: false,
        message: "Something went wrong.",
        code: "ai_key_not_found",
      })
    );
  }
  // return new Response(JSON.stringify({ response: demotext }))
  const { userId } = await auth();
  if (!userId) {
    return new Response("User is not signed in.", { status: 401 });
  }

  const modelOfUser = await getModelForUser(userId);

  if (!modelOfUser.status || !modelOfUser.data) {
    return new Response(
      JSON.stringify({
        status: false,
        message: "You have not added any credit or AI key.",
        code: modelOfUser.code,
      })
    );
  }

  const { prompt, option, command } = await req.json();
  const messages = match(option)
    .with("continue", () => ({
      system:
        "You are an AI writing assistant that continues existing text based on context from prior text. " +
        "Give more weight/priority to the later characters than the beginning ones. " +
        "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
        "Use Markdown formatting when appropriate.",
      prompt: prompt,
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
        "You area an AI writing assistant that generates text based on a prompt. " +
        "You take an input from the user and a command for manipulating the text" +
        "Use Markdown formatting when appropriate.",
      prompt: `For this text: ${prompt}. You have to respect the command: ${command}`,
    }))
    .with("aiBlock", () => ({
      system:
        "You area an AI writing assistant that generates text based on a prompt. " +
        "Use Markdown formatting when appropriate.",
      prompt: `${command}`,
    }))
    .run();

  console.log("Asking for response....");

  const aiModel = await getModel(modelOfUser.data.model, modelOfUser.data.key);

  const { text } = await generateText({
    model: aiModel,
    ...messages,
    temperature: 0.7,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  });

  return new Response(JSON.stringify({ response: text }));
};
