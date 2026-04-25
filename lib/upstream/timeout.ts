/**
 * Wraps a fetch call in an AbortController-driven timeout.
 *
 * Why a helper: the four upstream clients all share identical timeout
 * mechanics. Centralizing here keeps each client focused on its endpoint
 * and response shape, and gives us a single place to tweak (or instrument)
 * the abort behavior if the spec ever revisits the 2s budget.
 *
 * Behavior:
 *   - Caller passes a `(signal) => Promise<Response>` factory.
 *   - We allocate a fresh AbortController per call, set a setTimeout to
 *     abort it, run the factory, then clear the timer in `finally`.
 *   - On timeout the underlying fetch rejects with an AbortError, which
 *     propagates up unchanged. The orchestrator (lib/profile.ts, item 7)
 *     uses Promise.allSettled to convert these to "data unavailable"
 *     SubScores per PRD US-7.
 */
export async function withTimeout(
  factory: (signal: AbortSignal) => Promise<Response>,
  ms: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await factory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

export const UPSTREAM_TIMEOUT_MS = 2000;
