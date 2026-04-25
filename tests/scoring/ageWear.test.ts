import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { subAgeWearScore } from "@/lib/scoring/ageWear";

/**
 * Tests for the two-input age & wear formula.
 *
 * The function reads `new Date().getFullYear()` at call time. We pin the
 * clock to 2026-06-15 with `vi.setSystemTime` so the spec's example values
 * (computed against currentYear=2026) are reproducible.
 */
describe("subAgeWearScore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("two-input formula (mileage > 0)", () => {
    it("2007 Civic / 180k mi → 26 (100 - 38 - 36)", () => {
      // age = 19; raw = 100 - 2*19 - 0.0002*180000 = 100 - 38 - 36 = 26
      expect(subAgeWearScore(2007, 180_000)).toBe(26);
    });

    it("2014 Passat / 150k mi → 46 (100 - 24 - 30)", () => {
      // age = 12; raw = 100 - 2*12 - 0.0002*150000 = 100 - 24 - 30 = 46
      expect(subAgeWearScore(2014, 150_000)).toBe(46);
    });

    it("2018 Camry / 60k mi → 72 (100 - 16 - 12)", () => {
      // age = 8; raw = 100 - 2*8 - 0.0002*60000 = 100 - 16 - 12 = 72
      expect(subAgeWearScore(2018, 60_000)).toBe(72);
    });

    it("floors at 0 for very old high-mile vehicles", () => {
      // 1990 Civic / 300k mi: age=36, raw = 100 - 72 - 60 = -32 → 0
      expect(subAgeWearScore(1990, 300_000)).toBe(0);
    });
  });

  describe("year-only fallback (mileage === 0)", () => {
    it("2007 Civic / 0 mi → 43 (year-only fallback: 100 - 3*19)", () => {
      expect(subAgeWearScore(2007, 0)).toBe(43);
    });

    it("2026 / 0 mi → 100 (current year, no age, no wear)", () => {
      expect(subAgeWearScore(2026, 0)).toBe(100);
    });

    it("2018 / 0 mi → 76 (100 - 3*8)", () => {
      expect(subAgeWearScore(2018, 0)).toBe(76);
    });

    it("year-only fallback floors at 0", () => {
      // 1980 / 0 mi: age = 46, raw = 100 - 138 = -38 → 0
      expect(subAgeWearScore(1980, 0)).toBe(0);
    });
  });

  describe("future model years", () => {
    it("2027 / 0 mi clamps to 100 (negative age would push raw above 100)", () => {
      // age = -1; raw = 100 - 3*(-1) = 103; clamp to 100
      expect(subAgeWearScore(2027, 0)).toBe(100);
    });

    it("2027 / 5000 mi clamps to 100", () => {
      // age = -1; raw = 100 - 2*(-1) - 0.0002*5000 = 100 + 2 - 1 = 101; clamp to 100
      expect(subAgeWearScore(2027, 5000)).toBe(100);
    });
  });

  describe("clock dependency", () => {
    it("scores age based on call-time current year", () => {
      // Re-pin to mid-2030 (mid-year avoids UTC-vs-local timezone edge cases
      // around Jan 1 / Dec 31 — getFullYear() is local-time).
      vi.setSystemTime(new Date("2030-06-15T12:00:00Z"));
      // age = 23; raw = 100 - 2*23 - 0.0002*180000 = 100 - 46 - 36 = 18
      expect(subAgeWearScore(2007, 180_000)).toBe(18);
    });
  });
});
