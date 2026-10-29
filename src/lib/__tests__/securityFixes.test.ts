import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { isCreditPackPayment, CREDIT_PACK_PRICE_CENTS } from "@/lib/billing";
import {
  isCheckoutConfigured,
  PAYMENTS_UNAVAILABLE_MESSAGE,
} from "@/lib/billing/checkout";
import { OUT_OF_CREDITS_MESSAGE } from "@/lib/ai/userMessages";
import { resolveModelSelection } from "@/lib/ai/resolveModel";
import { PROVIDER_MODEL_IDS, RETIRED_PROVIDER_MODEL_IDS } from "@/lib/ai/providerModels";
import { isSafeLinkHref } from "@/lib/links";
import { isAllowedFontSize } from "@/lib/fontSize";
import { canReadDocument, contentReferencesImage } from "@/lib/documents/access";
import { nextRevision } from "@/lib/documents/revision";
import { isTrustedSessionRequest } from "@/lib/auth/requestOrigin";
import { acceptsIdTokenSession } from "@/lib/auth/sessionPolicy";
import { isSafeImageKey, sniffImageType } from "@/lib/images";
import { AI_MODEL_CLAUDE, AI_MODEL_GPT, RESPONSE_CODE } from "@/lib/constants";

const root = path.resolve(__dirname, "../../..");

describe("checkout and credits messaging", () => {
  const ready = {
    publishableKey: "pk_test",
    secretKey: "sk_test",
    webhookSecret: "whsec_test",
    productName: "credits",
    adminReady: true,
  };

  it("enables checkout only when Stripe and Admin are configured", () => {
    expect(isCheckoutConfigured(ready)).toBe(true);
    expect(isCheckoutConfigured({ ...ready, webhookSecret: "" })).toBe(false);
    expect(isCheckoutConfigured({ ...ready, secretKey: null })).toBe(false);
    expect(isCheckoutConfigured({ ...ready, adminReady: false })).toBe(false);
    expect(PAYMENTS_UNAVAILABLE_MESSAGE).toMatch(/not configured/i);
  });

  it("returns an out-of-credits result instead of throwing", () => {
    const src = readFileSync(
      path.join(root, "src/actions/generateEditorActions.ts"),
      "utf8"
    );
    expect(OUT_OF_CREDITS_MESSAGE).toMatch(/out of credits/i);
    expect(src).toContain("OUT_OF_CREDITS_MESSAGE");
    expect(src).toContain("ok: false");
    expect(src).not.toMatch(/throw error/);
    const chargeAt = src.indexOf("authorizeAiSpend");
    const uatAt = src.indexOf("isUatAi()");
    expect(chargeAt).toBeGreaterThan(-1);
    expect(uatAt).toBeGreaterThan(chargeAt);
    const route = readFileSync(path.join(root, "src/app/api/ai/route.ts"), "utf8");
    expect(route).toContain("status: 402");
    expect(route.indexOf("authorizeAiSpend")).toBeLessThan(route.indexOf("isUatAi()"));
    const client = readFileSync(
      path.join(root, "src/components/menus/TextMenu/hooks/useTextmenuCommands.ts"),
      "utf8"
    );
    expect(client).toContain("response.status === 402");
    expect(client).toContain("OUT_OF_CREDITS_MESSAGE");
  });
});

describe("billing", () => {
  it("accepts only the fixed credit pack price in usd", () => {
    expect(isCreditPackPayment(CREDIT_PACK_PRICE_CENTS, "usd")).toBe(true);
    expect(isCreditPackPayment(CREDIT_PACK_PRICE_CENTS, "USD")).toBe(true);
    expect(isCreditPackPayment(1, "usd")).toBe(false);
    expect(isCreditPackPayment(CREDIT_PACK_PRICE_CENTS, "eur")).toBe(false);
  });
});

describe("model selection", () => {
  it("uses the selected model when that key exists", () => {
    const selected = resolveModelSelection({
      ai_model: AI_MODEL_CLAUDE,
      anthropic_api_key: "sk-ant",
      openai_api_key: "sk-openai",
    });
    expect(selected).toEqual({
      status: true,
      model: AI_MODEL_CLAUDE,
      key: "sk-ant",
    });
  });

  it("reports a missing key for the selected model", () => {
    const selected = resolveModelSelection({
      ai_model: AI_MODEL_CLAUDE,
      openai_api_key: "sk-openai",
    });
    expect(selected).toEqual({
      status: false,
      code: RESPONSE_CODE.api_key_not_found,
    });
  });

  it("defaults to gpt when no model is selected", () => {
    const selected = resolveModelSelection({ openai_api_key: "sk-openai" });
    expect(selected).toMatchObject({ status: true, model: AI_MODEL_GPT });
  });

  it("uses the first available key when gpt is absent", () => {
    const selected = resolveModelSelection({ mistral_api_key: "sk-mistral" });
    expect(selected.status).toBe(true);
  });

  it("does not call the platform key from generateResponse", () => {
    const src = readFileSync(
      path.join(root, "src/actions/generateActions.ts"),
      "utf8"
    );
    expect(src).toMatch(/getAuthenticatedUser/);
    expect(src).not.toMatch(/OPENAI_API_KEY/);
    for (const retired of RETIRED_PROVIDER_MODEL_IDS) {
      expect(src).not.toContain(retired);
      expect(PROVIDER_MODEL_IDS["claude-3-5-sonnet"]).not.toBe(retired);
    }
  });
});

describe("links and font size", () => {
  it("allows only http, https, mailto, and tel", () => {
    expect(isSafeLinkHref("https://docushare.ai/docs")).toBe(true);
    expect(isSafeLinkHref("mailto:a@b.co")).toBe(true);
    expect(isSafeLinkHref("tel:+15551212")).toBe(true);
    expect(isSafeLinkHref("javascript:alert(1)")).toBe(false);
    expect(isSafeLinkHref("data:text/html,hi")).toBe(false);
    expect(isSafeLinkHref("//evil.example")).toBe(false);
    expect(isSafeLinkHref("https://ok.example/\u0000")).toBe(false);
  });

  it("allows only toolbar font sizes", () => {
    expect(isAllowedFontSize("12px")).toBe(true);
    expect(isAllowedFontSize("")).toBe(true);
    expect(isAllowedFontSize("12px;color:red")).toBe(false);
    expect(isAllowedFontSize("99px")).toBe(false);
  });
});

describe("documents", () => {
  it("checks owner and share access", () => {
    expect(canReadDocument({ owner: "a", share: [] }, "a")).toBe(true);
    expect(canReadDocument({ owner: "a", share: ["b"] }, "b")).toBe(true);
    expect(canReadDocument({ owner: "a", share: ["b"] }, "c")).toBe(false);
  });

  it("matches an image key inside document content", () => {
    expect(
      contentReferencesImage({ src: "/api/image?image_key=u/file.png" }, "u/file.png")
    ).toBe(true);
    expect(contentReferencesImage("hello", "u/file.png")).toBe(false);
  });

  it("bumps revision only when the base still matches", () => {
    expect(nextRevision(3, 3)).toBe(4);
    expect(nextRevision(undefined, 0)).toBe(1);
    expect(nextRevision(3, 2)).toBeNull();
    expect(nextRevision(1.5, 1)).toBeNull();
  });
});

describe("session policy", () => {
  it("requires a matching origin", () => {
    const headers = new Headers({ origin: "https://docushare.ai" });
    expect(
      isTrustedSessionRequest(headers, "https://docushare.ai/api/auth/session")
    ).toBe(true);
    expect(
      isTrustedSessionRequest(headers, "https://evil.example/api/auth/session")
    ).toBe(false);
  });

  it("rejects cross-site fetches that omit Origin", () => {
    const headers = new Headers({ "sec-fetch-site": "cross-site" });
    expect(
      isTrustedSessionRequest(headers, "https://docushare.ai/api/auth/session")
    ).toBe(false);
  });

  it("stores raw ID tokens only when Admin is not configured", () => {
    expect(acceptsIdTokenSession(false)).toBe(true);
    expect(acceptsIdTokenSession(true)).toBe(false);
  });
});

describe("images", () => {
  it("accepts owner-scoped and legacy keys only", () => {
    expect(
      isSafeImageKey("user_1/11111111-1111-1111-1111-111111111111.png")
    ).toBe(true);
    expect(isSafeImageKey("11111111-1111-1111-1111-111111111111.jpg")).toBe(true);
    expect(isSafeImageKey("../secret.png")).toBe(false);
    expect(isSafeImageKey("user/not-a-uuid.png")).toBe(false);
  });

  it("sniffs magic bytes", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toBe(
      "image/jpeg"
    );
    expect(
      sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe("image/png");
    expect(sniffImageType(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });
});

describe("rules", () => {
  it("stops clients from writing credits, payments, and secrets", () => {
    const rules = readFileSync(path.join(root, "firestore.rules"), "utf8");
    expect(rules).not.toMatch(/resource == null/);
    expect(rules).toMatch(/allow write: if false/);
    expect(rules).toMatch(/match \/secrets\/\{docId\}/);
    expect(rules).toMatch(/match \/private\/\{docId\}/);
    expect(rules).toMatch(/creditsUntouched/);
  });

  it("denies client storage access", () => {
    const rules = readFileSync(path.join(root, "storage.rules"), "utf8");
    expect(rules).toMatch(/allow read, write: if false/);
  });

  it("replaces retired provider model ids", () => {
    const aiRoute = readFileSync(path.join(root, "src/app/api/ai/route.ts"), "utf8");
    const actions = readFileSync(
      path.join(root, "src/actions/generateActions.ts"),
      "utf8"
    );
    for (const retired of RETIRED_PROVIDER_MODEL_IDS) {
      expect(aiRoute).not.toContain(retired);
      expect(actions).not.toContain(retired);
    }
    expect(PROVIDER_MODEL_IDS["gemini-1.5-pro"]).toBe("gemini-2.5-pro");
    expect(PROVIDER_MODEL_IDS["claude-3-5-sonnet"]).toBe("claude-sonnet-5-5");
    expect(aiRoute).toMatch(/resolveStoredModel/);
  });
});
