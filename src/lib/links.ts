const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/** True for http(s), mailto, and tel links. Rejects javascript: and data:. */
export function isSafeLinkHref(href: unknown): href is string {
  if (typeof href !== "string") return false;
  const trimmed = href.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return false;
  if (trimmed.startsWith("//")) return false;
  if (isAppFileHref(trimmed)) return true;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }

  return ALLOWED_PROTOCOLS.has(url.protocol);
}

/** Same-origin uploaded file. Rejects protocol-relative and parent paths. */
function isAppFileHref(href: string): boolean {
  if (!href.startsWith("/api/image?") || href.includes("..") || href.includes("\\")) {
    return false;
  }
  try {
    const url = new URL(href, "https://docushare.local");
    const key = url.searchParams.get("image_key") ?? "";
    return (
      url.pathname === "/api/image" &&
      key.length > 0 &&
      key.length <= 300 &&
      !key.includes("..")
    );
  } catch {
    return false;
  }
}
