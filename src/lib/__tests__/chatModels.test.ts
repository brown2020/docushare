import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  AI_MODEL_CLAUDE,
  AI_MODEL_GEMINI,
  AI_MODEL_GPT,
  AI_MODEL_GROK,
  AI_MODELS_LIST,
  DEFAULT_AI_MODEL,
  RESPONSE_CODE,
  isAiModelId,
} from "@/lib/constants";
import {
  CHAT_MODELS,
  LEGACY_MODEL_SUCCESSORS,
  REMOVED_PROVIDER_MODEL_IDS,
  RETIRED_PROVIDER_MODEL_IDS,
  callSettingsFor,
  resolveChatModelId,
} from "@/lib/ai/providerModels";
import { API_KEY_FIELDS, LEGACY_API_KEY_FIELDS } from "@/lib/ai/apiKeyFields";
import { resolveModelSelection } from "@/lib/ai/resolveModel";
import { resolvePlatformModel } from "@/lib/ai/platformKeys";

const root = path.resolve(__dirname, "../../..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const baseSettings = {
  temperature: 0.7,
  topP: 1,
  topK: 40,
  frequencyPenalty: 0,
  presencePenalty: 0,
  stopSequences: ["END"],
  toolChoice: "required",
};

describe("chat model picker", () => {
  it("offers exactly the four current flagships", () => {
    expect([...AI_MODELS_LIST]).toEqual([
      "gpt-6.1-sol",
      "claude-opus-5-5",
      "gemini-4-argon",
      "grok-4.7",
    ]);
    expect(Object.keys(CHAT_MODELS).sort()).toEqual([...AI_MODELS_LIST].sort());
    expect(Object.values(CHAT_MODELS).map((m) => m.label)).toEqual([
      "OpenAI GPT-6.1 Sol",
      "Anthropic Claude Opus 5.5",
      "Google Gemini 4 Argon",
      "xAI Grok 4.7",
    ]);
    expect(DEFAULT_AI_MODEL).toBe("gpt-6.1-sol");
  });

  it("records native and gateway ids for each model", () => {
    expect(CHAT_MODELS[AI_MODEL_GPT].gatewayId).toBe("openai/gpt-6.1-sol");
    expect(CHAT_MODELS[AI_MODEL_CLAUDE].gatewayId).toBe("anthropic/claude-opus-5.5");
    expect(CHAT_MODELS[AI_MODEL_GEMINI].gatewayId).toBe("google/gemini-4-argon");
    expect(CHAT_MODELS[AI_MODEL_GROK].gatewayId).toBe("spacexai/grok-4.7");
    for (const model of AI_MODELS_LIST) {
      expect(CHAT_MODELS[model].id).toBe(model);
    }
  });

  it("maps each model to exactly one current key field", () => {
    expect([...API_KEY_FIELDS]).toEqual([
      "openai_api_key",
      "anthropic_api_key",
      "google_gen_ai_api_key",
      "xai_api_key",
    ]);
    const fields = AI_MODELS_LIST.map((model) => CHAT_MODELS[model].keyField);
    expect(new Set(fields)).toEqual(new Set(API_KEY_FIELDS));
    for (const legacy of LEGACY_API_KEY_FIELDS) {
      expect(API_KEY_FIELDS as readonly string[]).not.toContain(legacy);
    }
  });

  it("rejects retired ids as current model ids", () => {
    for (const retired of RETIRED_PROVIDER_MODEL_IDS) {
      expect(isAiModelId(retired)).toBe(false);
    }
  });
});

describe("legacy model successors", () => {
  it("maps stored ids to the same provider's flagship", () => {
    expect(resolveChatModelId("gpt-4o")).toBe(AI_MODEL_GPT);
    expect(resolveChatModelId("gpt-5.5")).toBe(AI_MODEL_GPT);
    expect(resolveChatModelId("o3-mini")).toBe(AI_MODEL_GPT);
    expect(resolveChatModelId("claude-3-5-sonnet")).toBe(AI_MODEL_CLAUDE);
    expect(resolveChatModelId("claude-sonnet-5-5")).toBe(AI_MODEL_CLAUDE);
    expect(resolveChatModelId("claude-opus-4-1-20250805")).toBe(AI_MODEL_CLAUDE);
    expect(resolveChatModelId("gemini-1.5-pro")).toBe(AI_MODEL_GEMINI);
    expect(resolveChatModelId("models/gemini-1.5-pro-latest")).toBe(AI_MODEL_GEMINI);
    expect(resolveChatModelId("gemini-3.1-pro-preview")).toBe(AI_MODEL_GEMINI);
    expect(resolveChatModelId("grok-beta")).toBe(AI_MODEL_GROK);
    expect(resolveChatModelId("grok-3")).toBe(AI_MODEL_GROK);
    expect(resolveChatModelId("xai/grok-4")).toBe(AI_MODEL_GROK);
    expect(resolveChatModelId("spacexai/grok-4.7")).toBe(AI_MODEL_GROK);
    expect(resolveChatModelId("openai/gpt-6.1-sol")).toBe(AI_MODEL_GPT);
    for (const [legacy, successor] of LEGACY_MODEL_SUCCESSORS) {
      expect(resolveChatModelId(legacy)).toBe(successor);
    }
  });

  it("keeps current ids and rejects removed providers and junk", () => {
    for (const model of AI_MODELS_LIST) {
      expect(resolveChatModelId(model)).toBe(model);
    }
    for (const removed of REMOVED_PROVIDER_MODEL_IDS) {
      expect(resolveChatModelId(removed)).toBeNull();
    }
    expect(resolveChatModelId("__proto__")).toBeNull();
    expect(resolveChatModelId("constructor")).toBeNull();
    expect(resolveChatModelId("")).toBeNull();
    expect(resolveChatModelId(42)).toBeNull();
    expect(resolveChatModelId(undefined)).toBeNull();
  });

  it("uses the successor when resolving a saved selection", () => {
    expect(
      resolveModelSelection({ ai_model: "claude-3-5-sonnet", anthropic_api_key: "sk-ant" })
    ).toEqual({ status: true, model: AI_MODEL_CLAUDE, key: "sk-ant" });
    expect(resolveModelSelection({ ai_model: "grok-beta", xai_api_key: "xai" })).toEqual({
      status: true,
      model: AI_MODEL_GROK,
      key: "xai",
    });
    expect(resolveModelSelection({ ai_model: "gemini-1.5-pro", openai_api_key: "sk" })).toEqual({
      status: false,
      code: RESPONSE_CODE.api_key_not_found,
      model: AI_MODEL_GEMINI,
    });
  });

  it("falls back to the default when the saved provider was removed", () => {
    expect(resolveModelSelection({ ai_model: "mistral-large", openai_api_key: "sk" })).toEqual({
      status: true,
      model: AI_MODEL_GPT,
      key: "sk",
    });
    expect(resolveModelSelection({ ai_model: "llama-v3p1-405b" })).toEqual({
      status: false,
      code: RESPONSE_CODE.api_key_not_set,
      model: AI_MODEL_GPT,
    });
  });
});

describe("per-model call settings", () => {
  it("strips sampling and forced tool choice for Claude Opus 5.5", () => {
    const settings = callSettingsFor(AI_MODEL_CLAUDE, baseSettings);
    expect(settings).not.toHaveProperty("temperature");
    expect(settings).not.toHaveProperty("topP");
    expect(settings).not.toHaveProperty("topK");
    expect(settings).not.toHaveProperty("toolChoice");
    expect(settings.presencePenalty).toBe(0);
  });

  it("strips penalties and stop sequences for Grok 4.7", () => {
    const settings = callSettingsFor(AI_MODEL_GROK, baseSettings);
    expect(settings).not.toHaveProperty("presencePenalty");
    expect(settings).not.toHaveProperty("frequencyPenalty");
    expect(settings).not.toHaveProperty("stopSequences");
    expect(settings.temperature).toBe(0.7);
  });

  it("strips sampling and penalties for GPT-6.1 Sol on the Responses API", () => {
    const settings = callSettingsFor(AI_MODEL_GPT, baseSettings);
    expect(settings).not.toHaveProperty("temperature");
    expect(settings).not.toHaveProperty("topP");
    expect(settings).not.toHaveProperty("frequencyPenalty");
    expect(settings).not.toHaveProperty("presencePenalty");
  });

  it("passes everything through for Gemini 4 Argon", () => {
    expect(callSettingsFor(AI_MODEL_GEMINI, baseSettings)).toEqual(baseSettings);
  });
});

describe("platform key fallback", () => {
  it("uses the preferred model's provider key, then the default's", () => {
    expect(resolvePlatformModel(AI_MODEL_GROK, { XAI_API_KEY: "x", OPENAI_API_KEY: "o" })).toEqual({
      model: AI_MODEL_GROK,
      key: "x",
    });
    expect(resolvePlatformModel(AI_MODEL_GROK, { OPENAI_API_KEY: "o" })).toEqual({
      model: AI_MODEL_GPT,
      key: "o",
    });
    expect(resolvePlatformModel(AI_MODEL_CLAUDE, { ANTHROPIC_API_KEY: "a" })).toEqual({
      model: AI_MODEL_CLAUDE,
      key: "a",
    });
    expect(
      resolvePlatformModel(AI_MODEL_GEMINI, { GOOGLE_GENERATIVE_AI_API_KEY: "g" })
    ).toEqual({ model: AI_MODEL_GEMINI, key: "g" });
    expect(resolvePlatformModel(AI_MODEL_GEMINI, { XAI_API_KEY: "x" })).toBeNull();
    expect(resolvePlatformModel(AI_MODEL_GPT, { OPENAI_API_KEY: "  " })).toBeNull();
  });

  it("reads provider keys from process.env", () => {
    const src = read("src/lib/ai/platformKeys.ts");
    expect(src).toContain("env: PlatformEnv = process.env");
    for (const name of [
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
      "GOOGLE_GENERATIVE_AI_API_KEY",
      "XAI_API_KEY",
    ]) {
      expect(src).toContain(`env.${name}`);
    }
  });
});

describe("provider wiring", () => {
  it("uses the Responses API for GPT and Grok and no removed providers", () => {
    const src = read("src/lib/ai/languageModel.ts");
    expect(src).toContain("createOpenAI({ apiKey }).responses(id)");
    expect(src).toContain("createXai({ apiKey }).responses(id)");
    expect(src).not.toMatch(/mistral|fireworks/i);
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.dependencies).toHaveProperty("@ai-sdk/xai");
    expect(pkg.dependencies).not.toHaveProperty("@ai-sdk/mistral");
  });

  it("keeps every provider key, current and legacy, off the client profile", () => {
    const rules = read("firestore.rules");
    for (const field of [...API_KEY_FIELDS, ...LEGACY_API_KEY_FIELDS]) {
      expect(rules).toContain(`'${field}'`);
      expect(rules).toContain(`request.resource.data.${field} == ''`);
    }
    const loader = read("src/lib/ai/loadUserModel.ts");
    expect(loader).toContain("LEGACY_API_KEY_FIELDS");
  });
});
