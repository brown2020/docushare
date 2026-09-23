import { describe, expect, it } from "vitest";
import {
  formatFirebaseErrorForLog,
  formatFirebaseErrorForToast,
  getFirebaseErrorCode,
} from "@/lib/firebaseErrorCode";

describe("firebaseErrorCode", () => {
  it("extracts code strings", () => {
    expect(getFirebaseErrorCode({ code: "permission-denied" })).toBe(
      "permission-denied"
    );
  });

  it("formats toast with code", () => {
    expect(
      formatFirebaseErrorForToast(
        { code: "permission-denied" },
        "Something went wrong."
      )
    ).toBe("Something went wrong. (permission-denied)");
  });

  it("logs code not Error object", () => {
    expect(
      formatFirebaseErrorForLog({ code: "firestore/permission-denied" })
    ).toBe("firestore/permission-denied");
  });
});
