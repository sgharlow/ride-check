import { describe, expect, it } from "vitest";
import type { Recall } from "@/lib/types";
import { subRecallScore } from "@/lib/scoring/recalls";

/**
 * Builds a Recall fixture with the given component string. The other fields
 * aren't used by subRecallScore() but the type requires them.
 */
function recall(component: string, idx: number = 0): Recall {
  return {
    component,
    campaignNumber: `TEST-${idx}`,
    summary: "test recall",
    receivedDate: "2020-01-01",
  };
}

describe("subRecallScore", () => {
  it("empty recall list → 100", () => {
    expect(subRecallScore([])).toBe(100);
  });

  it("two generic 1.0× recalls → 70", () => {
    // sum severities = 1.0 + 1.0 = 2.0; score = 100 - 15*2 = 70
    expect(
      subRecallScore([recall("VISIBILITY:WINDSHIELD", 0), recall("STRUCTURE:BODY", 1)]),
    ).toBe(70);
  });

  it("one airbag recall (2.0×) → 70", () => {
    // sum = 2.0; score = 100 - 30 = 70
    expect(subRecallScore([recall("AIR BAGS:FRONTAL:DRIVER SIDE:INFLATOR MODULE")])).toBe(70);
  });

  it("one powertrain recall (1.5×) → 77.5", () => {
    // sum = 1.5; score = 100 - 22.5 = 77.5
    expect(subRecallScore([recall("POWER TRAIN:AUTOMATIC TRANSMISSION")])).toBeCloseTo(77.5, 5);
  });

  it("2007 Civic spot-check: 6 airbag + 1 brake + 1 fuel + 1 lighting → 0 (floored)", () => {
    // From the spec acceptance criterion. Sum severities:
    //   6 × 2.0 (AIR BAGS)    = 12.0
    //   1 × 2.0 (SERVICE BRAKES) = 2.0
    //   1 × 2.0 (FUEL SYSTEM)    = 2.0
    //   1 × 1.0 (EXTERIOR LIGHTING) = 1.0
    //   total = 17.0
    // raw score = 100 - 15*17 = 100 - 255 = -155 → floors at 0
    const fixture: Recall[] = [
      recall("AIR BAGS:FRONTAL:PASSENGER SIDE:INFLATOR MODULE", 1),
      recall("AIR BAGS:FRONTAL:PASSENGER SIDE:INFLATOR MODULE", 2),
      recall("AIR BAGS:FRONTAL:PASSENGER SIDE:INFLATOR MODULE", 3),
      recall("AIR BAGS:FRONTAL:PASSENGER SIDE:INFLATOR MODULE", 4),
      recall("AIR BAGS:FRONTAL:PASSENGER SIDE:INFLATOR MODULE", 5),
      recall("AIR BAGS:FRONTAL:PASSENGER SIDE:INFLATOR MODULE", 6),
      recall("SERVICE BRAKES, HYDRAULIC:FOUNDATION COMPONENTS:DISC:CALIPER", 7),
      recall("FUEL SYSTEM, OTHER:STORAGE:TANK ASSEMBLY", 8),
      recall("EXTERIOR LIGHTING:BRAKE LIGHTS:SWITCH", 9),
    ];
    expect(subRecallScore(fixture)).toBe(0);
  });

  it("score floors at 0 for arbitrarily large sums", () => {
    // 20 airbag recalls → sum = 40 → raw = 100 - 600 = -500 → 0
    const many: Recall[] = Array.from({ length: 20 }, (_, i) =>
      recall("AIR BAGS:FRONTAL:DRIVER SIDE:INFLATOR MODULE", i),
    );
    expect(subRecallScore(many)).toBe(0);
  });

  it("score never exceeds 100 for empty list", () => {
    expect(subRecallScore([])).toBe(100);
  });

  it("mixed severities sum correctly (spec example)", () => {
    // From spec: severities [2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 1.5, 1.5, 1.0, 1.0]
    // → sum = 16; raw = 100 - 240 = -140 → 0
    const fixture: Recall[] = [
      recall("AIR BAGS", 1),
      recall("FUEL SYSTEM", 2),
      recall("ENGINE AND ENGINE COOLING", 3),
      recall("STEERING", 4),
      recall("SERVICE BRAKES", 5),
      recall("AIR BAGS", 6),
      recall("POWER TRAIN", 7),
      recall("ELECTRICAL SYSTEM", 8),
      recall("EXTERIOR LIGHTING", 9),
      recall("SUSPENSION", 10),
    ];
    expect(subRecallScore(fixture)).toBe(0);
  });
});
