export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const UPLOAD_EXT = "gif|jpe?g|png|webp|pdf|txt|md|csv|docx";

const NEW_IMAGE_KEY = new RegExp(
  `^[A-Za-z0-9_-]{1,128}/[0-9a-fA-F-]{36}\\.(${UPLOAD_EXT})$`
);

const LEGACY_IMAGE_KEY = new RegExp(`^[0-9a-fA-F-]{36}\\.(${UPLOAD_EXT})$`);

export function isSafeImageKey(imageKey: string): boolean {
  return NEW_IMAGE_KEY.test(imageKey) || LEGACY_IMAGE_KEY.test(imageKey);
}

export function extensionForImageType(contentType: string): string {
  switch (contentType) {
    case "image/gif":
      return ".gif";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/png":
      return ".png";
    default:
      return "";
  }
}

export function contentTypeForImageKey(imageKey: string): string {
  const lower = imageKey.toLowerCase();
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (lower.endsWith(".md")) return "text/markdown; charset=utf-8";
  if (lower.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/octet-stream";
}

/** Detect a real image payload. Client-supplied MIME is not trusted. */
export function sniffImageType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export function isDocumentId(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,200}$/.test(value);
}
