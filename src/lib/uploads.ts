import { inflateRawSync } from "node:zlib";
import { extensionForImageType, sniffImageType } from "@/lib/images";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_EXTRACTED_CHARS = 50_000;

export const UNSUPPORTED_UPLOAD_MESSAGE =
  "Unsupported file type. Upload a JPG, PNG, GIF, WEBP, PDF, TXT, MD, CSV, or DOCX file.";

export const FILE_TOO_LARGE_MESSAGE =
  "File is too large. The maximum size is 5 MB.";

export const EMPTY_FILE_MESSAGE = "The file is empty.";

export const UPLOAD_ACCEPT =
  ".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.md,.markdown,.csv,.docx,application/pdf,text/plain";

const TEXT_EXTENSIONS = new Set([".txt", ".md", ".markdown", ".csv"]);
const CLIENT_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".pdf",
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".docx",
]);

export type ClassifiedUpload = {
  contentType: string;
  extension: string;
  kind: "image" | "document";
  text: string;
};

export function extensionOfName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot).toLowerCase();
}

export function displayFileName(name: string, fallback: string): string {
  const base = name.split(/[/\\]/).pop() ?? "";
  const cleaned = base.replace(/[^\w.\- ()[\]]+/g, "").slice(0, 120);
  return cleaned || fallback;
}

/** Client-side check so an unsupported drop is explained before the request. */
export function clientUploadRejection(file: {
  name: string;
  size: number;
}): string | null {
  if (file.size <= 0) return EMPTY_FILE_MESSAGE;
  if (file.size > MAX_UPLOAD_BYTES) return FILE_TOO_LARGE_MESSAGE;
  if (!CLIENT_EXTENSIONS.has(extensionOfName(file.name))) {
    return UNSUPPORTED_UPLOAD_MESSAGE;
  }
  return null;
}

export function classifyUpload(
  bytes: Uint8Array,
  filename: string
): { ok: true; file: ClassifiedUpload } | { ok: false; message: string } {
  if (bytes.length === 0) return { ok: false, message: EMPTY_FILE_MESSAGE };
  if (bytes.length > MAX_UPLOAD_BYTES) {
    return { ok: false, message: FILE_TOO_LARGE_MESSAGE };
  }

  const imageType = sniffImageType(bytes);
  if (imageType) {
    const extension = extensionForImageType(imageType);
    if (!extension) return { ok: false, message: UNSUPPORTED_UPLOAD_MESSAGE };
    return {
      ok: true,
      file: { contentType: imageType, extension, kind: "image", text: "" },
    };
  }

  if (isPdf(bytes)) {
    return {
      ok: true,
      file: {
        contentType: "application/pdf",
        extension: ".pdf",
        kind: "document",
        text: extractPdfText(bytes),
      },
    };
  }

  const extension = extensionOfName(filename);
  if (extension === ".docx") {
    const text = extractDocxText(bytes);
    if (text === null) return { ok: false, message: UNSUPPORTED_UPLOAD_MESSAGE };
    return {
      ok: true,
      file: {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        extension: ".docx",
        kind: "document",
        text,
      },
    };
  }

  if (TEXT_EXTENSIONS.has(extension) && isPlainText(bytes)) {
    const storedExtension = extension === ".markdown" ? ".md" : extension;
    const contentType =
      storedExtension === ".csv"
        ? "text/csv"
        : storedExtension === ".txt"
          ? "text/plain"
          : "text/markdown";
    return {
      ok: true,
      file: {
        contentType,
        extension: storedExtension,
        kind: "document",
        text: decodeUtf8(bytes).slice(0, MAX_EXTRACTED_CHARS),
      },
    };
  }

  return { ok: false, message: UNSUPPORTED_UPLOAD_MESSAGE };
}

export function isPdf(bytes: Uint8Array): boolean {
  const limit = Math.min(bytes.length, 1024);
  for (let i = 0; i <= limit - 4; i++) {
    if (
      bytes[i] === 0x25 &&
      bytes[i + 1] === 0x50 &&
      bytes[i + 2] === 0x44 &&
      bytes[i + 3] === 0x46
    ) {
      return true;
    }
  }
  return false;
}

function isPlainText(bytes: Uint8Array): boolean {
  if (bytes.includes(0)) return false;
  try {
    decodeUtf8(bytes);
  } catch {
    return false;
  }
  let controls = 0;
  for (const byte of bytes) {
    if (byte === 9 || byte === 10 || byte === 13) continue;
    if (byte < 32) controls += 1;
  }
  return controls / bytes.length < 0.02;
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function extractPdfText(bytes: Uint8Array): string {
  const buf = Buffer.from(bytes);
  const pieces: string[] = [];
  let cursor = 0;
  while (cursor < buf.length && pieces.join("").length < MAX_EXTRACTED_CHARS) {
    const start = buf.indexOf("stream", cursor);
    if (start < 0) break;
    let dataStart = start + "stream".length;
    if (buf[dataStart] === 0x0d) dataStart += 1;
    if (buf[dataStart] === 0x0a) dataStart += 1;
    const end = buf.indexOf("endstream", dataStart);
    if (end < 0) break;
    const header = buf
      .subarray(Math.max(0, start - 400), start)
      .toString("latin1");
    let data = buf.subarray(dataStart, end);
    if (data[data.length - 1] === 0x0a) data = data.subarray(0, -1);
    if (data[data.length - 1] === 0x0d) data = data.subarray(0, -1);

    let content: Buffer | null = null;
    if (header.includes("FlateDecode")) {
      try {
        content = inflateRawSync(data);
      } catch {
        content = null;
      }
    } else if (!/\/Filter/.test(header)) {
      content = data;
    }
    if (content) pieces.push(extractPdfOperators(content.toString("latin1")));
    cursor = end + "endstream".length;
  }
  return pieces.join("\n").replace(/\s+\n/g, "\n").trim().slice(0, MAX_EXTRACTED_CHARS);
}

function extractPdfOperators(content: string): string {
  const parts: string[] = [];
  const re = /\((?:\\.|[^\\)])*\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content))) {
    const after = content.slice(
      match.index + match[0].length,
      match.index + match[0].length + 80
    );
    if (!/Tj|TJ|'|"/.test(after)) continue;
    parts.push(decodePdfLiteral(match[0].slice(1, -1)));
  }
  return parts.join(" ");
}

function decodePdfLiteral(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    if (value[i] !== "\\") {
      out += value[i];
      continue;
    }
    const next = value[i + 1];
    if (next === "n") {
      out += "\n";
      i += 1;
    } else if (next === "r") {
      out += "\r";
      i += 1;
    } else if (next === "t") {
      out += "\t";
      i += 1;
    } else if (next === "(" || next === ")" || next === "\\") {
      out += next;
      i += 1;
    } else if (next >= "0" && next <= "7") {
      let octal = next;
      let consumed = 1;
      for (let extra = 1; extra < 3; extra++) {
        const digit = value[i + 1 + extra];
        if (!digit || digit < "0" || digit > "7") break;
        octal += digit;
        consumed += 1;
      }
      out += String.fromCharCode(parseInt(octal, 8));
      i += consumed;
    } else {
      out += next ?? "";
      i += 1;
    }
  }
  return out;
}

export function extractDocxText(bytes: Uint8Array): string | null {
  const xml = readZipEntry(bytes, "word/document.xml");
  if (!xml) return null;
  const source = xml.toString("utf8");
  const text = source
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text.slice(0, MAX_EXTRACTED_CHARS);
}

export function readZipEntry(bytes: Uint8Array, entryName: string): Buffer | null {
  const buf = Buffer.from(bytes);
  const eocd = findEocd(buf);
  if (eocd < 0) return null;
  const count = buf.readUInt16LE(eocd + 10);
  let offset = buf.readUInt32LE(eocd + 16);
  for (let index = 0; index < count; index++) {
    if (offset + 46 > buf.length || buf.readUInt32LE(offset) !== 0x02014b50) {
      return null;
    }
    const method = buf.readUInt16LE(offset + 10);
    const compSize = buf.readUInt32LE(offset + 20);
    const nameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const localOffset = buf.readUInt32LE(offset + 42);
    const name = buf.subarray(offset + 46, offset + 46 + nameLen).toString("utf8");
    if (name === entryName) {
      if (localOffset + 30 > buf.length || buf.readUInt32LE(localOffset) !== 0x04034b50) {
        return null;
      }
      const localNameLen = buf.readUInt16LE(localOffset + 26);
      const localExtraLen = buf.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      const data = buf.subarray(dataStart, dataStart + compSize);
      if (method === 0) return Buffer.from(data);
      if (method === 8) {
        try {
          return inflateRawSync(data);
        } catch {
          return null;
        }
      }
      return null;
    }
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

function findEocd(buf: Buffer): number {
  const min = Math.max(0, buf.length - 22 - 65535);
  for (let index = buf.length - 22; index >= min; index--) {
    if (buf.readUInt32LE(index) === 0x06054b50) return index;
  }
  return -1;
}
