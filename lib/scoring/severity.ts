/**
 * Component-severity multipliers for NHTSA recall `Component` strings.
 *
 * NHTSA returns colon-hierarchical strings like
 *   "AIR BAGS:FRONTAL:DRIVER SIDE:INFLATOR MODULE"
 * We prefix-match against the leading segment(s). The table is walked in
 * declared order; the first matching prefix wins. Order matters — for
 * example, `SERVICE BRAKES` must precede any future generic `BRAKES` rule.
 *
 * Multipliers are LOCKED per docs/spec.md > lib/scoring/severity.ts. Do not
 * tune in code without a corresponding spec change.
 */
export const COMPONENT_SEVERITY: Array<{
  prefix: string;
  multiplier: number;
  label: string;
}> = [
  { prefix: "AIR BAGS", multiplier: 2.0, label: "airbag" },
  { prefix: "FUEL SYSTEM", multiplier: 2.0, label: "fuel-system" },
  { prefix: "ENGINE AND ENGINE COOLING", multiplier: 2.0, label: "engine" },
  { prefix: "STEERING", multiplier: 2.0, label: "steering" },
  { prefix: "SERVICE BRAKES", multiplier: 2.0, label: "brakes" },
  { prefix: "POWER TRAIN", multiplier: 1.5, label: "powertrain" },
  { prefix: "ELECTRICAL SYSTEM", multiplier: 1.5, label: "electrical" },
  { prefix: "EXTERIOR LIGHTING", multiplier: 1.0, label: "lighting" },
  { prefix: "SUSPENSION", multiplier: 1.0, label: "suspension" },
  // default 1.0 for anything not matched (handled in severity()/categoryLabel())
];

/**
 * Returns the severity multiplier for an NHTSA component string.
 * Walks COMPONENT_SEVERITY in order and returns the first matching prefix's
 * multiplier, or 1.0 if no entry matches.
 *
 * Match rule: the component string must start with the prefix. We match on
 * the raw uppercase string NHTSA returns; we do not re-case the input.
 */
export function severity(componentString: string): number {
  if (!componentString) return 1.0;
  for (const entry of COMPONENT_SEVERITY) {
    if (componentString.startsWith(entry.prefix)) {
      return entry.multiplier;
    }
  }
  return 1.0;
}

/**
 * Returns the plain-English label for an NHTSA component string, used by
 * lib/summary.ts when naming the recall categories that drove a verdict.
 *
 * Returns "other" if no prefix matches, mirroring the default-1.0 behavior
 * of severity().
 */
export function categoryLabel(componentString: string): string {
  if (!componentString) return "other";
  for (const entry of COMPONENT_SEVERITY) {
    if (componentString.startsWith(entry.prefix)) {
      return entry.label;
    }
  }
  return "other";
}
