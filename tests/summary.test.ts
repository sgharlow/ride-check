import { describe, expect, it } from "vitest";
import type { Profile, Recall, SubScore } from "@/lib/types";
import { generateVerdict } from "@/lib/summary";

/**
 * Tests for generateVerdict() — the result-card verdict generator.
 *
 * Covers:
 *   - A-grade output (positive copy)
 *   - F-grade output for the canonical 2007-Civic-shaped fixture, which
 *     drives the demo (mentions "airbag" with committing language)
 *   - F-grade with 3 failed categories where one sub-score is unavailable
 *   - hedge-word linter assertion (no "some" / "may have" / "potentially" /
 *     "might" / "possibly" in any output)
 *   - determinism (same inputs → same string)
 *   - voice policy (no "!", no all-caps words >2 chars, no scare quotes)
 */

const HEDGE_WORDS = ["some", "may have", "potentially", "might", "possibly"];
const ALL_CAPS_3PLUS = /\b[A-Z]{3,}\b/;
const SCARE_QUOTES = /"[^"]*"/;

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

function makeRecall(component: string, n: number): Recall[] {
  const out: Recall[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      component,
      campaignNumber: `CAMP-${component}-${i}`,
      summary: `summary ${i}`,
      receivedDate: "2010-01-01",
    });
  }
  return out;
}

/**
 * 2007 Honda Civic-shape recall list: 6 airbag, 1 brakes, 1 fuel-system,
 * 1 lighting. Matches the live NHTSA shape per docs/spec.md > Key Technical
 * Decisions > "Canonical F-grade demo car".
 */
const CIVIC_RECALLS: Recall[] = [
  ...makeRecall("AIR BAGS:FRONTAL:DRIVER SIDE:INFLATOR MODULE", 6),
  ...makeRecall("SERVICE BRAKES, HYDRAULIC:FOUNDATION COMPONENTS", 1),
  ...makeRecall("FUEL SYSTEM, GASOLINE:STORAGE:TANK ASSEMBLY", 1),
  ...makeRecall("EXTERIOR LIGHTING:HEADLIGHTS", 1),
];

function assertVoicePolicy(text: string): void {
  expect(text).not.toContain("!");
  expect(ALL_CAPS_3PLUS.test(text)).toBe(false);
  expect(SCARE_QUOTES.test(text)).toBe(false);
}

function assertNoHedgeWords(text: string): void {
  const lower = text.toLowerCase();
  for (const w of HEDGE_WORDS) {
    if (w.includes(" ")) {
      expect(lower).not.toContain(w);
    } else {
      const rx = new RegExp(`\\b${w}\\b`);
      expect(rx.test(lower)).toBe(false);
    }
  }
}

describe("generateVerdict", () => {
  describe("A-grade", () => {
    it("renders one positive sentence naming top-scoring categories", () => {
      const subs = fiveAvailable({
        recalls: 100,
        complaints: 90,
        safety: 100,
        emissions: 100,
        ageWear: 85,
      });
      const out = generateVerdict({ letter: "A", subScores: subs, recalls: [] });

      // A-grade is one sentence (one period at end, no second period).
      expect(out.endsWith(".")).toBe(true);
      expect(out.split(/\.\s/).length).toBe(1);

      // Mentions positive descriptors. Top 3 by value (with alphabetic
      // tie-break on the three 100s) are emissions, recalls, safety.
      expect(out).toContain("no open recalls");
      expect(out).toContain("modern Tier 3 emissions controls");
      expect(out).toContain("five-star");

      // Voice + hedge.
      assertNoHedgeWords(out);
      assertVoicePolicy(out);

      // Letter mentioned.
      expect(out).toContain("scores A");
    });

    it("works when only 1-2 sub-scores are available", () => {
      // 3 unavailable would null out composite/letter, but we still want to
      // verify defensive single-input behavior in the renderer's contract.
      const subs: Profile["subScores"] = {
        recalls: avail(100),
        complaints: unavail(),
        safety: unavail(),
        emissions: avail(100),
        ageWear: avail(85),
      };
      const out = generateVerdict({ letter: "A", subScores: subs, recalls: [] });
      assertNoHedgeWords(out);
      assertVoicePolicy(out);
      expect(out).toContain("scores A");
    });
  });

  describe("F-grade — 2007 Civic-shape fixture", () => {
    // 2007 Civic-like at 180k mi, currentYear=2026:
    //   recalls=0, complaints≈44, safety=80, emissions=75, ageWear=26
    // Contributions:
    //   recalls    (100-0)  × 0.25 = 25.0
    //   ageWear    (100-26) × 0.15 = 11.1
    //   complaints (100-44) × 0.15 = 8.4
    //   safety     (100-80) × 0.25 = 5.0
    //   emissions  (100-75) × 0.20 = 5.0
    // Top-3 by contribution: recalls, ageWear, complaints.
    const subs = fiveAvailable({
      recalls: 0,
      complaints: 44,
      safety: 80,
      emissions: 75,
      ageWear: 26,
    });

    it("mentions airbag with committing language", () => {
      const out = generateVerdict({
        letter: "F",
        subScores: subs,
        recalls: CIVIC_RECALLS,
      });
      expect(out.toLowerCase()).toContain("airbag");
      // Commits to a count, not a hedge.
      expect(out).toContain("six unrepaired airbag inflator recalls");
    });

    it("is 1-3 sentences, no exclamation marks, no hedge words", () => {
      const out = generateVerdict({
        letter: "F",
        subScores: subs,
        recalls: CIVIC_RECALLS,
      });
      const sentences = out.split(/\.\s/).filter((s) => s.trim().length > 0);
      expect(sentences.length).toBeGreaterThanOrEqual(1);
      expect(sentences.length).toBeLessThanOrEqual(3);
      assertVoicePolicy(out);
      assertNoHedgeWords(out);
      expect(out).toContain("scores F");
    });

    it("names the top-3-by-contribution categories", () => {
      const out = generateVerdict({
        letter: "F",
        subScores: subs,
        recalls: CIVIC_RECALLS,
      });
      // Top 3 by contribution: recalls, ageWear, complaints.
      // Recalls renders as "unrepaired open recalls" in sentence 1 with the
      // breakdown in sentence 2.
      expect(out).toContain("unrepaired open recalls");
      expect(out).toContain("high age and accumulated mileage");
      expect(out).toContain("heavy load of owner complaints");
    });

    it("renders the recall categories using severity.label, not raw NHTSA strings", () => {
      const out = generateVerdict({
        letter: "F",
        subScores: subs,
        recalls: CIVIC_RECALLS,
      });
      // Plain-English labels appear.
      expect(out).toContain("airbag");
      expect(out).toContain("brakes");
      expect(out).toContain("fuel-system");
      expect(out).toContain("lighting");
      // Raw NHTSA strings do NOT appear.
      expect(out).not.toContain("AIR BAGS:");
      expect(out).not.toContain("SERVICE BRAKES");
      expect(out).not.toContain("INFLATOR MODULE");
    });
  });

  describe("F-grade with 3 failed categories (1 unavailable sub-score)", () => {
    // recalls=0, complaints=20, safety=null, emissions=75, ageWear=10
    // Contributions:
    //   recalls    (100-0)  × 0.25 = 25.0
    //   ageWear    (100-10) × 0.15 = 13.5
    //   complaints (100-20) × 0.15 = 12.0
    //   emissions  (100-75) × 0.20 = 5.0
    // safety unavailable → not in ranking.
    // Top-3 by contribution: recalls, ageWear, complaints.
    const subs: Profile["subScores"] = {
      recalls: avail(0),
      complaints: avail(20),
      safety: unavail("upstream-timeout"),
      emissions: avail(75),
      ageWear: avail(10),
    };

    it("names recalls, ageWear, and complaints — the three available losers", () => {
      const out = generateVerdict({ letter: "F", subScores: subs, recalls: [] });
      expect(out).toContain("unrepaired open recalls");
      expect(out).toContain("high age and accumulated mileage");
      expect(out).toContain("heavy load of owner complaints");
    });

    it("does not mention crash-test scores (safety was unavailable)", () => {
      const out = generateVerdict({ letter: "F", subScores: subs, recalls: [] });
      expect(out).not.toContain("crash-test");
      assertVoicePolicy(out);
      assertNoHedgeWords(out);
    });

    it("does not append a recall breakdown when the recall list is empty", () => {
      const out = generateVerdict({ letter: "F", subScores: subs, recalls: [] });
      expect(out).not.toContain("recall record shows");
    });
  });

  describe("hedge-word linter — exhaustive", () => {
    // Drive the generator across the full A/B/C/D/F grade range and assert
    // the rendered text never contains a banned hedge word.
    const GRADES: Array<"A" | "B" | "C" | "D" | "F"> = ["A", "B", "C", "D", "F"];

    for (const letter of GRADES) {
      it(`grade ${letter} — output contains no hedge words`, () => {
        // Pick sub-score values that bracket the target letter band so the
        // generator picks reasonable phrases.
        const subs = fiveAvailable(
          letter === "A"
            ? { recalls: 100, complaints: 95, safety: 100, emissions: 100, ageWear: 90 }
            : letter === "B"
            ? { recalls: 90, complaints: 80, safety: 80, emissions: 75, ageWear: 70 }
            : letter === "C"
            ? { recalls: 60, complaints: 60, safety: 60, emissions: 75, ageWear: 50 }
            : letter === "D"
            ? { recalls: 40, complaints: 40, safety: 40, emissions: 75, ageWear: 30 }
            : { recalls: 0, complaints: 30, safety: 20, emissions: 25, ageWear: 15 },
        );
        const out = generateVerdict({
          letter,
          subScores: subs,
          recalls: letter === "F" ? CIVIC_RECALLS : [],
        });
        assertNoHedgeWords(out);
      });
    }
  });

  describe("determinism", () => {
    it("returns identical output for identical inputs (A-grade)", () => {
      const subs = fiveAvailable({
        recalls: 100,
        complaints: 90,
        safety: 100,
        emissions: 100,
        ageWear: 85,
      });
      const a = generateVerdict({ letter: "A", subScores: subs, recalls: [] });
      const b = generateVerdict({ letter: "A", subScores: subs, recalls: [] });
      expect(a).toBe(b);
    });

    it("returns identical output for identical inputs (F-grade with recalls)", () => {
      const subs = fiveAvailable({
        recalls: 0,
        complaints: 44,
        safety: 80,
        emissions: 75,
        ageWear: 26,
      });
      const a = generateVerdict({
        letter: "F",
        subScores: subs,
        recalls: CIVIC_RECALLS,
      });
      const b = generateVerdict({
        letter: "F",
        subScores: subs,
        recalls: CIVIC_RECALLS,
      });
      expect(a).toBe(b);
    });

    it("recall category order does not depend on input order", () => {
      const subs = fiveAvailable({
        recalls: 0,
        complaints: 44,
        safety: 80,
        emissions: 75,
        ageWear: 26,
      });
      const reversed = [...CIVIC_RECALLS].reverse();
      const a = generateVerdict({
        letter: "F",
        subScores: subs,
        recalls: CIVIC_RECALLS,
      });
      const b = generateVerdict({
        letter: "F",
        subScores: subs,
        recalls: reversed,
      });
      expect(a).toBe(b);
    });
  });

  describe("voice policy — exhaustive across grades", () => {
    const GRADES: Array<"A" | "B" | "C" | "D" | "F"> = ["A", "B", "C", "D", "F"];
    for (const letter of GRADES) {
      it(`grade ${letter} — no exclamation, no all-caps >2 chars, no scare quotes`, () => {
        const subs = fiveAvailable(
          letter === "A"
            ? { recalls: 100, complaints: 95, safety: 100, emissions: 100, ageWear: 90 }
            : letter === "B"
            ? { recalls: 90, complaints: 80, safety: 80, emissions: 75, ageWear: 70 }
            : letter === "C"
            ? { recalls: 60, complaints: 60, safety: 60, emissions: 75, ageWear: 50 }
            : letter === "D"
            ? { recalls: 40, complaints: 40, safety: 40, emissions: 75, ageWear: 30 }
            : { recalls: 0, complaints: 30, safety: 20, emissions: 25, ageWear: 15 },
        );
        const out = generateVerdict({
          letter,
          subScores: subs,
          recalls: letter === "F" ? CIVIC_RECALLS : [],
        });
        assertVoicePolicy(out);
      });
    }
  });

  describe("B-grade", () => {
    it("renders one sentence with strengths and the weakest sub-score", () => {
      const subs = fiveAvailable({
        recalls: 90,
        complaints: 80,
        safety: 80,
        emissions: 75,
        ageWear: 70,
      });
      const out = generateVerdict({ letter: "B", subScores: subs, recalls: [] });
      expect(out).toContain("scores B");
      assertVoicePolicy(out);
      assertNoHedgeWords(out);
      // One sentence (single period at end).
      expect(out.split(/\.\s/).length).toBe(1);
    });
  });

  describe("recall category counts", () => {
    it("uses plain-English number words for counts 1-9", () => {
      const subs = fiveAvailable({
        recalls: 0,
        complaints: 50,
        safety: 80,
        emissions: 75,
        ageWear: 30,
      });
      const out = generateVerdict({
        letter: "F",
        subScores: subs,
        recalls: makeRecall("AIR BAGS:FRONTAL", 3),
      });
      expect(out).toContain("three unrepaired airbag inflator recalls");
    });

    it("uses digits for counts 10+", () => {
      const subs = fiveAvailable({
        recalls: 0,
        complaints: 50,
        safety: 80,
        emissions: 75,
        ageWear: 30,
      });
      const out = generateVerdict({
        letter: "F",
        subScores: subs,
        recalls: makeRecall("AIR BAGS:FRONTAL", 12),
      });
      expect(out).toContain("12 unrepaired airbag inflator recalls");
    });

    it("singular grammar for count of 1", () => {
      const subs = fiveAvailable({
        recalls: 0,
        complaints: 50,
        safety: 80,
        emissions: 75,
        ageWear: 30,
      });
      const out = generateVerdict({
        letter: "F",
        subScores: subs,
        recalls: makeRecall("AIR BAGS:FRONTAL", 1),
      });
      expect(out).toContain("one unrepaired airbag recall");
    });
  });
});
