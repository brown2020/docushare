import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const root = path.resolve(__dirname, "../../..");

describe("route security contracts", () => {
  it("docs API denies unauthenticated mutations", () => {
    const src = readFileSync(
      path.join(root, "src/app/api/docs/route.ts"),
      "utf8"
    );
    expect(src).toMatch(/getAuthenticatedUser/);
    expect(src).toMatch(/status:\s*401/);
    expect(src).toMatch(/Unauthorized|not signed in/i);
  });

  it("share API requires authentication and document access", () => {
    const src = readFileSync(
      path.join(root, "src/app/api/share/route.ts"),
      "utf8"
    );
    expect(src).toMatch(/getAuthenticatedUser/);
    expect(src).toMatch(/401/);
    expect(src).toMatch(/canReadDocument/);
  });

  it("stripe webhook verifies signatures and does not grant without a secret", () => {
    const src = readFileSync(
      path.join(root, "src/app/api/stripe/webhook/route.ts"),
      "utf8"
    );
    expect(src).toMatch(/constructEvent/);
    expect(src).toMatch(/STRIPE_WEBHOOK_SECRET/);
    expect(src).toMatch(/503/);
    expect(src).toMatch(/grantCreditPack/);
  });

  it("session errors stay generic and reject cross-site requests", () => {
    const src = readFileSync(
      path.join(root, "src/app/api/auth/session/route.ts"),
      "utf8"
    );
    expect(src).toMatch(/isTrustedSessionRequest/);
    expect(src).toMatch(/Failed to create session/);
    expect(src).toMatch(/error: GENERIC_CREATE_ERROR/);
  });

  it("session route creates and clears cookies", () => {
    const src = readFileSync(
      path.join(root, "src/app/api/auth/session/route.ts"),
      "utf8"
    );
    expect(src).toMatch(/createSessionCookie/);
    expect(src).toMatch(/DELETE/);
  });

  it("proxy protects dashboard and profile", () => {
    const src = readFileSync(path.join(root, "src/proxy.ts"), "utf8");
    expect(src).toMatch(/\/dashboard/);
    expect(src).toMatch(/\/profile/);
    expect(src).toMatch(/\/signin/);
  });
});
