import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { absoluteApiUrl } from "@/lib/baseUrl";

/**
 * Tests for the three-branch resolver in lib/baseUrl.ts.
 *
 * We use `vi.stubEnv` for each variable we need to control. `vi.unstubAllEnvs`
 * in afterEach restores the original `process.env` between tests so leakage
 * from earlier tests can't mask a regression.
 */
describe("absoluteApiUrl", () => {
  beforeEach(() => {
    // Start every test from a clean slate by explicitly clearing every env var
    // the resolver looks at. `stubEnv("X", undefined)` would be ideal but Vitest
    // 1.x types it as string-only, so we stub each to empty and rely on the
    // resolver's truthiness checks.
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("BASE_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("branch 1: production", () => {
    it("uses VERCEL_PROJECT_PRODUCTION_URL when VERCEL_ENV === 'production'", () => {
      vi.stubEnv("VERCEL_ENV", "production");
      vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "ride-check.vercel.app");
      // Even if VERCEL_URL is set, production branch takes priority.
      vi.stubEnv("VERCEL_URL", "ride-check-deadbeef.vercel.app");

      expect(absoluteApiUrl("/api/profile")).toBe("https://ride-check.vercel.app/api/profile");
    });

    it("preserves query strings in the path", () => {
      vi.stubEnv("VERCEL_ENV", "production");
      vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "ride-check.vercel.app");

      expect(absoluteApiUrl("/api/profile?year=2007&make=Honda")).toBe(
        "https://ride-check.vercel.app/api/profile?year=2007&make=Honda",
      );
    });
  });

  describe("branch 2: preview", () => {
    it("uses VERCEL_URL when VERCEL_ENV is set but not 'production'", () => {
      vi.stubEnv("VERCEL_ENV", "preview");
      vi.stubEnv("VERCEL_URL", "ride-check-git-feature-x.vercel.app");

      expect(absoluteApiUrl("/api/models")).toBe(
        "https://ride-check-git-feature-x.vercel.app/api/models",
      );
    });

    it("uses VERCEL_URL when VERCEL_ENV is unset but VERCEL_URL is set", () => {
      vi.stubEnv("VERCEL_URL", "ride-check-deadbeef.vercel.app");

      expect(absoluteApiUrl("/api/profile")).toBe(
        "https://ride-check-deadbeef.vercel.app/api/profile",
      );
    });
  });

  describe("branch 3: local", () => {
    it("uses BASE_URL when set and no Vercel vars are present", () => {
      vi.stubEnv("BASE_URL", "http://localhost:4000");

      expect(absoluteApiUrl("/api/profile")).toBe("http://localhost:4000/api/profile");
    });

    it("falls through to http://localhost:3000 when BASE_URL is empty", () => {
      // Already cleared in beforeEach; just confirm the default.
      expect(absoluteApiUrl("/api/profile")).toBe("http://localhost:3000/api/profile");
    });

    it("falls through to http://localhost:3000 when BASE_URL is undefined", () => {
      // Vitest's stubEnv("BASE_URL", "") leaves it as empty string, which is
      // falsy under `||`. Re-stub explicitly to confirm undefined handling.
      vi.stubEnv("BASE_URL", "");
      expect(absoluteApiUrl("/api/profile")).toBe("http://localhost:3000/api/profile");
    });

    it("prepends a slash when the path is missing one", () => {
      vi.stubEnv("BASE_URL", "http://localhost:3000");
      expect(absoluteApiUrl("api/profile")).toBe("http://localhost:3000/api/profile");
    });
  });
});
