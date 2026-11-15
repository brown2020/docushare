import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { MockLanguageModelV4 } from "ai/test";
import {
  AI_DEADLINE_HEADROOM_MS,
  AI_MAX_DURATION_SECONDS,
  AI_REQUEST_BUDGET_MS,
  aiDeadlineSignal,
  isAiTimeout,
  remainingAiBudgetMs,
} from "@/lib/ai/deadline";
import { generateChatText } from "@/lib/ai/generateChatText";
import { CHAT_MODELS } from "@/lib/ai/providerModels";
import { AI_MODEL_GPT, AI_MODEL_GROK, AI_MODELS_LIST, RESPONSE_CODE } from "@/lib/constants";
import { AI_TIMEOUT_MESSAGE } from "@/lib/ai/userMessages";

const root = path.resolve(__dirname, "../../..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

type CallOptions = Parameters<MockLanguageModelV4["doGenerate"]>[0];

const settings = { temperature: 0.7, topP: 1, frequencyPenalty: 0, presencePenalty: 0 };

function replyModel(text: string) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 1, text: 1, reasoning: 0 },
      },
      warnings: [],
    }),
  });
}

function hangingModel() {
  return new MockLanguageModelV4({
    doGenerate: (options: CallOptions) =>
      new Promise((_, reject) => {
        options.abortSignal?.addEventListener("abort", () => reject(options.abortSignal?.reason));
      }),
  });
}

describe("AI route time limit", () => {
  it("allows 60 seconds and stops the model at least 5 seconds earlier", () => {
    expect(AI_MAX_DURATION_SECONDS).toBe(60);
    expect(AI_DEADLINE_HEADROOM_MS).toBeGreaterThanOrEqual(5_000);
    expect(AI_REQUEST_BUDGET_MS).toBeLessThanOrEqual(AI_MAX_DURATION_SECONDS * 1000 - 5_000);
    expect(AI_REQUEST_BUDGET_MS).toBeGreaterThan(15_000);
  });

  it("exports maxDuration = 60 on the AI route as a literal", () => {
    const route = read("src/app/api/ai/route.ts");
    expect(route).toMatch(/^export const maxDuration = 60;$/m);
  });

  it("counts time already spent in the request against the budget", () => {
    expect(remainingAiBudgetMs(1_000, 1_000)).toBe(AI_REQUEST_BUDGET_MS);
    expect(remainingAiBudgetMs(1_000, 11_000)).toBe(AI_REQUEST_BUDGET_MS - 10_000);
    expect(remainingAiBudgetMs(0, AI_REQUEST_BUDGET_MS + 1)).toBe(0);
    expect(remainingAiBudgetMs(5_000, 0)).toBe(AI_REQUEST_BUDGET_MS);
  });

  it("returns a signal that fires once the budget is spent", async () => {
    const signal = aiDeadlineSignal(0, AI_REQUEST_BUDGET_MS);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(signal.aborted).toBe(true);
    expect(isAiTimeout(signal.reason)).toBe(true);
    expect(aiDeadlineSignal(Date.now()).aborted).toBe(false);
  });

  it("recognizes timeouts and ignores other failures", () => {
    const timeout = new DOMException("timed out", "TimeoutError");
    expect(isAiTimeout(timeout)).toBe(true);
    expect(isAiTimeout(new Error("wrapped", { cause: timeout }))).toBe(true);
    expect(isAiTimeout(new DOMException("aborted", "AbortError"))).toBe(true);
    expect(isAiTimeout(new Error("bad key"))).toBe(false);
    expect(isAiTimeout(undefined)).toBe(false);
    const fired = new AbortController();
    fired.abort();
    expect(isAiTimeout(new Error("any"), fired.signal)).toBe(true);
    expect(isAiTimeout(new Error("any"), new AbortController().signal)).toBe(false);
  });
});

describe("generateChatText", () => {
  it("ends a slow model call at the deadline with a timeout error", async () => {
    const started = Date.now();
    const deadline = AbortSignal.timeout(30);
    const error = await generateChatText({
      model: hangingModel(),
      modelId: AI_MODEL_GROK,
      system: "s",
      prompt: "p",
      settings,
      abortSignal: deadline,
    }).catch((caught: unknown) => caught);
    expect(Date.now() - started).toBeLessThan(2_000);
    expect(isAiTimeout(error, deadline)).toBe(true);
    expect(isAiTimeout(error)).toBe(true);
  });

  it("sends low reasoning effort to Grok and strips its rejected settings", async () => {
    const model = replyModel("grok says hi");
    const text = await generateChatText({
      model,
      modelId: AI_MODEL_GROK,
      system: "s",
      prompt: "p",
      settings,
      abortSignal: new AbortController().signal,
    });
    expect(text).toBe("grok says hi");
    const call = model.doGenerateCalls[0];
    expect(call.providerOptions?.xai).toEqual({ reasoningEffort: "low" });
    expect(call.presencePenalty).toBeUndefined();
    expect(call.frequencyPenalty).toBeUndefined();
    expect(call.temperature).toBe(0.7);
    expect(call.abortSignal).toBeDefined();
  });

  it("sends no reasoning override to the other models", async () => {
    const model = replyModel("ok");
    await generateChatText({
      model,
      modelId: AI_MODEL_GPT,
      system: "s",
      prompt: "p",
      settings,
      abortSignal: new AbortController().signal,
    });
    expect(model.doGenerateCalls[0].providerOptions?.xai).toBeUndefined();
    expect(model.doGenerateCalls[0].temperature).toBeUndefined();
    for (const id of AI_MODELS_LIST) {
      if (id === AI_MODEL_GROK) continue;
      expect(CHAT_MODELS[id].providerOptions).toBeUndefined();
    }
    expect(CHAT_MODELS[AI_MODEL_GROK].providerOptions).toEqual({
      xai: { reasoningEffort: "low" },
    });
  });
});

describe("AI callers use the deadline", () => {
  it("route passes a request-start deadline and returns a clear 504", () => {
    const route = read("src/app/api/ai/route.ts");
    expect(route.indexOf("const startedAt = Date.now()")).toBeLessThan(
      route.indexOf("getAuthenticatedUser()")
    );
    expect(route).toContain("aiDeadlineSignal(startedAt)");
    expect(route).toContain("abortSignal: deadline");
    expect(route).toContain("isAiTimeout(error, deadline)");
    expect(route).toContain("status: 504");
    expect(route).toContain("AI_TIMEOUT_MESSAGE");
    expect(route.indexOf("refundCredits(authUser.uid, reserved)")).toBeLessThan(
      route.indexOf("isAiTimeout(error, deadline)")
    );
    expect(RESPONSE_CODE.ai_timeout).toBe("ai_timeout");
    expect(AI_TIMEOUT_MESSAGE).toMatch(/took too long/i);
  });

  it("server action path uses the same deadline and message", () => {
    const action = read("src/actions/generateActions.ts");
    expect(action).toContain("aiDeadlineSignal(startedAt)");
    const editor = read("src/actions/generateEditorActions.ts");
    expect(editor).toContain("failure(AI_TIMEOUT_MESSAGE)");
  });
});
