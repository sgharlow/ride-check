import { describe, expect, it } from "vitest";
import { decodeQuery, encodeQuery, slugify } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and replaces spaces with underscores", () => {
    expect(slugify("Honda Civic")).toBe("honda civic".replace(/\s+/g, "_"));
    expect(slugify("Land Rover")).toBe("land_rover");
    expect(slugify("Alfa Romeo")).toBe("alfa_romeo");
  });

  it("passes hyphens through untouched", () => {
    expect(slugify("Mercedes-Benz")).toBe("mercedes-benz");
    expect(slugify("Rolls-Royce")).toBe("rolls-royce");
  });

  it("collapses runs of whitespace into a single underscore", () => {
    expect(slugify("Aston   Martin")).toBe("aston_martin");
  });
});

describe("encodeQuery", () => {
  it("builds year-make-model with slugified make and model", () => {
    expect(encodeQuery({ year: 2007, make: "Honda", model: "Civic" })).toBe("2007-honda-civic");
  });

  it("encodes hyphenated make as-is", () => {
    expect(encodeQuery({ year: 2015, make: "Mercedes-Benz", model: "C300" })).toBe(
      "2015-mercedes-benz-c300",
    );
  });

  it("encodes spaced make with underscore", () => {
    expect(encodeQuery({ year: 2018, make: "Land Rover", model: "Discovery" })).toBe(
      "2018-land_rover-discovery",
    );
  });

  it("encodes spaced model with underscore", () => {
    expect(encodeQuery({ year: 2014, make: "Mercedes-Benz", model: "C Class" })).toBe(
      "2014-mercedes-benz-c_class",
    );
  });

  it("encodes spaced make-and-model combinations", () => {
    expect(encodeQuery({ year: 2020, make: "Alfa Romeo", model: "Giulia" })).toBe(
      "2020-alfa_romeo-giulia",
    );
  });
});

describe("decodeQuery", () => {
  it("decodes the simple Honda Civic example from the spec", () => {
    expect(decodeQuery("2007-honda-civic")).toEqual({
      year: 2007,
      make: "Honda",
      model: "Civic",
    });
  });

  it("decodes Mercedes-Benz greedily (not Mercedes)", () => {
    // "mercedes" is not in TOP_50_MAKES; the decoder must match the full
    // hyphenated slug "mercedes-benz" before any false-positive shorter prefix.
    // Model is title-cased on decode (slugify is lossy for case).
    expect(decodeQuery("2015-mercedes-benz-c300")).toEqual({
      year: 2015,
      make: "Mercedes-Benz",
      model: "C300",
    });
  });

  it("decodes Land Rover with underscore back to display case", () => {
    expect(decodeQuery("2018-land_rover-discovery")).toEqual({
      year: 2018,
      make: "Land Rover",
      model: "Discovery",
    });
  });

  it("decodes Alfa Romeo correctly", () => {
    expect(decodeQuery("2020-alfa_romeo-giulia")).toEqual({
      year: 2020,
      make: "Alfa Romeo",
      model: "Giulia",
    });
  });

  it("decodes models with spaces (underscore-encoded) and title-cases each word", () => {
    const decoded = decodeQuery("2014-mercedes-benz-c_class");
    expect(decoded).toEqual({
      year: 2014,
      make: "Mercedes-Benz",
      model: "C Class",
    });
  });

  it("returns null for unknown make (Frod is not in TOP_50_MAKES)", () => {
    expect(decodeQuery("2008-frod-f150")).toBeNull();
  });

  it("returns null for year above currentYear+1", () => {
    expect(decodeQuery("9999-honda-civic")).toBeNull();
  });

  it("returns null for year below 1981", () => {
    expect(decodeQuery("1980-honda-civic")).toBeNull();
  });

  it("returns null for empty model", () => {
    expect(decodeQuery("2007-honda-")).toBeNull();
  });

  it("returns null when the slug is just year-make with no model", () => {
    expect(decodeQuery("2007-honda")).toBeNull();
  });

  it("returns null for non-numeric year", () => {
    expect(decodeQuery("abcd-honda-civic")).toBeNull();
  });

  it("returns null for the empty string", () => {
    expect(decodeQuery("")).toBeNull();
  });

  it("round-trips: encode then decode gives back the same year+make+title-cased model", () => {
    const slug = encodeQuery({ year: 2007, make: "Honda", model: "Civic" });
    const decoded = decodeQuery(slug);
    expect(decoded).not.toBeNull();
    expect(decoded?.year).toBe(2007);
    expect(decoded?.make).toBe("Honda");
    expect(decoded?.model).toBe("Civic");
  });

  it("round-trips a multi-word model through underscore encoding", () => {
    const slug = encodeQuery({ year: 2014, make: "Mercedes-Benz", model: "C Class" });
    const decoded = decodeQuery(slug);
    expect(decoded?.year).toBe(2014);
    expect(decoded?.make).toBe("Mercedes-Benz");
    expect(decoded?.model).toBe("C Class");
  });
});
