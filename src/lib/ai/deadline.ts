/**
 * Function limit for AI routes. Next.js needs `maxDuration` as a literal in
 * each route file, so `export const maxDuration = 60` must match this value.
 */
export const AI_MAX_DURATION_SECONDS = 60;

/** Time kept back after the model deadline to refund credits and respond. */
export const AI_DEADLINE_HEADROOM_MS = 5_000;

export const AI_REQUEST_BUDGET_MS = AI_MAX_DURATION_SECONDS * 1000 - AI_DEADLINE_HEADROOM_MS;

export function remainingAiBudgetMs(startedAt: number, now: number = Date.now()): number {
  return Math.max(0, AI_REQUEST_BUDGET_MS - Math.max(0, now - startedAt));
}

/** Abort signal that fires when the request's model budget runs out. */
export function aiDeadlineSignal(startedAt: number, now: number = Date.now()): AbortSignal {
  return AbortSignal.timeout(remainingAiBudgetMs(startedAt, now));
}

export function isAiTimeout(error: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth += 1) {
    if (current instanceof Error && (current.name === "TimeoutError" || current.name === "AbortError")) {
      return true;
    }
    current = current instanceof Error ? current.cause : undefined;
  }
  return false;
}
