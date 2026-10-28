/** Same-origin check for cookie-setting auth routes. */
export function isTrustedSessionRequest(
  headers: Headers,
  requestUrl: string
): boolean {
  let expected: string;
  try {
    expected = new URL(requestUrl).origin;
  } catch {
    return false;
  }

  const origin = headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin === expected;
    } catch {
      return false;
    }
  }

  const site = headers.get("sec-fetch-site");
  if (!site || site === "same-origin" || site === "none") return true;
  return false;
}
