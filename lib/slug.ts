import { TOP_50_MAKES, type Make } from "@/lib/makes";

/**
 * slugify — lowercase, replace whitespace runs with `_`. Hyphens pass through
 * untouched (spec.md > Library > lib/slug.ts). Keeping `-` as a literal lets
 * "Mercedes-Benz" round-trip without collision against the year/make/model
 * separator.
 */
export function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "_");
}

export type DecodedQuery = { year: number; make: Make; model: string };

/**
 * Pre-computed table of slugified makes, sorted by slug length descending.
 * Length-descending ordering is required because some makes are prefixes of
 * others once slugified (e.g. "Mercedes" is a prefix of "Mercedes-Benz").
 * First-match-wins on the longer slug avoids that false positive.
 */
const SLUGGED_MAKES: ReadonlyArray<{ slug: string; display: Make }> = TOP_50_MAKES
  .map((m) => ({ slug: slugify(m), display: m }))
  .sort((a, b) => b.slug.length - a.slug.length);

export function encodeQuery(input: { year: number; make: string; model: string }): string {
  const { year, make, model } = input;
  return `${year}-${slugify(make)}-${slugify(model)}`;
}

/**
 * titleCaseModel — restore display casing for the model segment after decode.
 *
 * `slugify` is one-way for case (everything is lowercased), so we cannot
 * perfectly recover the original. The acceptance criterion in
 * `/checklist > step-3` requires `decodeQuery("2007-honda-civic").model === "Civic"`,
 * so we title-case each whitespace-separated word: first character uppercased,
 * remaining characters left as-is. This handles:
 *   - "civic" → "Civic"
 *   - "c class" → "C Class"
 *   - "c300" → "C300"  (digits and existing casing past index 0 are preserved)
 *
 * Spec ambiguity (reported in step-3 hand-off): `slug.ts` round-trip is lossy
 * for unconventional model casing (e.g. "iX", "GT-R") — a future
 * encoder/decoder pair could carry casing as a separate slug segment, but the
 * v0 contract is "title-case on decode" because the result page receives the
 * canonical vPIC model name on the live path; the slug-only path only matters
 * for shareable URLs where title-case is the most defensible default.
 */
function titleCaseModel(s: string): string {
  return s
    .split(" ")
    .map((word) => (word.length === 0 ? word : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

/**
 * decodeQuery — parse `YYYY-make-model` slug back into structured form.
 *
 * Algorithm:
 *   1. Split off the leading `YYYY-` segment, validate as integer in
 *      `[1981, currentYear+1]`.
 *   2. Greedy-match the rest against TOP_50_MAKES (length-desc) — first make
 *      whose slug is followed by `-` wins.
 *   3. Whatever remains is the model slug; replace `_` with ` ` to undo the
 *      space-encoding step in `slugify`, then title-case the result so
 *      "civic" → "Civic" per the step-3 acceptance criterion. Return `null`
 *      if the model is empty.
 *
 * Returns `null` on any validation failure.
 */
export function decodeQuery(slug: string): DecodedQuery | null {
  if (typeof slug !== "string" || slug.length === 0) return null;

  const firstDash = slug.indexOf("-");
  if (firstDash <= 0) return null;

  const yearStr = slug.slice(0, firstDash);
  if (!/^\d+$/.test(yearStr)) return null;
  const year = Number.parseInt(yearStr, 10);
  if (!Number.isInteger(year)) return null;

  const currentYear = new Date().getFullYear();
  if (year < 1981 || year > currentYear + 1) return null;

  const rest = slug.slice(firstDash + 1);
  if (rest.length === 0) return null;

  // Greedy-match make: longest slug first.
  for (const { slug: makeSlug, display } of SLUGGED_MAKES) {
    if (rest === makeSlug) {
      // No model left.
      return null;
    }
    if (rest.startsWith(makeSlug + "-")) {
      const modelSlug = rest.slice(makeSlug.length + 1);
      if (modelSlug.length === 0) return null;
      const model = titleCaseModel(modelSlug.replace(/_/g, " "));
      return { year, make: display, model };
    }
  }

  return null;
}
