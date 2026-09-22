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

  it("share API requires authentication", () => {
    const src = readFileSync(
      path.join(root, "src/app/api/share/route.ts"),
      "utf8"
    );
    expect(src).toMatch(/getAuthenticatedUser/);
    expect(src).toMatch(/401/);
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
