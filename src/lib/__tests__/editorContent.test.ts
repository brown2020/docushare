import { describe, expect, it } from "vitest";
import {
  EMPTY_DOC_JSON,
  isValidEditorContent,
  needsContentRepair,
  normalizeEditorContent,
} from "@/lib/editorContent";

describe("editorContent", () => {
  it("rejects empty object", () => {
    expect(isValidEditorContent({})).toBe(false);
    expect(needsContentRepair({})).toBe(true);
    expect(normalizeEditorContent({})).toEqual(EMPTY_DOC_JSON);
  });

  it("rejects null/undefined/non-objects", () => {
    expect(normalizeEditorContent(null)).toEqual(EMPTY_DOC_JSON);
    expect(normalizeEditorContent(undefined)).toEqual(EMPTY_DOC_JSON);
    expect(normalizeEditorContent(42)).toEqual(EMPTY_DOC_JSON);
  });

  it("accepts valid doc json and strings", () => {
    const doc = { type: "doc", content: [{ type: "paragraph", content: [] }] };
    expect(isValidEditorContent(doc)).toBe(true);
    expect(normalizeEditorContent(doc)).toEqual(doc);
    expect(normalizeEditorContent("")).toBe("");
    expect(normalizeEditorContent("# hi")).toBe("# hi");
  });

  it("repairs doc missing content array", () => {
    expect(normalizeEditorContent({ type: "doc" })).toEqual({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
  });
});
