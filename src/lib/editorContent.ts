import type { JSONContent } from "@tiptap/core";

/** Valid empty TipTap/ProseMirror document (never `{}`). */
export const EMPTY_DOC_JSON: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * TipTap rejects `{}` and other non-doc shapes with:
 * RangeError: Unknown node type: undefined
 */
export function isValidEditorContent(value: unknown): value is JSONContent | string {
  if (typeof value === "string") return true;
  if (!isPlainObject(value)) return false;
  if (Object.keys(value).length === 0) return false;
  if (value.type !== "doc") return false;
  // content may be missing/empty array for empty docs — still ok if type is doc
  if ("content" in value && value.content != null && !Array.isArray(value.content)) {
    return false;
  }
  return true;
}

/** Normalize Firestore `content` before setContent. Never returns `{}`. */
export function normalizeEditorContent(value: unknown): JSONContent | string {
  if (isValidEditorContent(value)) {
    if (typeof value === "string") return value;
    // Ensure content array exists
    if (!Array.isArray(value.content)) {
      return { type: "doc", content: [{ type: "paragraph" }] };
    }
    return value;
  }
  return EMPTY_DOC_JSON;
}

export function needsContentRepair(value: unknown): boolean {
  return !isValidEditorContent(value);
}
