/**
 * Sub-score for the NHTSA Complaints source.
 *
 * Formula (LOCKED per docs/spec.md):
 *   score = max(0, 100 − 20 × log10(count + 1))
 *
 * Negative counts are not a valid input from the upstream API; we throw
 * rather than silently clamp, to surface bugs in the caller.
 */
export function subComplaintsScore(count: number): number {
  if (!Number.isFinite(count)) {
    throw new Error(`subComplaintsScore: count must be finite, got ${count}`);
  }
  if (count < 0) {
    throw new Error(`subComplaintsScore: count must be >= 0, got ${count}`);
  }
  return Math.max(0, 100 - 20 * Math.log10(count + 1));
}
