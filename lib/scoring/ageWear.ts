/**
 * Sub-score for vehicle age & wear.
 *
 * Two-input formula (LOCKED per docs/spec.md > lib/scoring/ageWear.ts):
 *   age = currentYear − year
 *   if mileage === 0  →  score = max(0, 100 − 3 × age)   (year-only fallback)
 *   else              →  score = max(0, 100 − 2 × age − 0.0002 × mileage)
 *
 * The mileage = 0 branch implements the form's "user did not provide" signal
 * per prd.md > Entering a Vehicle > US-1a.
 *
 * `currentYear` is read at call time from `new Date().getFullYear()` so the
 * function ages with the calendar — a 2007 vehicle scores lower in 2027 than
 * in 2026, automatically.
 *
 * Edge case — future model years: NHTSA accepts up to currentYear + 1 (next
 * model year). For year > currentYear, age goes negative, which would push
 * the raw formula above 100. We clamp the final score to [0, 100] to avoid
 * leaking out-of-range values into the composite.
 */
export function subAgeWearScore(year: number, mileage: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  let raw: number;
  if (mileage === 0) {
    raw = 100 - 3 * age;
  } else {
    raw = 100 - 2 * age - 0.0002 * mileage;
  }
  return Math.min(100, Math.max(0, raw));
}
