import { readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IMPROVE_SYSTEM_PROMPT, improveUserPrompt } from "@/lib/ai/prompts";
import { PROVIDER_MODEL_IDS } from "@/lib/ai/providerModels";
import {
  normalizeShareEmail,
  planShareWrite,
  readShareResult,
} from "@/lib/documents/share";

const { getUserByEmail, getDoc, updateDoc, getAuthenticatedUser } = vi.hoisted(
  () => ({
    getUserByEmail: vi.fn(),
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    getAuthenticatedUser: vi.fn(),
  })
);

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser,
}));

vi.mock("@/firebase/firebaseAdminConfig", () => ({
  isFirebaseAdminReady: () => true,
  auth: { getUserByEmail },
  db: {
    collection: () => ({
      doc: () => ({ get: getDoc, update: updateDoc }),
    }),
  },
}));

import { POST } from "@/app/api/share/route";

const root = path.resolve(__dirname, "../../..");

function shareRequest(email: string, documentId = "doc_123") {
  return new NextRequest("http://localhost/api/share", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, documentId }),
  });
}

describe("share write", () => {
  beforeEach(() => {
    getUserByEmail.mockReset();
    getDoc.mockReset();
    updateDoc.mockReset();
    getAuthenticatedUser.mockReset();
    getAuthenticatedUser.mockResolvedValue({ uid: "owner-1", email: "owner@example.com" });
    updateDoc.mockResolvedValue(undefined);
  });

  it("keeps a plus-address and refuses to treat a failed lookup as success", () => {
    expect(normalizeShareEmail("  Brown2020+AdvDemo@gmail.com ")).toBe(
      "brown2020+advdemo@gmail.com"
    );
    expect(
      readShareResult(true, { status: false, message: "User not found." }).ok
    ).toBe(false);
    expect(readShareResult(true, { status: true }).ok).toBe(true);
  });

  it("does not write or toast success when the account lookup fails", async () => {
    getUserByEmail.mockRejectedValue(
      Object.assign(new Error("missing"), { code: "auth/user-not-found" })
    );
    getDoc.mockResolvedValue({ exists: true, data: () => ({ owner: "owner-1" }) });

    const response = await POST(
      shareRequest("brown2020+advdemo@gmail.com")
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/not found/i);
    expect(updateDoc).not.toHaveBeenCalled();
    expect(readShareResult(response.ok, body).ok).toBe(false);
  });

  it("writes the share only after the recipient and owner checks pass", async () => {
    getUserByEmail.mockResolvedValue({
      uid: "friend-1",
      email: "brown2020+advdemo@gmail.com",
    });
    getDoc.mockResolvedValue({
      exists: true,
      data: () => ({ owner: "owner-1", share: [] }),
    });

    const response = await POST(
      shareRequest("brown2020+advdemo@gmail.com")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: true,
      email: "brown2020+advdemo@gmail.com",
    });
    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(readShareResult(response.ok, body).ok).toBe(true);
    expect(
      planShareWrite({
        callerUid: "owner-1",
        documentId: "doc_123",
        email: "brown2020+advdemo@gmail.com",
        targetUid: "friend-1",
        documentExists: true,
        owner: "owner-1",
      }).ok
    ).toBe(true);
  });

  it("already allows an owner to change share in the dev rules", () => {
    const rules = readFileSync(path.join(root, "firestore.rules"), "utf8");
    expect(rules).toContain(
      "hasOnly(['name', 'content', 'updatedAt', 'share', 'revision'])"
    );
  });
});

describe("improve writing prompt", () => {
  it("corrects grammar without paraphrasing or changing model ids", () => {
    expect(IMPROVE_SYSTEM_PROMPT).toMatch(/grammar/i);
    expect(IMPROVE_SYSTEM_PROMPT).toMatch(/meaning/i);
    expect(IMPROVE_SYSTEM_PROMPT).toMatch(/user's own words/i);
    expect(IMPROVE_SYSTEM_PROMPT).toMatch(/do not paraphrase/i);
    const sample = "this are a sentence what need fix";
    expect(improveUserPrompt(sample)).toContain(sample);

    const route = readFileSync(path.join(root, "src/app/api/ai/route.ts"), "utf8");
    expect(route).toContain("IMPROVE_SYSTEM_PROMPT");
    expect(route).toContain('option === "improve" ? 0');
    expect(route).not.toContain("This sentence needs to be fixed");
    expect(PROVIDER_MODEL_IDS["gpt-4o"]).toBe("gpt-4o");
    expect(PROVIDER_MODEL_IDS["gemini-1.5-pro"]).toBe("gemini-2.5-pro");
    expect(PROVIDER_MODEL_IDS["claude-3-5-sonnet"]).toBe("claude-sonnet-5-5");
  });
});
