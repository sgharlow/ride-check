/**
 * Verdict generator for the result card.
 *
 * Implements docs/prd.md > Reading the Verdict > US-3 and
 * docs/spec.md > Library (lib/) > lib/summary.ts.
 *
 * Algorithm:
 *   1. For each available sub-score, compute its contribution to grade
 *      reduction = (100 - value) * BASE_WEIGHTS[key]. (Use BASE_WEIGHTS even
 *      when renormalized — the ranking is about absolute pull-down, not
 *      normalized contribution.)
 *   2. Sort descending by contribution. Tie-break: alphabetic by sub-score
 *      key (deterministic).
 *   3. Grades C/D/F: name the top 3 sub-scores by contribution.
 *   4. Grades A/B: name the top 1-3 sub-scores by VALUE (highest scoring),
 *      with positive copy. Tie-break: alphabetic by key.
 *
 * Voice policy enforced in-line:
 *   - No hedge words ("some", "may have", "potentially", "might", "possibly").
 *   - No exclamation marks.
 *   - No all-caps words longer than 2 characters.
 *   - No straight-quoted phrases (scare quotes).
 *
 * In dev (NODE_ENV !== 'production'), a violation throws so the build catches
 * it. In prod, a violation falls back to a deterministic template.
 *
 * Deterministic: same (letter, subScores, recalls) tuple always produces the
 * same string. No Math.random, no Date.now, no order-dependent iteration.
 */
import type { Profile, Recall } from "@/lib/types";
import { BASE_WEIGHTS, type SubScoreKey } from "@/lib/scoring/composite";
import { categoryLabel } from "@/lib/scoring/severity";

// All five sub-score keys, in alphabetic order. Used as the canonical
// tie-break ordering for the contribution and value sorts.
const ALL_KEYS: ReadonlyArray<SubScoreKey> = [
  "ageWear",
  "complaints",
  "emissions",
  "recalls",
  "safety",
];

// Hedge words rejected by the linter. Lower-case match against lower-cased
// output. "may have" is checked as a phrase.
const HEDGE_WORDS = ["some", "may have", "potentially", "might", "possibly"];

// Plain-English number names for small recall counts. 10+ fall back to digits.
const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

function numberWord(n: number): string {
  if (n >= 0 && n < NUMBER_WORDS.length) return NUMBER_WORDS[n];
  return String(n);
}

/**
 * Throws if the rendered text violates the voice policy or contains a hedge
 * word. Caller catches in production and substitutes the deterministic
 * fallback template.
 */
function lintVerdict(text: string): void {
  const lower = text.toLowerCase();
  for (const w of HEDGE_WORDS) {
    // Word-boundary check for single-word hedges so we don't false-flag
    // benign substrings (e.g. "some" inside "something" never appears in
    // our copy, but defend in depth). For "may have" we just substring-check.
    if (w.includes(" ")) {
      if (lower.includes(w)) {
        throw new Error(`Hedge word '${w}' detected in verdict: ${text}`);
      }
    } else {
      const rx = new RegExp(`\\b${w}\\b`);
      if (rx.test(lower)) {
        throw new Error(`Hedge word '${w}' detected in verdict: ${text}`);
      }
    }
  }
  if (text.includes("!")) {
    throw new Error(`Exclamation mark in verdict: ${text}`);
  }
  if (/\b[A-Z]{3,}\b/.test(text)) {
    throw new Error(`All-caps word in verdict: ${text}`);
  }
  if (/"[^"]*"/.test(text)) {
    throw new Error(`Scare quotes in verdict: ${text}`);
  }
}

/**
 * Deterministic prod fallback when the primary template trips the linter.
 * Hard-coded copy, no inputs other than the letter grade.
 */
function fallbackVerdict(letter: "A" | "B" | "C" | "D" | "F"): string {
  return `This vehicle scores ${letter}. See the score breakdown below for the inputs.`;
}

/**
 * Positive descriptor for a sub-score, used in A/B-grade verdicts. Phrasing
 * is chosen to avoid hedge words and quotes and to commit to the data.
 */
function positivePhrase(key: SubScoreKey, value: number): string {
  switch (key) {
    case "recalls":
      return value === 100 ? "no open recalls" : "a light recall record";
    case "complaints":
      return value >= 80 ? "few owner complaints on file" : "a moderate complaint count";
    case "safety":
      return value === 100
        ? "a five-star crash-test rating"
        : "strong crash-test scores";
    case "emissions":
      return value === 100
        ? "modern Tier 3 emissions controls"
        : "Tier 2 emissions controls";
    case "ageWear":
      return value >= 80 ? "low age and wear" : "moderate age and wear";
  }
}

/**
 * Negative descriptor for a sub-score, used in C/D/F verdicts. Plain-English,
 * committing language. Does NOT include the recalls breakdown — that is
 * rendered separately as a second sentence when recalls drives the verdict.
 */
function negativePhrase(key: SubScoreKey): string {
  switch (key) {
    case "recalls":
      return "unrepaired open recalls";
    case "complaints":
      return "a heavy load of owner complaints";
    case "safety":
      return "weak crash-test scores";
    case "emissions":
      return "older-tier emissions controls";
    case "ageWear":
      return "high age and accumulated mileage";
  }
}

/**
 * Joins a list of phrases with commas and a final " and ".
 *   ["a"]              -> "a"
 *   ["a", "b"]         -> "a and b"
 *   ["a", "b", "c"]    -> "a, b, and c"
 */
function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * Builds a deterministic, category-counted recall sentence.
 *
 * Groups the recall list by categoryLabel(component), counts each category,
 * and renders the top categories. Counts 1-9 use plain-English number words;
 * 10+ use digits. Categories are sorted descending by count, then alphabetic
 * by label for determinism.
 *
 * Examples:
 *   6 airbag + 1 brake + 1 fuel-system + 1 lighting →
 *     "six unrepaired airbag inflator recalls, plus brakes, fuel-system, and
 *     lighting recalls"
 *   1 airbag → "one unrepaired airbag recall"
 */
function recallCategorySentence(recalls: Recall[]): string {
  if (recalls.length === 0) return "";

  // Count by plain-English label.
  const counts = new Map<string, number>();
  for (const r of recalls) {
    const label = categoryLabel(r.component);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  // Sort: count desc, then label asc (deterministic tie-break).
  const entries = Array.from(counts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  const top = entries[0];
  const topCount = top[1];
  const topLabel = top[0];

  // Lead phrase. Special-case airbag and fuel-system to read more naturally
  // since those are the high-stakes recall categories the demo features.
  let lead: string;
  if (topLabel === "airbag") {
    lead =
      topCount === 1
        ? `${numberWord(topCount)} unrepaired airbag recall`
        : `${numberWord(topCount)} unrepaired airbag inflator recalls`;
  } else if (topLabel === "fuel-system") {
    lead =
      topCount === 1
        ? `${numberWord(topCount)} unrepaired fuel-system recall`
        : `${numberWord(topCount)} unrepaired fuel-system recalls`;
  } else {
    lead =
      topCount === 1
        ? `${numberWord(topCount)} unrepaired ${topLabel} recall`
        : `${numberWord(topCount)} unrepaired ${topLabel} recalls`;
  }

  if (entries.length === 1) {
    return lead;
  }

  // Other categories rendered as a flat list of label names, always followed
  // by "recalls" plural — we don't re-list counts for every category.
  const rest = entries.slice(1).map((e) => e[0]);
  const restJoined = joinList(rest);

  return `${lead}, plus ${restJoined} recalls`;
}

type AvailableEntry = {
  key: SubScoreKey;
  value: number;
  contribution: number;
};

/**
 * Collect the available sub-scores into a list with their contributions and
 * values. Excludes unavailable sub-scores (per US-7 those are blanked, not
 * named).
 */
function collectAvailable(subScores: Profile["subScores"]): AvailableEntry[] {
  const out: AvailableEntry[] = [];
  for (const key of ALL_KEYS) {
    const ss = subScores[key];
    if (ss.available) {
      out.push({
        key,
        value: ss.value,
        contribution: (100 - ss.value) * BASE_WEIGHTS[key],
      });
    }
  }
  return out;
}

/**
 * Sort by contribution desc, tie-break alphabetic by key. ALL_KEYS is already
 * alphabetic, so a stable sort would suffice, but we make the tie-break
 * explicit to avoid relying on engine sort stability.
 */
function sortByContribution(entries: AvailableEntry[]): AvailableEntry[] {
  return [...entries].sort((a, b) => {
    if (b.contribution !== a.contribution) return b.contribution - a.contribution;
    return a.key.localeCompare(b.key);
  });
}

/**
 * Sort by value desc (best-first), tie-break alphabetic by key.
 */
function sortByValue(entries: AvailableEntry[]): AvailableEntry[] {
  return [...entries].sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return a.key.localeCompare(b.key);
  });
}

/**
 * Renders the verdict for a successful (composite computed) profile.
 *
 * Length scales: 1 sentence for A, up to 2 sentences for B, up to 3 sentences
 * for F (one for the categorized list, one for the recall breakdown when
 * recalls drives it).
 */
export function generateVerdict(params: {
  letter: "A" | "B" | "C" | "D" | "F";
  subScores: Profile["subScores"];
  recalls: Recall[];
}): string {
  const { letter, subScores, recalls } = params;

  let text: string;
  try {
    text = renderVerdict(letter, subScores, recalls);
    lintVerdict(text);
    return text;
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      return fallbackVerdict(letter);
    }
    throw err;
  }
}

function renderVerdict(
  letter: "A" | "B" | "C" | "D" | "F",
  subScores: Profile["subScores"],
  recalls: Recall[],
): string {
  const available = collectAvailable(subScores);

  // Defensive: if 3+ sub-scores were unavailable, the composite path would
  // already be null and we wouldn't be called. But if we somehow are called
  // with too few inputs, fall through to a minimal template.
  if (available.length === 0) {
    return `This vehicle scores ${letter}. See the score breakdown below for the inputs.`;
  }

  if (letter === "A" || letter === "B") {
    return renderPositiveVerdict(letter, available);
  }
  return renderNegativeVerdict(letter, available, recalls);
}

function renderPositiveVerdict(
  letter: "A" | "B",
  available: AvailableEntry[],
): string {
  // Pick top 1-3 by VALUE, alphabetic tie-break.
  const ranked = sortByValue(available);
  const top = ranked.slice(0, Math.min(3, ranked.length));
  const phrases = top.map((e) => positivePhrase(e.key, e.value));

  // A-grade: 1 sentence, full positive list. B-grade: 1 sentence, slightly
  // less effusive — name 2 strengths and the weakest available sub-score
  // mentioned neutrally.
  if (letter === "A") {
    return `This vehicle scores A — public records show ${joinList(phrases)}.`;
  }

  // B: name the top 2 strengths plus the weakest sub-score by value as the
  // hedge-free trade-off. If we only have 1-2 sub-scores, fall back to A's
  // shape with the B letter.
  if (ranked.length < 3) {
    return `This vehicle scores B — public records show ${joinList(phrases)}.`;
  }
  const strengths = ranked.slice(0, 2).map((e) => positivePhrase(e.key, e.value));
  const weakest = ranked[ranked.length - 1];
  const weakestPhrase = neutralPhrase(weakest.key, weakest.value);
  return `This vehicle scores B — public records show ${joinList(strengths)}, with ${weakestPhrase}.`;
}

/**
 * Neutral phrasing for the weakest sub-score in a B-grade verdict. Avoids
 * the negative copy (which is reserved for C/D/F) and avoids the positive
 * copy (which would oversell). Reads as a factual trade-off.
 */
function neutralPhrase(key: SubScoreKey, value: number): string {
  switch (key) {
    case "recalls":
      return value >= 70
        ? "a light recall record"
        : "a handful of open recalls";
    case "complaints":
      return value >= 70
        ? "a moderate complaint count"
        : "an elevated complaint count";
    case "safety":
      return value >= 60
        ? "mid-range crash-test scores"
        : "below-average crash-test scores";
    case "emissions":
      return value >= 75 ? "Tier 2 emissions controls" : "older-tier emissions controls";
    case "ageWear":
      return value >= 60
        ? "moderate age and wear"
        : "noticeable age and wear";
  }
}

function renderNegativeVerdict(
  letter: "C" | "D" | "F",
  available: AvailableEntry[],
  recalls: Recall[],
): string {
  // Top 3 by contribution.
  const ranked = sortByContribution(available);
  const top = ranked.slice(0, Math.min(3, ranked.length));

  // Render the top-3 categories as short negative phrases. The recalls
  // category gets a recall-count-and-list breakdown as a second sentence so
  // the first sentence stays readable.
  const recallsInTop = top.some((e) => e.key === "recalls");
  const recallsHaveDetail = recallsInTop && recalls.length > 0;

  const phrases = top.map((e) => negativePhrase(e.key));

  const sentence1 = `This vehicle scores ${letter} — public records show ${joinList(phrases)}.`;

  if (!recallsHaveDetail) {
    return sentence1;
  }

  const breakdown = recallCategorySentence(recalls);
  // Capitalize the first character of the breakdown for sentence form.
  const sentence2 = `The recall record shows ${breakdown}.`;
  return `${sentence1} ${sentence2}`;
}
