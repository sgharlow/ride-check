# RideCheck — Technical Spec

This spec is the buildable blueprint for `prd.md`. Every component below has its own heading so `/checklist` can reference it. Cross-references to `prd.md > [Epic]` appear throughout.

## Stack

- **Framework:** [Next.js 14 (App Router)](https://nextjs.org/docs)
- **Language:** [TypeScript](https://www.typescriptlang.org/docs/) — `strict` mode on
- **Styling:** [Tailwind CSS](https://tailwindcss.com/docs) — no UI library
- **Testing:** [Vitest](https://vitest.dev/guide/) — unit tests on pure-function modules
- **Linting:** ESLint + Prettier with Next.js defaults
- **Hosting:** [Vercel](https://vercel.com/docs) — Hobby/free tier
- **Node:** v20 LTS

Rationale: this stack is locked from `RideCheck_Hackathon_Spec_v0.md > §4.2` and confirmed unchanged in `/spec`. It's the most boring-shippable option that fits a 5-day public-data lookup app, matches the learner's day-to-day stack, and deploys to Vercel free tier with no API keys.

## Runtime & Deployment

- **Runtime:** Vercel Serverless Functions on Node.js. Default function timeout 10s on Hobby tier (sufficient given the 2s per-upstream caps below).
- **Deployment target:** Vercel Hobby on the default `*.vercel.app` URL. No custom domain in v0.
- **Environment requirements:**
  - Node 20 for local dev (`.nvmrc` recommended).
  - **No API keys.** All upstream public APIs (NHTSA Recalls, NHTSA Complaints, NHTSA NCAP Safety Ratings, vPIC) are unauthenticated and free.
  - `.env.local` is empty in v0 except for `BASE_URL=http://localhost:3000` for the local dev fallback used by `lib/baseUrl.ts`.
- **Build command:** `next build`. **Dev command:** `next dev`. **Test command:** `vitest run`.
- **Section 8 hygiene** from `RideCheck_Hackathon_Spec_v0.md > §8` applies to all public artifacts (README, deployed UI copy, commit messages, Devpost description). Reviewed before push.

## Architecture Overview

```
[Browser]
   │
   │ user fills cascading dropdowns + mileage + price, clicks Evaluate
   ▼
[InputForm (client)]
   │
   │ on submit: router.push('/profile/{slug}?mi=&p=')
   ▼
[/profile/[query]/page.tsx (server component)]
   │
   │ decodeQuery(slug) → {year, make, model}
   │ fetch(absoluteApiUrl('/api/profile?...'))
   ▼
[/api/profile/route.ts]
   │
   │ buildProfile() — lib/profile.ts orchestrator
   │
   ├─► Promise.allSettled([
   │      fetchRecalls(YMM),            ◄── 2s timeout
   │      fetchComplaints(YMM),         ◄── 2s timeout
   │      fetchNcapStep1(YMM)           ◄── 2s timeout
   │   ])
   │
   ├─► if NCAP step1 ok:
   │      fetchNcapStep2(vehicleIds[0]) ◄── 2s timeout (sequential)
   │
   ├─► local: emissionsTierFromYear(year)
   │
   ├─► scoring/* → 5 sub-scores (with severity multiplier on recalls)
   │
   ├─► composite + letter (renormalize if 1–2 sub-scores unavailable)
   │
   ├─► summary.generateVerdict() — rank by contribution, name worst-3
   │
   └─► return Profile JSON
   │
   ▼
[ProfileCard server component renders] → HTML streams to browser
```

No database. No persistent state. Three parallel NHTSA fetches plus one sequential NCAP step-2 plus one local emissions computation. Vercel's default fetch cache provides warm-instance reuse.

## Frontend

### Landing Page — `app/page.tsx`

Implements `prd.md > Entering a Vehicle` (US-1, US-1a) and `prd.md > First Impression and Discovery` (US-6).

- Server component shell.
- Renders `<InputForm />` and `<SampleVehicles />` (the latter is the first-cuttable feature; conditional render gated on a build-time env or just always-on, since cutting it means deleting the line).
- Page-level metadata: `<title>RideCheck — public-data risk profile for any used car</title>`.

### `components/InputForm.tsx`

Implements `prd.md > Entering a Vehicle > US-1`.

- Client component (`"use client"`).
- Five controlled fields in render order: Year, Make, Model, Mileage, Price.
- State machine: `idle → loading-models → ready → submitting → idle` (resets on field change).
- **Year dropdown:** populated from `lib/years.ts` `availableYears()` returning `[currentYear+1, currentYear, …, 1981]`.
- **Make dropdown:** populated from `lib/makes.ts` `TOP_50_MAKES` (static). Disabled until Year selected.
- **Model dropdown:** populated by `GET /api/models?year=Y&make=M` after Year + Make are both set. Disabled until response arrives. Loading shimmer while in flight. On error, shows a single disabled "Couldn't load models — try again" entry; clicking retry refetches.
- **Mileage:** `<input type="number" min="0" step="1" defaultValue="0" />`. The `0` default doubles as the "user did not provide" signal in the Age & Wear formula.
- **Price:** `<input type="number" min="0" step="100" />`, optional, blank-allowed.
- **Evaluate button:** disabled until Year+Make+Model are all selected. Submit handler:
  1. Build slug via `encodeQuery({year, make, model})` from `lib/slug.ts`.
  2. `router.push(`/profile/${slug}?mi=${mileage}&p=${price || ''}`)` using Next.js `useRouter()`.
  3. While the next route resolves, the form is disabled (prevents the double-submit / sample-click race condition).

### `components/SampleVehicles.tsx`

Implements `prd.md > First Impression and Discovery > US-6`.

- Client component.
- Three preset cards covering the grade range:
  - **2007 Honda Civic / 180,000 mi** — F-grade demo car (Takata airbag-era recalls).
  - **2014 Volkswagen Passat / 150,000 mi** — D-grade demo car (multi-category recalls; honest answer to a curious dieselgate query).
  - **2018 Toyota Camry / 60,000 mi** — B-grade demo car (clean record, modern emissions).
- Click handler: identical to `InputForm` submit — builds slug, pushes the route. Does **not** short-cut to a static result; the live API path is the demo path.
- **Cut policy:** US-6 is the first feature dropped if Day 4 runs late. To cut: delete `<SampleVehicles />` from `app/page.tsx` and delete the file. No cascading impact.

### `app/profile/[query]/page.tsx`

Implements `prd.md > Reading the Verdict` (US-2, US-3, US-5) and `prd.md > Cross-cutting > US-7`.

- Server component.
- Reads `params.query` and `searchParams.mi` and `searchParams.p`.
- `decodeQuery(params.query)` from `lib/slug.ts` extracts `{year, make, model}`. Validates `make` against `TOP_50_MAKES`. On invalid slug → render `<NotEnoughData reason="vehicle-not-recognized" />`.
- Fetches `${absoluteApiUrl('/api/profile?...')}`.
- Renders `<ProfileCard profile={...} />` on success.
- Renders `<NotEnoughData reason="3-plus-sources-unavailable" />` if the API returns the not-enough-data state.

### `app/profile/[query]/loading.tsx`

- Skeleton renderer shown by Next.js automatically while `page.tsx` is server-rendering.
- Greyed grade chip placeholder + 5 greyed sub-bar placeholders + greyed verdict line.
- ~30 lines of JSX, Tailwind only. No props, no logic.

### `components/ProfileCard.tsx`

Implements `prd.md > Reading the Verdict > US-2` (visual hierarchy).

- Server component.
- Composes child components in the locked vertical order: vehicle identity (Year + Make + Model + mileage + price-if-provided) → `<GradeChip />` → numeric composite (`xx / 100`) → `<Verdict />` → `<ScoreBars />` → `<SourcesStrip />`.
- Mobile reflow: single-column on `<sm` breakpoint, preserving vertical order.
- If `profile.renormalized === true`, render a small disclosure note above the sub-bars: "Score recalculated — [N] data source(s) unavailable. See bars below for details."

### `components/GradeChip.tsx`

- Server component.
- Single prop `letter: 'A' | 'B' | 'C' | 'D' | 'F'`.
- Renders the letter inside a chip element. Largest typographic element on the card.
- Monochrome (no color coding per `prd.md > Reading the Verdict > US-2`).

### `components/ScoreBars.tsx`

- Server component.
- Five rows, one per sub-score: `Recalls`, `Complaints`, `Safety (NCAP)`, `Emissions`, `Age & Wear`.
- Each row: label (left), monochrome bar (filled to `value%`), numeric value (right).
- For unavailable sub-scores: bar is blank, right side reads "data unavailable".

### `components/Verdict.tsx`

Implements `prd.md > Reading the Verdict > US-3`.

- Server component.
- Single prop `text: string` from `profile.verdict`.
- Renders as one paragraph below the score chip, before the sub-bars.

### `components/SourcesStrip.tsx`

Implements `prd.md > Reading the Verdict > US-5`.

- Server component.
- Renders four labeled links per result:
  1. **NHTSA Recalls** → `https://www.nhtsa.gov/recalls?nhtsaId={CampaignNumber}` for the first recall, or `https://www.nhtsa.gov/vehicle/{year}/{make}/{model}` if no recalls.
  2. **NHTSA Complaints** → `https://www.nhtsa.gov/vehicle/{year}/{make}/{model}#complaints`.
  3. **NCAP Safety Ratings** → `https://www.nhtsa.gov/ratings/{year}/{make}/{model}`.
  4. **EPA Tier methodology** → `https://www.epa.gov/vehicle-and-fuel-emissions-testing/light-duty-vehicle-emission-standards` (footnote, since EPA is computed locally not fetched).
- Plus a "How we calculate this" link to the README's scoring section on GitHub.
- Sources for which `profile.unavailable` includes the source key are still rendered, with the suffix " (no data returned)".

### `components/NotEnoughData.tsx`

Implements `prd.md > Entering a Vehicle > US-1a` and `prd.md > Cross-cutting > US-7`.

- Server component.
- Single prop `reason: 'vehicle-not-recognized' | '3-plus-sources-unavailable' | 'network-error'`.
- Renders a short, calm copy block per reason. No grade, no bars, no partial composite. Explicit by `US-7`.

## Backend (Serverless API)

### `app/api/profile/route.ts`

Implements the orchestration layer for `prd.md > Reading the Verdict` and `prd.md > Cross-cutting > US-7`.

- Exports a `GET` handler.
- Accepts query params `year`, `make`, `model`, `mi`, `p`.
- Validates inputs (year is integer in valid range, make is in `TOP_50_MAKES`, model is non-empty string, mi and p are non-negative integers).
- Calls `buildProfile({year, make, model, mileage, price})` from `lib/profile.ts`.
- Returns `Response.json(profile)` with status 200, or `{error: 'invalid-input'}` with 400, or `{error: 'not-enough-data'}` with 200 + the not-enough-data shape.
- Sets `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800` for successful responses.
- `export const dynamic = 'force-dynamic'` is **not** set — we want Next.js's data cache for warm-instance reuse.

### `app/api/models/route.ts`

Implements the vPIC proxy for `prd.md > Entering a Vehicle > US-1` Model dropdown.

- Exports a `GET` handler.
- Accepts query params `year`, `make`.
- Calls `fetchModels(year, make)` from `lib/upstream/vpic.ts`.
- Returns `Response.json({models: string[]})` on success, `{error: 'fetch-failed'}` with status 502 on upstream failure.
- Sets `Cache-Control: public, s-maxage=604800` (1 week — model lists for past years are stable).

## Library (`lib/`)

Pure-function modules with no Next.js dependencies. All Vitest-able.

### `lib/makes.ts`

- Exports `TOP_50_MAKES: readonly string[]`.
- The 50 make names locked in `prd.md > Entering a Vehicle > US-1`. Display-cased (e.g., `"Volkswagen"`, `"Mercedes-Benz"`).

### `lib/years.ts`

- Exports `availableYears(): number[]` returning `[currentYear+1, currentYear, …, 1981]`.

### `lib/slug.ts`

- Exports `encodeQuery({year, make, model}): string` — produces `${year}-${slugify(make)}-${slugify(model)}`.
- Exports `decodeQuery(slug: string): {year, make, model} | null` — parses the slug, validates `make` against `TOP_50_MAKES`, returns `null` on invalid.
- `slugify(s: string): string` is `s.toLowerCase().replace(/\s+/g, '_')`. Hyphens are passed through (so `Mercedes-Benz` becomes `mercedes-benz`).
- Tests in `tests/slug.test.ts` cover round-trip for: simple (`Honda Civic`), space-in-make (`Land Rover`), hyphen-in-make (`Mercedes-Benz`), space-in-model (`C Class`), unknown make (returns null).

### `lib/baseUrl.ts`

- Exports `absoluteApiUrl(path: string): string`.
- Resolution order:
  1. If `process.env.VERCEL_ENV === 'production'`: `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}${path}`.
  2. Else if `process.env.VERCEL_URL` is set: `https://${process.env.VERCEL_URL}${path}`.
  3. Else (local dev): `${process.env.BASE_URL || 'http://localhost:3000'}${path}`.
- Tests in `tests/` exercise all three branches by stubbing env vars.

### `lib/upstream/recalls.ts`

- Exports `fetchRecalls(year, make, model): Promise<Recall[]>`.
- URL: `https://api.nhtsa.gov/recalls/recallsByVehicle?make={make}&model={model}&modelYear={year}`.
- Response shape: `{Count, Message, results: Recall[]}` where `Recall` has fields including `Component`, `Summary`, `NHTSACampaignNumber`, `ReportReceivedDate`. **Component string is colon-hierarchical** (e.g., `AIR BAGS:FRONTAL:DRIVER SIDE:INFLATOR MODULE`).
- Returns extracted array of `{component, campaignNumber, summary, receivedDate}`.
- 2-second timeout via `AbortController`. Rejects on timeout or non-200 status.
- `next.revalidate: 86400` on the fetch.
- Docs: https://api.nhtsa.gov/

### `lib/upstream/complaints.ts`

- Exports `fetchComplaints(year, make, model): Promise<number>`.
- URL: `https://api.nhtsa.gov/complaints/complaintsByVehicle?make={make}&model={model}&modelYear={year}`.
- Response shape: `{count, message, results: Complaint[]}` (note camelCase, unlike recalls API's PascalCase).
- Returns the `count` value (just the integer; we don't need individual complaints for v0).
- 2-second timeout. `next.revalidate: 86400`.

### `lib/upstream/ncap.ts`

- Exports `fetchNcap(year, make, model): Promise<{overallRating: number} | null>`.
- **Two-step lookup:**
  1. `GET https://api.nhtsa.gov/SafetyRatings/modelyear/{year}/make/{make}/model/{model}` returns `{Count, Message, Results: [{VehicleId, VehicleDescription}, …]}`.
  2. Pick the first `VehicleId`. Call `GET https://api.nhtsa.gov/SafetyRatings/VehicleId/{id}` which returns a result object with `OverallRating` (string `"5"` or `"Not Rated"`).
- Returns `{overallRating: number 0–5}` parsed from the `OverallRating` string, or `null` if step 1 returns `Count: 0` or step 2 returns `"Not Rated"`.
- 2-second timeout per step. `next.revalidate: 86400` on each step.
- Picking trim variant: **always take `Results[0]`**. Documented as a transparency trade-off — we score against a single trim, not an aggregate.

### `lib/upstream/vpic.ts`

- Exports `fetchModels(year, make): Promise<string[]>`.
- URL: `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/{make}/modelyear/{year}?format=json`.
- Response shape: `{Count, Results: [{Make_ID, Make_Name, Model_ID, Model_Name}, …]}`.
- Returns `Results.map(r => r.Model_Name)` deduped + sorted.
- 2-second timeout. `next.revalidate: 604800` (1 week).
- Docs: https://vpic.nhtsa.dot.gov/api/

### `lib/scoring/severity.ts`

- Exports `COMPONENT_SEVERITY` mapping NHTSA `Component` prefixes to severity multipliers.
- Exports `severity(componentString: string): number` — applies prefix-match rules.

```typescript
const COMPONENT_SEVERITY: Array<{prefix: string; multiplier: number; label: string}> = [
  {prefix: 'AIR BAGS',                 multiplier: 2.0, label: 'airbag'},
  {prefix: 'FUEL SYSTEM',              multiplier: 2.0, label: 'fuel-system'},
  {prefix: 'ENGINE AND ENGINE COOLING',multiplier: 2.0, label: 'engine'},
  {prefix: 'STEERING',                 multiplier: 2.0, label: 'steering'},
  {prefix: 'SERVICE BRAKES',           multiplier: 2.0, label: 'brakes'},
  {prefix: 'POWER TRAIN',              multiplier: 1.5, label: 'powertrain'},
  {prefix: 'ELECTRICAL SYSTEM',        multiplier: 1.5, label: 'electrical'},
  {prefix: 'EXTERIOR LIGHTING',        multiplier: 1.0, label: 'lighting'},
  {prefix: 'SUSPENSION',               multiplier: 1.0, label: 'suspension'},
  // default 1.0 for anything not matched
];
```

`severity()` walks the table in order, returns the first matching multiplier (or 1.0 if none match). The `label` is consumed by `summary.ts` for the plain-English category names. Order matters: `SERVICE BRAKES` precedes any future `BRAKES` rule.

### `lib/scoring/recalls.ts`

- Exports `subRecallScore(recalls: Recall[]): number` (0–100).
- Formula: `score = max(0, 100 − 15 × Σ severity(recall.component) for recall in recalls)`.
- Example: 10 recalls with severities `[2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 1.5, 1.5, 1.0, 1.0]` → sum = 16 → `100 − 15 × 16 = -140` → floor at 0.

### `lib/scoring/complaints.ts`

- Exports `subComplaintsScore(count: number): number` (0–100).
- Formula: `max(0, 100 − 20 × log10(count + 1))`.
- Examples: 0 → 100, 10 → 79, 100 → 60, 588 → 44, 1000 → 40.

### `lib/scoring/safety.ts`

- Exports `subSafetyScore(stars: number | null): number | null` (0–100 or null).
- Formula: `stars × 20` if `stars` is in `[1..5]`, else `null` (treated as unavailable).

### `lib/scoring/emissions.ts`

- Exports `subEmissionsScore(year: number): number`.
- Lookup table from `RideCheck_Hackathon_Spec_v0.md > §4.4`:
  - `year ≥ 2017` → 100 (Tier 3)
  - `2004 ≤ year ≤ 2016` → 75 (Tier 2)
  - `1994 ≤ year ≤ 2003` → 50 (Tier 1)
  - `year < 1994` → 25 (Tier 0)

### `lib/scoring/ageWear.ts`

- Exports `subAgeWearScore(year: number, mileage: number): number` (0–100).
- Two-input formula (locked here as the v0 baseline; tunable in build via test fixtures):
  - `age = currentYear − year`
  - `score = max(0, 100 − 2 × age − 0.0002 × mileage)`
  - Special case: `mileage === 0` falls back to year-only `max(0, 100 − 3 × age)` per `prd.md > Entering a Vehicle > US-1a` (mileage `0` = "user did not provide").
- Examples (currentYear = 2026):
  - 2007 Civic / 180k mi: `100 − 2 × 19 − 0.0002 × 180000 = 100 − 38 − 36 = 26`
  - 2014 Passat / 150k mi: `100 − 2 × 12 − 0.0002 × 150000 = 100 − 24 − 30 = 46`
  - 2018 Camry / 60k mi: `100 − 2 × 8 − 0.0002 × 60000 = 100 − 16 − 12 = 72`
  - 2007 Civic / mileage=0: `100 − 3 × 19 = 43` (year-only fallback)

### `lib/scoring/composite.ts`

- Exports `combine(subScores): {composite, letter, weights, renormalized}`.
- Base weights (from `RideCheck_Hackathon_Spec_v0.md > §4.4`):
  - Recalls 0.25, Complaints 0.15, Safety 0.25, Emissions 0.20, Age & Wear 0.15. Sum = 1.0.
- **Renormalization for unavailable sub-scores** (per `prd.md > Cross-cutting > US-7`):
  - If 1 or 2 sub-scores are `null`: drop their weights, divide remaining weights by their new sum so they total 1.0, set `renormalized: true`.
  - If 3+ sub-scores are `null`: return `{composite: null, letter: null, renormalized: true}` and the page renders `<NotEnoughData reason="3-plus-sources-unavailable" />`.
- Letter bands: `composite ≥ 85 → A`, `≥ 70 → B`, `≥ 55 → C`, `≥ 40 → D`, else `F`.

### `lib/summary.ts`

Implements `prd.md > Reading the Verdict > US-3`.

- Exports `generateVerdict({letter, subScores, recalls}): string`.
- Algorithm:
  1. For each available sub-score, compute its **contribution to grade reduction** = `(100 − value) × weight`.
  2. Sort sub-scores descending by contribution.
  3. For grades A or B: emit one positive sentence naming the highest-scoring 1–3 categories.
  4. For grades C, D, F: emit 1–3 sentences naming the **top 3 by contribution**.
- For the `recalls` category, the verdict copy uses the plain-English labels from `severity.label` (`"airbag"`, `"fuel-system"`, etc.). When recalls drives the verdict, the copy mentions recall *counts by category* drawn from the `Recall[]` list.
- **Hedge-word linter** (verdict generator self-check): reject any output containing the words `some`, `may have`, `potentially`, `might`, `possibly`. Throws in dev, falls back to a deterministic template in prod.
- **No exclamation marks, no all-caps, no scare quotes.** Voice-policy enforced as a unit-test assertion in `tests/summary.test.ts`.
- Deterministic: same `(letter, subScores, recalls)` tuple always produces the same string.

### `lib/profile.ts`

- Exports `buildProfile(input): Promise<Profile>`.
- The orchestrator. Drives the 3-parallel + 1-sequential fan-out, runs scoring and verdict generation, returns the assembled `Profile`.
- Pure — no `Response`, no Next.js types. Called by `/api/profile/route.ts` only.

### `lib/types.ts`

```typescript
export type SourceKey = 'recalls' | 'complaints' | 'safety';
// 'emissions' is not in SourceKey — it's locally computed, never unavailable.

export type Recall = {
  component: string;          // raw NHTSA Component string, colon-hierarchical
  campaignNumber: string;
  summary: string;
  receivedDate: string;
};

export type SubScore =
  | {value: number; available: true; sourceLabel: string}
  | {value: null; available: false; reason: string};

export type Profile = {
  vehicle: {year: number; make: string; model: string; mileage: number; price: number | null};
  composite: number | null;
  letter: 'A' | 'B' | 'C' | 'D' | 'F' | null;
  subScores: {
    recalls:    SubScore;
    complaints: SubScore;
    safety:     SubScore;
    emissions:  SubScore;   // always available
    ageWear:    SubScore;   // always available
  };
  verdict: string;
  sources: SourceLink[];
  unavailable: SourceKey[];
  renormalized: boolean;
};

export type SourceLink = {key: SourceKey | 'emissions' | 'methodology'; label: string; url: string; note?: string};
```

## Data Model

There is no persistent data store. Type contract above (`lib/types.ts`) is the only data model.

## File Structure

```
ride-check/
├── README.md                         # public-facing — Section 8 hygiene applies
├── LICENSE                           # MIT
├── package.json
├── tsconfig.json                     # strict: true
├── next.config.js
├── tailwind.config.js
├── vitest.config.ts
├── .env.local                        # gitignored — only BASE_URL for local dev
├── .gitignore
├── .nvmrc                            # 20
├── docs/                             # zipped for Devpost submission
│   ├── learner-profile.md
│   ├── RideCheck_Hackathon_Spec_v0.md
│   ├── scope.md
│   ├── prd.md
│   ├── spec.md                       # this document
│   └── checklist.md                  # generated by /checklist (next)
├── process-notes.md                  # learning journal
├── app/
│   ├── layout.tsx                    # root layout, fonts, Tailwind
│   ├── page.tsx                      # landing — InputForm + SampleVehicles
│   ├── globals.css                   # Tailwind directives
│   ├── profile/
│   │   └── [query]/
│   │       ├── page.tsx              # result page (server component, fetches /api/profile)
│   │       └── loading.tsx           # skeleton shown during render
│   └── api/
│       ├── profile/
│       │   └── route.ts              # GET handler — orchestrates lib/profile.ts
│       └── models/
│           └── route.ts              # GET handler — vPIC proxy
├── components/
│   ├── InputForm.tsx                 # client — controlled cascading dropdowns
│   ├── SampleVehicles.tsx            # client — three preset cards (US-6, first to cut)
│   ├── ProfileCard.tsx               # server — composes the result card
│   ├── GradeChip.tsx                 # server — large letter chip
│   ├── ScoreBars.tsx                 # server — five monochrome sub-bars
│   ├── Verdict.tsx                   # server — plain-English verdict line
│   ├── SourcesStrip.tsx              # server — per-vehicle deep links
│   └── NotEnoughData.tsx             # server — fallback for 3+ source-failure or unrecognized slug
├── lib/
│   ├── makes.ts                      # TOP_50_MAKES — static
│   ├── years.ts                      # availableYears()
│   ├── slug.ts                       # encodeQuery / decodeQuery
│   ├── baseUrl.ts                    # absoluteApiUrl(path) — three-branch resolver
│   ├── upstream/
│   │   ├── recalls.ts                # NHTSA Recalls — 2s timeout
│   │   ├── complaints.ts             # NHTSA Complaints — 2s timeout
│   │   ├── ncap.ts                   # NHTSA NCAP two-step — 2s timeout per step
│   │   └── vpic.ts                   # vPIC GetModelsForMakeYear — 2s timeout
│   ├── scoring/
│   │   ├── severity.ts               # COMPONENT_SEVERITY table + severity()
│   │   ├── recalls.ts                # subRecallScore(recalls)
│   │   ├── complaints.ts             # subComplaintsScore(count)
│   │   ├── safety.ts                 # subSafetyScore(stars)
│   │   ├── emissions.ts              # subEmissionsScore(year)
│   │   ├── ageWear.ts                # subAgeWearScore(year, mileage)
│   │   └── composite.ts              # combine(...) — renormalization logic
│   ├── summary.ts                    # generateVerdict() — worst-3 ranking, hedge-word linter
│   ├── profile.ts                    # buildProfile() — orchestrator
│   └── types.ts                      # Profile, SubScore, Recall, SourceKey, SourceLink
└── tests/
    ├── scoring/
    │   ├── severity.test.ts
    │   ├── recalls.test.ts
    │   ├── complaints.test.ts
    │   ├── safety.test.ts
    │   ├── emissions.test.ts
    │   ├── ageWear.test.ts
    │   └── composite.test.ts
    ├── summary.test.ts               # determinism + hedge-word + voice-policy assertions
    ├── slug.test.ts                  # round-trip + edge cases (Mercedes-Benz, Land Rover)
    └── baseUrl.test.ts               # three-branch resolver coverage
```

## Key Technical Decisions

**1. HTTP-only call from result page to `/api/profile`.** The result-page server component fetches `/api/profile` over HTTP rather than importing `lib/profile.ts` directly. Trade-off: ~10–30ms internal HTTP roundtrip latency in exchange for a single contract that's identical for both the form-submit path and the share-URL paste path. Decision recorded in this `/spec` conversation.

**2. Single `[query]` slug segment with deterministic encoding.** Route is `/profile/[query]` where `query = ${year}-${slugify(make)}-${slugify(model)}` and `slugify(s) = s.toLowerCase().replace(/\s+/g, '_')`. Mileage and price are search params. Trade-off: requires a slug encode/decode helper with test coverage for makes containing spaces or hyphens, in exchange for a clean human-readable URL.

**3. Drop EPA fueleconomy.gov from runtime data fan-out.** EPA's API doesn't return an emissions-tier field. The v0 spec's emissions sub-score was always derived from year. Decision: compute emissions tier locally from year, list EPA Tier program documentation as a methodology reference in the Sources strip but do not call EPA at runtime. Trade-off: -1 API call (faster), drops emissions from the failure modes that can trigger renormalization.

**4. Per-upstream timeout = 2s (not 3s).** Vercel cold-start (~500ms–2s) plus 4 fetches plus scoring needs to fit in the function's 10s ceiling and the user-facing PRD SLO. 2s per upstream gives comfortable headroom. Trade-off: slightly higher partial-data rate during NHTSA slow-but-not-down moments.

**5. Recall component-severity is prefix-match against actual NHTSA hierarchical strings.** Confirmed via live API: NHTSA returns colon-hierarchical components like `AIR BAGS:FRONTAL:DRIVER SIDE:INFLATOR MODULE`. The severity table walks prefix rules in order. Trade-off: assumes NHTSA's leading-segment naming is stable; documented as an assumption rather than a guarantee.

**6. Canonical F-grade demo car is the 2007 Honda Civic, not the 2014 VW Passat.** Live API check confirmed the 2007 Civic returns 9 recalls with 6 in the 2.0× airbag bucket — clean alignment between the public NHTSA recall data and the recognizable Takata airbag-inflator story. The dieselgate emissions cheat is an EPA enforcement action, not an NHTSA recall, so it doesn't appear in the recall API; the 2014 Passat will still grade D honestly via 10 unrelated recalls and is retained as a secondary demo car.

## Dependencies & External Services

| Source | URL | Auth | Limits | Cache |
| :--- | :--- | :--- | :--- | :--- |
| NHTSA Recalls | https://api.nhtsa.gov/recalls/recallsByVehicle | None | No documented rate limit | 24h |
| NHTSA Complaints | https://api.nhtsa.gov/complaints/complaintsByVehicle | None | No documented rate limit | 24h |
| NHTSA NCAP step 1 | https://api.nhtsa.gov/SafetyRatings/modelyear/{year}/make/{make}/model/{model} | None | No documented rate limit | 24h |
| NHTSA NCAP step 2 | https://api.nhtsa.gov/SafetyRatings/VehicleId/{id} | None | No documented rate limit | 24h |
| vPIC GetModelsForMakeYear | https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/{make}/modelyear/{year}?format=json | None | No documented rate limit | 7d |
| EPA Tier methodology | https://www.epa.gov/vehicle-and-fuel-emissions-testing/light-duty-vehicle-emission-standards | (not called at runtime) | — | — |

NPM dependencies expected (locked in `package.json` during build):
- `next@^14.2`
- `react@^18`
- `react-dom@^18`
- `typescript@^5`
- `tailwindcss@^3.4`
- `vitest@^1`
- `@types/node`, `@types/react`, `@types/react-dom`
- `eslint`, `eslint-config-next`, `prettier`

No runtime dependencies beyond Next.js and React. No Anthropic / OpenAI SDK. No database client.

## Open Issues

1. **Age & Wear coefficients (`a = 2`, `b = 0.0002`)** are a defensible v0 baseline locked above. They may be re-tuned during build by computing the formula on the three demo cars (2007 Civic, 2014 Passat, 2018 Camry) and confirming the band assignments feel right. *Status: locked, tunable.*
2. **Recall component-severity multipliers (2.0× / 1.5× / 1.0×)** are locked above. Verified on 2014 Passat and 2007 Civic against live NHTSA data; component prefixes match. *Status: locked.*
3. **Trim selection for NCAP** uses `Results[0]`. If a particular trim is materially safer or less safe than the rest, the published score reflects only the first-listed trim. *Status: documented trade-off; revisit only if a sample vehicle produces a wrong-feeling NCAP score.*
4. **Mileage = 0 dual-meaning.** `0` in the form means "user did not provide" (triggers year-only Age & Wear fallback) AND is a legitimate value for a brand-new used vehicle. The fallback formula gives a higher score for `0` mileage than the wear-adjusted formula at a typical mileage, which is correct for a true 0-mile vehicle and reasonable for a "didn't provide" vehicle. *Status: accepted dual-meaning, documented in code.*
5. **Vercel cold-start vs. PRD's 5s cold SLO.** Worst-case math is ~5–7s on a true cold start. PRD SLO is treated as best-effort, not a hard contract. Document in README. *Status: accepted.*
6. **Top-50 makes list** includes some defunct makes (Saab, Saturn, Pontiac, Hummer, Scion). They have used vehicles in the wild and NHTSA returns data for them. *Status: list final unless a build-time issue surfaces.*
