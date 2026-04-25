import { describe, expect, it } from "vitest";
import { subComplaintsScore } from "@/lib/scoring/complaints";

/**
 * Tests for the log10-based complaints sub-score.
 *
 * Spec example values (each ±1 to allow floating-point):
 *   0 → 100, 10 → 79, 100 → 60, 588 → 44, 1000 → 40
 */
describe("subComplaintsScore", () => {
  it("0 complaints → 100 (max)", () => {
    expect(subComplaintsScore(0)).toBe(100);
  });

  it("1 complaint → ~94 (100 - 20*log10(2) ≈ 93.98)", () => {
    expect(subComplaintsScore(1)).toBeCloseTo(93.98, 1);
  });

  it("10 complaints → ~79 (100 - 20*log10(11) ≈ 79.16)", () => {
    expect(subComplaintsScore(10)).toBeCloseTo(79.16, 1);
  });

  it("100 complaints → ~60 (100 - 20*log10(101) ≈ 59.91)", () => {
    expect(subComplaintsScore(100)).toBeCloseTo(59.91, 1);
  });

  it("588 complaints → ~44 (spec example)", () => {
    // 100 - 20*log10(589) ≈ 100 - 20*2.7701 ≈ 44.6
    expect(subComplaintsScore(588)).toBeCloseTo(44.6, 1);
  });

  it("1000 complaints → ~40 (spec example)", () => {
    // 100 - 20*log10(1001) ≈ 40.0
    expect(subComplaintsScore(1000)).toBeCloseTo(40.0, 1);
  });

  it("never exceeds 100", () => {
    expect(subComplaintsScore(0)).toBeLessThanOrEqual(100);
  });

  it("floors at 0 for very large counts", () => {
    // 100 - 20*log10(10^11 + 1) ≈ -120 → 0
    expect(subComplaintsScore(1e11)).toBe(0);
  });

  it("throws for negative count", () => {
    // Decision: throw rather than silently clamp. A negative complaint count
    // is a caller bug — the upstream API can never legitimately return one.
    expect(() => subComplaintsScore(-1)).toThrow();
    expect(() => subComplaintsScore(-100)).toThrow();
  });

  it("throws for non-finite input", () => {
    expect(() => subComplaintsScore(NaN)).toThrow();
    expect(() => subComplaintsScore(Infinity)).toThrow();
  });
});
