import { describe, expect, it } from "vitest";
import { COMPONENT_SEVERITY, categoryLabel, severity } from "@/lib/scoring/severity";

/**
 * Tests for the COMPONENT_SEVERITY table and the prefix-match helpers.
 *
 * The component strings in this file are real NHTSA `Component` field values
 * observed during /spec research against the live NHTSA Recalls API for the
 * 2007 Honda Civic, 2014 VW Passat, and other sample vehicles.
 */
describe("severity", () => {
  describe("2.0× multipliers", () => {
    it("AIR BAGS prefix → 2.0", () => {
      expect(severity("AIR BAGS:FRONTAL:DRIVER SIDE:INFLATOR MODULE")).toBe(2.0);
      expect(severity("AIR BAGS:FRONTAL:PASSENGER SIDE:INFLATOR MODULE")).toBe(2.0);
      expect(severity("AIR BAGS")).toBe(2.0);
    });

    it("FUEL SYSTEM prefix → 2.0", () => {
      expect(severity("FUEL SYSTEM, OTHER:STORAGE:TANK ASSEMBLY")).toBe(2.0);
      expect(severity("FUEL SYSTEM, GASOLINE")).toBe(2.0);
    });

    it("ENGINE AND ENGINE COOLING prefix → 2.0", () => {
      expect(severity("ENGINE AND ENGINE COOLING:ENGINE:DIESEL")).toBe(2.0);
      expect(severity("ENGINE AND ENGINE COOLING")).toBe(2.0);
    });

    it("STEERING prefix → 2.0", () => {
      expect(severity("STEERING:LINKAGES")).toBe(2.0);
      expect(severity("STEERING")).toBe(2.0);
    });

    it("SERVICE BRAKES prefix → 2.0", () => {
      expect(severity("SERVICE BRAKES, HYDRAULIC:FOUNDATION COMPONENTS:DISC:CALIPER")).toBe(2.0);
      expect(severity("SERVICE BRAKES")).toBe(2.0);
    });
  });

  describe("1.5× multipliers", () => {
    it("POWER TRAIN prefix → 1.5", () => {
      expect(severity("POWER TRAIN:AUTOMATIC TRANSMISSION")).toBe(1.5);
      expect(severity("POWER TRAIN")).toBe(1.5);
    });

    it("ELECTRICAL SYSTEM prefix → 1.5", () => {
      expect(severity("ELECTRICAL SYSTEM:WIRING")).toBe(1.5);
      expect(severity("ELECTRICAL SYSTEM")).toBe(1.5);
    });
  });

  describe("1.0× multipliers (explicit and default)", () => {
    it("EXTERIOR LIGHTING prefix → 1.0", () => {
      expect(severity("EXTERIOR LIGHTING:BRAKE LIGHTS:SWITCH")).toBe(1.0);
    });

    it("SUSPENSION prefix → 1.0", () => {
      expect(severity("SUSPENSION:FRONT")).toBe(1.0);
    });

    it("unknown component → default 1.0", () => {
      expect(severity("VISIBILITY:WINDSHIELD")).toBe(1.0);
      expect(severity("STRUCTURE:BODY")).toBe(1.0);
      expect(severity("SEAT BELTS")).toBe(1.0);
    });

    it("empty string → default 1.0", () => {
      expect(severity("")).toBe(1.0);
    });
  });

  describe("declared-order matters", () => {
    it("SERVICE BRAKES is matched before any future generic BRAKES rule", () => {
      // SERVICE BRAKES appears in the table; severity() must return its 2.0
      // multiplier rather than fall through to default 1.0.
      expect(severity("SERVICE BRAKES, AIR")).toBe(2.0);
      expect(severity("SERVICE BRAKES, HYDRAULIC")).toBe(2.0);
    });
  });

  describe("table integrity", () => {
    it("contains all nine documented entries in spec order", () => {
      const prefixes = COMPONENT_SEVERITY.map((e) => e.prefix);
      expect(prefixes).toEqual([
        "AIR BAGS",
        "FUEL SYSTEM",
        "ENGINE AND ENGINE COOLING",
        "STEERING",
        "SERVICE BRAKES",
        "POWER TRAIN",
        "ELECTRICAL SYSTEM",
        "EXTERIOR LIGHTING",
        "SUSPENSION",
      ]);
    });
  });
});

describe("categoryLabel", () => {
  it("returns the matched entry's label", () => {
    expect(categoryLabel("AIR BAGS:FRONTAL:DRIVER SIDE:INFLATOR MODULE")).toBe("airbag");
    expect(categoryLabel("FUEL SYSTEM, GASOLINE")).toBe("fuel-system");
    expect(categoryLabel("ENGINE AND ENGINE COOLING:ENGINE:DIESEL")).toBe("engine");
    expect(categoryLabel("STEERING:LINKAGES")).toBe("steering");
    expect(categoryLabel("SERVICE BRAKES, HYDRAULIC")).toBe("brakes");
    expect(categoryLabel("POWER TRAIN:AUTOMATIC TRANSMISSION")).toBe("powertrain");
    expect(categoryLabel("ELECTRICAL SYSTEM:WIRING")).toBe("electrical");
    expect(categoryLabel("EXTERIOR LIGHTING:BRAKE LIGHTS:SWITCH")).toBe("lighting");
    expect(categoryLabel("SUSPENSION:FRONT")).toBe("suspension");
  });

  it("returns 'other' for unmatched components", () => {
    expect(categoryLabel("VISIBILITY:WINDSHIELD")).toBe("other");
    expect(categoryLabel("STRUCTURE:BODY")).toBe("other");
    expect(categoryLabel("SEAT BELTS")).toBe("other");
  });

  it("returns 'other' for empty string", () => {
    expect(categoryLabel("")).toBe("other");
  });
});
