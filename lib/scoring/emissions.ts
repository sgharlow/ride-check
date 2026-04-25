/**
 * Sub-score for the locally-computed EPA emissions tier.
 *
 * Lookup table (LOCKED per docs/spec.md > lib/scoring/emissions.ts):
 *   year ≥ 2017          → 100 (Tier 3)
 *   2004 ≤ year ≤ 2016   → 75  (Tier 2)
 *   1994 ≤ year ≤ 2003   → 50  (Tier 1)
 *   year < 1994          → 25  (Tier 0)
 *
 * Always available — derived locally from the model year, never fetched.
 */
export function subEmissionsScore(year: number): number {
  if (year >= 2017) return 100;
  if (year >= 2004) return 75;
  if (year >= 1994) return 50;
  return 25;
}
