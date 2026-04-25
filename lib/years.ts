/**
 * availableYears — returns the descending list of model years offered in the
 * Year dropdown.
 *
 * Spec ref: spec.md > Library > lib/years.ts. Range is `[currentYear+1 .. 1981]`
 * inclusive, descending. `currentYear` is read from `new Date().getFullYear()`
 * at call time (not module load) so unit tests can inject a fake clock.
 */
export function availableYears(): number[] {
  const currentYear = new Date().getFullYear();
  const start = currentYear + 1;
  const end = 1981;
  const out: number[] = [];
  for (let y = start; y >= end; y--) {
    out.push(y);
  }
  return out;
}
