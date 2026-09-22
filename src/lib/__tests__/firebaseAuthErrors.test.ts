import { describe, expect, it } from "vitest";
import {
  mapFirebaseAuthError,
  getFirebaseAuthErrorCode,
  formatFirebaseAuthErrorForLog,
} from "@/lib/firebaseAuthErrors";

describe("mapFirebaseAuthError", () => {
  it("maps invalid-credential to a friendly message", () => {
    expect(
      mapFirebaseAuthError({
        code: "auth/invalid-credential",
        message: "Firebase: Error (auth/invalid-credential).",
      })
    ).toMatch(/Incorrect email or password/);
  });

  it("maps email-already-in-use", () => {
    expect(
      mapFirebaseAuthError({ code: "auth/email-already-in-use" })
    ).toMatch(/already exists/);
  });

  it("falls back for unknown errors", () => {
    expect(mapFirebaseAuthError({ code: "auth/something-else" })).toMatch(
      /Something went wrong/
    );
  });

  it("extracts codes for logging without Error objects", () => {
    expect(getFirebaseAuthErrorCode({ code: "auth/invalid-email" })).toBe(
      "auth/invalid-email"
    );
    expect(
      formatFirebaseAuthErrorForLog({ code: "auth/invalid-credential" })
    ).toBe("auth/invalid-credential");
  });
});
