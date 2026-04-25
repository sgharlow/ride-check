import type { Profile } from "@/lib/types";

/**
 * Keys of the five sub-scores in `Profile.subScores`. Defined here (the only
 * place renormalization weights are referenced) rather than in lib/types.ts
 * so the type follows the formula's home.
 */
export type SubScoreKey = "recalls" | "complaints" | "safety" | "emissions" | "ageWear";

/**
 * Base weights — LOCKED per docs/spec.md > lib/scoring/composite.ts and
 * RideCheck_Hackathon_Spec_v0.md > §4.4. Sum to 1.0.
 */
export const BASE_WEIGHTS: Record<SubScoreKey, number> = {
  recalls: 0.25,
  complaints: 0.15,
  safety: 0.25,
  emissions: 0.2,
  ageWear: 0.15,
};

const SUB_SCORE_KEYS: ReadonlyArray<SubScoreKey> = [
  "recalls",
  "complaints",
  "safety",
  "emissions",
  "ageWear",
];

/**
 * Letter band lookup for a numeric composite. Cut points LOCKED per
 * docs/spec.md > lib/scoring/composite.ts.
 */
function letterFor(composite: number): "A" | "B" | "C" | "D" | "F" {
  if (composite >= 85) return "A";
  if (composite >= 70) return "B";
  if (composite >= 55) return "C";
  if (composite >= 40) return "D";
  return "F";
}

export type CombineResult = {
  composite: number | null;
  letter: "A" | "B" | "C" | "D" | "F" | null;
  weights: Record<SubScoreKey, number>;
  renormalized: boolean;
};

/**
 * Combine the five sub-scores into a composite + letter grade.
 *
 * Per docs/spec.md > lib/scoring/composite.ts and prd.md > Cross-cutting > US-7:
 *   - 0 unavailable → use BASE_WEIGHTS, renormalized: false.
 *   - 1 or 2 unavailable → drop their weights, divide remaining weights by
 *     their new sum so they total 1.0, renormalized: true.
 *   - 3 or more unavailable → return composite/letter null, all weights 0,
 *     renormalized: true.
 *
 * `emissions` and `ageWear` are always available per type definitions
 * (locally computed); only recalls/complaints/safety can be unavailable.
 *
 * The composite is rounded to the nearest integer. Letter is derived from
 * the rounded composite via the locked 85/70/55/40 cut points.
 */
export function combine(subScores: Profile["subScores"]): CombineResult {
  // Determine which sub-scores are available.
  const availability: Record<SubScoreKey, boolean> = {
    recalls: subScores.recalls.available,
    complaints: subScores.complaints.available,
    safety: subScores.safety.available,
    emissions: subScores.emissions.available,
    ageWear: subScores.ageWear.available,
  };

  const unavailableCount = SUB_SCORE_KEYS.filter((k) => !availability[k]).length;

  // 3+ unavailable: not enough data, no composite or letter.
  if (unavailableCount >= 3) {
    return {
      composite: null,
      letter: null,
      weights: {
        recalls: 0,
        complaints: 0,
        safety: 0,
        emissions: 0,
        ageWear: 0,
      },
      renormalized: true,
    };
  }

  // Build the active weight map. If all 5 are available, use base weights.
  // If 1 or 2 are unavailable, drop them and renormalize the rest to sum 1.
  const renormalized = unavailableCount > 0;
  let weights: Record<SubScoreKey, number>;

  if (!renormalized) {
    weights = { ...BASE_WEIGHTS };
  } else {
    let remainingSum = 0;
    for (const k of SUB_SCORE_KEYS) {
      if (availability[k]) remainingSum += BASE_WEIGHTS[k];
    }
    weights = {
      recalls: 0,
      complaints: 0,
      safety: 0,
      emissions: 0,
      ageWear: 0,
    };
    for (const k of SUB_SCORE_KEYS) {
      if (availability[k]) {
        weights[k] = BASE_WEIGHTS[k] / remainingSum;
      }
    }
  }

  // Compute the weighted composite over available sub-scores.
  let composite = 0;
  for (const k of SUB_SCORE_KEYS) {
    const ss = subScores[k];
    if (ss.available) {
      composite += ss.value * weights[k];
    }
  }

  const rounded = Math.round(composite);
  return {
    composite: rounded,
    letter: letterFor(rounded),
    weights,
    renormalized,
  };
}
