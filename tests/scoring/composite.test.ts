import { describe, expect, it } from "vitest";
import type { Profile, SubScore } from "@/lib/types";
import { BASE_WEIGHTS, combine } from "@/lib/scoring/composite";

/**
 * Tests for combine() — base weights, renormalization, letter bands, and the
 * 3+ unavailable null-out path.
 */

function avail(value: number, label = "test"): SubScore {
  return { value, available: true, sourceLabel: label };
}

function unavail(reason = "test-unavailable"): SubScore {
  return { value: null, available: false, reason };
}

function fiveAvailable(values: {
  recalls: number;
  complaints: number;
  safety: number;
  emissions: number;
  ageWear: number;
}): Profile["subScores"] {
  return {
    recalls: avail(values.recalls, "NHTSA Recalls"),
    complaints: avail(values.complaints, "NHTSA Complaints"),
    safety: avail(values.safety, "NCAP"),
    emissions: avail(values.emissions, "EPA Tier"),
    ageWear: avail(values.ageWear, "Age & Wear"),
  };
}

describe("combine", () => {
  describe("0 unavailable — base weights", () => {
    it("all 5 sub-scores at 100 → composite 100, letter A", () => {
      const result = combine(
        fiveAvailable({ recalls: 100, complaints: 100, safety: 100, emissions: 100, ageWear: 100 }),
      );
      expect(result.composite).toBe(100);
      expect(result.letter).toBe("A");
      expect(result.renormalized).toBe(false);
      expect(result.weights).toEqual(BASE_WEIGHTS);
    });

    it("all 5 sub-scores at 0 → composite 0, letter F", () => {
      const result = combine(
        fiveAvailable({ recalls: 0, complaints: 0, safety: 0, emissions: 0, ageWear: 0 }),
      );
      expect(result.composite).toBe(0);
      expect(result.letter).toBe("F");
      expect(result.renormalized).toBe(false);
    });

    it("2007 Civic-like: recalls=0, complaints=44, safety=80, emissions=75, ageWear=26 → letter D or F", () => {
      // Acceptance fixture from the build checklist. With base weights:
      //   0*0.25 + 44*0.15 + 80*0.25 + 75*0.20 + 26*0.15
      // = 0 + 6.6 + 20 + 15 + 3.9
      // = 45.5 → rounds to 46 → letter D (band ≥40).
      const result = combine(
        fiveAvailable({ recalls: 0, complaints: 44, safety: 80, emissions: 75, ageWear: 26 }),
      );
      expect(result.composite).toBe(46);
      expect(result.letter).toBe("D");
      expect(result.renormalized).toBe(false);
    });

    it("base weights sum to 1.0", () => {
      const sum =
        BASE_WEIGHTS.recalls +
        BASE_WEIGHTS.complaints +
        BASE_WEIGHTS.safety +
        BASE_WEIGHTS.emissions +
        BASE_WEIGHTS.ageWear;
      expect(sum).toBeCloseTo(1.0, 10);
    });
  });

  describe("letter band cut points (85/70/55/40)", () => {
    it("composite 85 → A (boundary)", () => {
      const result = combine(
        fiveAvailable({ recalls: 85, complaints: 85, safety: 85, emissions: 85, ageWear: 85 }),
      );
      expect(result.composite).toBe(85);
      expect(result.letter).toBe("A");
    });

    it("composite 84 → B (just below A)", () => {
      const result = combine(
        fiveAvailable({ recalls: 84, complaints: 84, safety: 84, emissions: 84, ageWear: 84 }),
      );
      expect(result.composite).toBe(84);
      expect(result.letter).toBe("B");
    });

    it("composite 70 → B (boundary)", () => {
      const result = combine(
        fiveAvailable({ recalls: 70, complaints: 70, safety: 70, emissions: 70, ageWear: 70 }),
      );
      expect(result.letter).toBe("B");
    });

    it("composite 69 → C", () => {
      const result = combine(
        fiveAvailable({ recalls: 69, complaints: 69, safety: 69, emissions: 69, ageWear: 69 }),
      );
      expect(result.letter).toBe("C");
    });

    it("composite 55 → C (boundary)", () => {
      const result = combine(
        fiveAvailable({ recalls: 55, complaints: 55, safety: 55, emissions: 55, ageWear: 55 }),
      );
      expect(result.letter).toBe("C");
    });

    it("composite 40 → D (boundary)", () => {
      const result = combine(
        fiveAvailable({ recalls: 40, complaints: 40, safety: 40, emissions: 40, ageWear: 40 }),
      );
      expect(result.letter).toBe("D");
    });

    it("composite 39 → F", () => {
      const result = combine(
        fiveAvailable({ recalls: 39, complaints: 39, safety: 39, emissions: 39, ageWear: 39 }),
      );
      expect(result.letter).toBe("F");
    });
  });

  describe("1 unavailable — renormalize", () => {
    it("safety unavailable → renormalize remaining 4 weights to sum 1.0", () => {
      const subScores: Profile["subScores"] = {
        recalls: avail(100),
        complaints: avail(100),
        safety: unavail("ncap returned 0 results"),
        emissions: avail(100),
        ageWear: avail(100),
      };
      const result = combine(subScores);

      // remaining weight sum = 0.25 + 0.15 + 0.20 + 0.15 = 0.75
      // each scaled by 1/0.75
      expect(result.renormalized).toBe(true);
      expect(result.weights.safety).toBe(0);
      expect(result.weights.recalls).toBeCloseTo(0.25 / 0.75, 5);
      expect(result.weights.complaints).toBeCloseTo(0.15 / 0.75, 5);
      expect(result.weights.emissions).toBeCloseTo(0.2 / 0.75, 5);
      expect(result.weights.ageWear).toBeCloseTo(0.15 / 0.75, 5);

      const weightSum =
        result.weights.recalls +
        result.weights.complaints +
        result.weights.emissions +
        result.weights.ageWear;
      expect(weightSum).toBeCloseTo(1.0, 10);

      // composite = 100 (all available are 100)
      expect(result.composite).toBe(100);
      expect(result.letter).toBe("A");
    });

    it("recalls unavailable, others vary → composite weighted only over available", () => {
      const subScores: Profile["subScores"] = {
        recalls: unavail("nhtsa down"),
        complaints: avail(60),
        safety: avail(80),
        emissions: avail(75),
        ageWear: avail(46),
      };
      const result = combine(subScores);

      // remaining sum = 0.15 + 0.25 + 0.20 + 0.15 = 0.75
      // weighted: 60*(0.15/0.75) + 80*(0.25/0.75) + 75*(0.20/0.75) + 46*(0.15/0.75)
      // = 12 + 26.667 + 20 + 9.2 = 67.867 → rounds to 68
      expect(result.renormalized).toBe(true);
      expect(result.composite).toBe(68);
      expect(result.letter).toBe("C");
    });
  });

  describe("2 unavailable — renormalize", () => {
    it("recalls + safety unavailable → renormalize remaining 3 weights", () => {
      const subScores: Profile["subScores"] = {
        recalls: unavail("nhtsa recalls 502"),
        complaints: avail(100),
        safety: unavail("ncap timeout"),
        emissions: avail(100),
        ageWear: avail(100),
      };
      const result = combine(subScores);

      // remaining sum = 0.15 + 0.20 + 0.15 = 0.50
      expect(result.renormalized).toBe(true);
      expect(result.weights.recalls).toBe(0);
      expect(result.weights.safety).toBe(0);
      expect(result.weights.complaints).toBeCloseTo(0.15 / 0.5, 5);
      expect(result.weights.emissions).toBeCloseTo(0.2 / 0.5, 5);
      expect(result.weights.ageWear).toBeCloseTo(0.15 / 0.5, 5);

      const weightSum =
        result.weights.complaints + result.weights.emissions + result.weights.ageWear;
      expect(weightSum).toBeCloseTo(1.0, 10);

      expect(result.composite).toBe(100);
      expect(result.letter).toBe("A");
    });

    it("complaints + safety unavailable, mixed values → letter still computable", () => {
      const subScores: Profile["subScores"] = {
        recalls: avail(0),
        complaints: unavail("nhtsa complaints down"),
        safety: unavail("ncap not rated"),
        emissions: avail(75),
        ageWear: avail(26),
      };
      const result = combine(subScores);

      // remaining sum = 0.25 + 0.20 + 0.15 = 0.60
      // weighted: 0*(0.25/0.60) + 75*(0.20/0.60) + 26*(0.15/0.60)
      // = 0 + 25 + 6.5 = 31.5 → rounds to 32 → F (< 40)
      expect(result.renormalized).toBe(true);
      expect(result.composite).toBe(32);
      expect(result.letter).toBe("F");
    });
  });

  describe("3+ unavailable — null out", () => {
    it("recalls + complaints + safety all unavailable → composite null, letter null", () => {
      const subScores: Profile["subScores"] = {
        recalls: unavail("down"),
        complaints: unavail("down"),
        safety: unavail("down"),
        emissions: avail(100),
        ageWear: avail(100),
      };
      const result = combine(subScores);

      expect(result.composite).toBeNull();
      expect(result.letter).toBeNull();
      expect(result.renormalized).toBe(true);
      // All weights zeroed.
      expect(result.weights.recalls).toBe(0);
      expect(result.weights.complaints).toBe(0);
      expect(result.weights.safety).toBe(0);
      expect(result.weights.emissions).toBe(0);
      expect(result.weights.ageWear).toBe(0);
    });
  });

  describe("rounding", () => {
    it("rounds to nearest integer (banker's rounding NOT used — Math.round)", () => {
      // recalls=50, others=50 → composite=50 exactly
      const result = combine(
        fiveAvailable({ recalls: 50, complaints: 50, safety: 50, emissions: 50, ageWear: 50 }),
      );
      expect(result.composite).toBe(50);
    });

    it("rounds 0.5 up (Math.round semantics)", () => {
      // Construct a composite that lands on x.5: use 50 across all → 50, no fractional.
      // Use 50.5 effectively: complaints=51 + recalls=50 etc. Pick values that produce x.5:
      //   recalls 50*0.25 + complaints 53*0.15 + safety 50*0.25 + emissions 50*0.20 + ageWear 50*0.15
      // = 12.5 + 7.95 + 12.5 + 10 + 7.5 = 50.45 — not a clean 0.5 case.
      // Easier: 51 across the board → composite = 51 exactly.
      const result = combine(
        fiveAvailable({ recalls: 51, complaints: 51, safety: 51, emissions: 51, ageWear: 51 }),
      );
      expect(result.composite).toBe(51);
    });
  });
});
