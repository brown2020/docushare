/**
 * Raw Firebase ID tokens are only acceptable when Admin session cookies
 * cannot be issued. When Admin is configured, a failed session cookie
 * must not fall back to storing the ID token.
 */
export function acceptsIdTokenSession(adminReady: boolean): boolean {
  return !adminReady;
}
