import type { Recall } from "@/lib/types";
import { severity } from "@/lib/scoring/severity";

/**
 * Sub-score for the Recalls source.
 *
 * Formula (LOCKED per docs/spec.md):
 *   score = max(0, 100 − 15 × Σ severity(recall.component))
 *
 * Each recall contributes its component-severity multiplier to the sum;
 * the score floors at 0. An empty recall list returns 100.
 */
export function subRecallScore(recalls: Recall[]): number {
  if (!recalls || recalls.length === 0) return 100;
  let sum = 0;
  for (const r of recalls) {
    sum += severity(r.component);
  }
  return Math.max(0, 100 - 15 * sum);
}
