import { describe, expect, it } from "vitest";
import { subSafetyScore } from "@/lib/scoring/safety";

describe("subSafetyScore", () => {
  it("null input → null (treated as unavailable)", () => {
    expect(subSafetyScore(null)).toBeNull();
  });

  it("0 stars → null (out of [1..5] range, NCAP returns 'Not Rated' as null)", () => {
    expect(subSafetyScore(0)).toBeNull();
  });

  it("1 star → 20", () => {
    expect(subSafetyScore(1)).toBe(20);
  });

  it("3 stars → 60", () => {
    expect(subSafetyScore(3)).toBe(60);
  });

  it("5 stars → 100 (max)", () => {
    expect(subSafetyScore(5)).toBe(100);
  });

  it("6 stars → null (out of range)", () => {
    expect(subSafetyScore(6)).toBeNull();
  });

  it("decimal stars: 4.5 → 90", () => {
    // Decision per spec: don't enforce integer; return stars * 20.
    expect(subSafetyScore(4.5)).toBe(90);
  });

  it("decimal stars: 2.5 → 50", () => {
    expect(subSafetyScore(2.5)).toBe(50);
  });

  it("negative input → null", () => {
    expect(subSafetyScore(-1)).toBeNull();
  });

  it("NaN → null", () => {
    expect(subSafetyScore(NaN)).toBeNull();
  });
});
