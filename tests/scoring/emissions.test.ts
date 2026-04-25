import { describe, expect, it } from "vitest";
import { subEmissionsScore } from "@/lib/scoring/emissions";

/**
 * Tests for the year-based EPA emissions tier lookup.
 *
 * Tier boundaries (LOCKED per spec):
 *   year ≥ 2017          → 100 (Tier 3)
 *   2004 ≤ year ≤ 2016   → 75  (Tier 2)
 *   1994 ≤ year ≤ 2003   → 50  (Tier 1)
 *   year < 1994          → 25  (Tier 0)
 */
describe("subEmissionsScore", () => {
  it("2026 → 100 (Tier 3)", () => {
    expect(subEmissionsScore(2026)).toBe(100);
  });

  it("2017 → 100 (lower bound of Tier 3)", () => {
    expect(subEmissionsScore(2017)).toBe(100);
  });

  it("2016 → 75 (upper bound of Tier 2)", () => {
    expect(subEmissionsScore(2016)).toBe(75);
  });

  it("2010 → 75 (mid Tier 2)", () => {
    expect(subEmissionsScore(2010)).toBe(75);
  });

  it("2004 → 75 (lower bound of Tier 2)", () => {
    expect(subEmissionsScore(2004)).toBe(75);
  });

  it("2003 → 50 (upper bound of Tier 1)", () => {
    expect(subEmissionsScore(2003)).toBe(50);
  });

  it("1999 → 50 (mid Tier 1)", () => {
    expect(subEmissionsScore(1999)).toBe(50);
  });

  it("1994 → 50 (lower bound of Tier 1)", () => {
    expect(subEmissionsScore(1994)).toBe(50);
  });

  it("1993 → 25 (upper bound of Tier 0)", () => {
    expect(subEmissionsScore(1993)).toBe(25);
  });

  it("1980 → 25 (Tier 0)", () => {
    expect(subEmissionsScore(1980)).toBe(25);
  });
});
