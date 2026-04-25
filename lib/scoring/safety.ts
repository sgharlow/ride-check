/**
 * Sub-score for the NHTSA NCAP overall safety rating.
 *
 * Formula (LOCKED per docs/spec.md):
 *   stars × 20 if stars ∈ [1..5], else null
 *
 * Decimal stars (e.g., 4.5) are treated as valid — NHTSA itself returns
 * integer overall ratings, but the formula has no integer constraint and
 * returning 90 for 4.5 is correct under "stars × 20".
 *
 * Returns null for null input, < 1, or > 5 (treated as unavailable so the
 * composite renormalizes).
 */
export function subSafetyScore(stars: number | null): number | null {
  if (stars === null || stars === undefined) return null;
  if (!Number.isFinite(stars)) return null;
  if (stars < 1 || stars > 5) return null;
  return stars * 20;
}
