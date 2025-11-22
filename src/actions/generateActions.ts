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
  // MAX_OUTPUT_TOKEN,
} from "@/lib/constants";

async function getModel(modelName: string, api_key: string | null = null) {
  const aiOptions = api_key ? { apiKey: api_key } : {};

  switch (modelName) {
    case AI_MODEL_GPT:
      const openai11 = createOpenAI(aiOptions);
      return openai11("gpt-4o");
    case AI_MODEL_GEMINI:
      return createGoogleGenerativeAI(aiOptions)(
        "models/gemini-1.5-pro-latest"
      );
    case AI_MODEL_MISTRAL:
      return createMistral(aiOptions)("mistral-large-latest");
    case AI_MODEL_CLAUDE:
      return createAnthropic(aiOptions)("claude-3-5-sonnet-20241022");
    case "llama-v3p1-405b":
      const fireworks = createOpenAI({
        ...aiOptions,
        baseURL: "https://api.fireworks.ai/inference/v1",
      });
      return fireworks("accounts/fireworks/models/llama-v3p1-405b-instruct");

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

  // const messages: CoreMessage[] = [
  //   {
  //     role: "system",
  //     content: systemPrompt,
  //   },
  //   {
  //     role: "user",
  //     content: userPrompt,
  //   },
  // ];

  if (process.env.IS_UAT == "1") {
    //     const stream = createStreamableValue('# Gandhi Jayanti: A Reflection on the Life and Legacy of Mahatma Gandhi');
    //     stream.value.
    //     setTimeout(() => {
    //       stream.update(`## The Significance of Gandhi Jayanti

    //     Gandhi Jayanti is not only a day to honor the memory of Mahatma Gandhi but also to reaffirm the values of non-violence, peace, and truth. The celebration is marked by prayer services and tributes across India, especially at Raj Ghat, Gandhi's memorial in New Delhi where he was cremated following his assassination in 1948.

    //     ### Activities on Gandhi Jayanti

    //     - **Prayer Meetings:** People gather to sing Gandhi's favorite devotional songs and read from religious scriptures. This reflects Gandhi's belief in the power of spirituality.
    //     - **Award Ceremonies:** Various awards for promoting peace and non-violence are presented.
    //     - **Educational Events:** Schools and colleges organize events that include debates, essay competitions, and art exhibitions themed around Gandhi's life and teachings.
    //     - **Community Service:** Emphasizing Gandhi's principle of 'Seva' or service, many volunteer groups engage in community cleanup, tree planting, and helping the underprivileged.

    //     ## Gandhi's Philosophy and Its Global Impact`);
    //   }, 1000);
    //     setTimeout(() => {
    //       stream.done(`## The Significance of Gandhi Jayanti

    // Gandhi Jayanti is not only a day to honor the memory of Mahatma Gandhi but also to reaffirm the values of non-violence, peace, and truth. The celebration is marked by prayer services and tributes across India, especially at Raj Ghat, Gandhi's memorial in New Delhi where he was cremated following his assassination in 1948.

    // ### Activities on Gandhi Jayanti

    // - **Prayer Meetings:** People gather to sing Gandhi's favorite devotional songs and read from religious scriptures. This reflects Gandhi's belief in the power of spirituality.
    // - **Award Ceremonies:** Various awards for promoting peace and non-violence are presented.
    // - **Educational Events:** Schools and colleges organize events that include debates, essay competitions, and art exhibitions themed around Gandhi's life and teachings.
    // - **Community Service:** Emphasizing Gandhi's principle of 'Seva' or service, many volunteer groups engage in community cleanup, tree planting, and helping the underprivileged.

    // ## Gandhi's Philosophy and Its Global Impact`);
    //     }, 2000);

    //     return stream.value;
    return `## The Significance of Gandhi Jayanti
  
Gandhi Jayanti is not only a day to honor the memory of Mahatma Gandhi but also to reaffirm the values of non-violence, peace, and truth. The celebration is marked by prayer services and tributes across India, especially at Raj Ghat, Gandhi's memorial in New Delhi where he was cremated following his assassination in 1948.

### Activities on Gandhi Jayanti

- **Prayer Meetings:** People gather to sing Gandhi's favorite devotional songs and read from religious scriptures. This reflects Gandhi's belief in the power of spirituality.
- **Award Ceremonies:** Various awards for promoting peace and non-violence are presented.
- **Educational Events:** Schools and colleges organize events that include debates, essay competitions, and art exhibitions themed around Gandhi's life and teachings.
- **Community Service:** Emphasizing Gandhi's principle of 'Seva' or service, many volunteer groups engage in community cleanup, tree planting, and helping the underprivileged.

## Gandhi's Philosophy and Its Global Impact`;
  } else {
    // const result = await streamText({
    //   model,
    //   messages,
    //   maxTokens: MAX_OUTPUT_TOKEN
    // });
    // const stream = createStreamableValue(result.textStream);
    // return stream.value
    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      // maxTokens: MAX_OUTPUT_TOKEN,
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    });
    return text;
  }
}

export async function generateSummary(
  document: string,
  language: string,
  modelName: string,
  numWords: number
) {
  const systemPrompt = `You are a helpful summarization and translation assistant. Your job is to generate a summary of the provided document in the provided language. The summary should be concise, informative, and ${numWords} words or less. Present the summary without introduction and without saying that it is a summary.`;
  const userPrompt = `Provided document:\n${document}\n\nProvided language:\n${language}`;
  return generateResponse(systemPrompt, userPrompt, modelName);
}

export async function generateAnswer(
  document: string,
  question: string,
  modelName: string
) {
  const systemPrompt =
    "You are a helpful question and answer assistant. Your job is to generate an answer to the provided question based on the provided document. Without any introduction, provide an answer that is concise, informative, and 100 words or less.";
  const userPrompt = `Provided document:\n${document}\n\nProvided question:\n${question}`;
  return generateResponse(systemPrompt, userPrompt, modelName);
}
