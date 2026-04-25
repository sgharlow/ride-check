# RideCheck

## Idea
A single-page web app where a used-car shopper enters year/make/model and gets back a transparent A–F letter grade — the public-data verdict on the vehicle, with the math in the open.

The thing RideCheck does that nothing else currently does: **render a clear verdict** (like AutoCheck/Carfax) **while showing every input and weight that produced it** (unlike AutoCheck/Carfax), using **only free public data** (NHTSA, EPA, vPIC). The cell on the comparator grid that's currently empty is *clean + verdict + transparent* — that's the cell RideCheck fills.

## Who It's For
A prospective used-car shopper looking at a specific candidate vehicle who wants a fast, trustworthy second opinion before they walk a lot, dig deeper, or pay for a paid history report. Not a researcher. Not a fleet buyer. A person about to spend $8,000–$30,000 and wants thirty seconds of "is this car a story I should know about?"

The problem: NHTSA has the data and won't render a verdict. CarComplaints renders verdicts and looks like a 2010 forum. Carfax/AutoCheck look clean but hide their math behind a paywall. The buyer is stuck choosing between *trustworthy raw data they can't interpret* and *opaque grades they paid for.*

## Inspiration & References

**Visual / voice references:**
- **Carfax check report** — calm typographic restraint, single grade as the hero, sub-scores supporting underneath. Aesthetic target.
- **EPA fueleconomy.gov** — government-typeface authority, no flash, the data speaks for itself. Voice target.
- **NHTSA five-star safety label** — the iconic "summary of public records as a single image" pattern. Layout target.
- **FICO score cards** — the visual language of "one big number + smaller component bars." Information-hierarchy target.

**What we're explicitly *not* taking from:**
- CarComplaints' cluttered ad-heavy aesthetic
- AutoCheck/Carfax's opaque scoring (their problem is what we fix)

**Public data sources** (all free, no API keys):
- NHTSA Recalls API — `https://api.nhtsa.gov/recalls/recallsByVehicle`
- NHTSA Complaints API — `https://api.nhtsa.gov/complaints/complaintsByVehicle`
- NHTSA NCAP Safety Ratings — `https://api.nhtsa.gov/SafetyRatings/...`
- EPA fueleconomy.gov — `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options`
- vPIC VIN decoder — `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/...` (stretch only)

**Design lens:** transparent, calmly authoritative, no flash. The score and its inputs speak for themselves; copy respects the user; the UI does not oversell. Carried in from the learner profile.

## Goals
What the learner wants this to accomplish:

- **Ship a deployable v0** at a public URL by April 29, 2026 5pm EDT — completion badge earned.
- **Hit the demo moment:** when a known-bad vehicle (e.g., a 2014 VW Passat TDI affected by the dieselgate emissions settlement) is entered, the grade visibly *earns itself* — a low letter grade and a verdict that names what's wrong, in plain English. The user leans in. That's the moment that makes the build worth it.
- **Hold the line on transparency.** Every weight, every cut point, every component-severity multiplier is in the README. The product's value is not "we figured it out" — it's "we showed our work."
- **Produce a usable teaching artifact.** The scope/PRD/spec/checklist documents are part of the submission *and* are evaluated as transplantable patterns for a team workshop on spec-driven development with AI.

## What "Done" Looks Like

**On April 29 by 5pm EDT, the deliverables are:**

1. A deployed Next.js app at a public URL (Vercel free tier).
2. A user can type *2014, Volkswagen, Passat* into a YMM form, hit Submit, and within 5 seconds see:
   - A single A–F letter grade as the visual hero of the page (low, in this case).
   - Five sub-scores as horizontal bars: Recalls, Complaints, Safety (NCAP), Emissions, Age — each labeled with its data source.
   - A plain-English verdict line that **commits** — names the dieselgate emissions settlement and the unrepaired recall components, not "this vehicle has some issues."
   - A sources strip at the bottom linking back to NHTSA / EPA / vPIC.
3. The same flow works for a benign comparison vehicle (e.g., 2018 Toyota Camry) and produces a B/A grade with a verdict that's calmly positive.
4. Three sample-vehicle quick-start cards on the landing page covering different grade bands so a stranger can click and see what the product does without typing anything.
5. Graceful degradation works: if NHTSA's complaints API times out, the result still renders with four sub-scores and a "data unavailable" note on the missing one, weights renormalized.
6. A public GitHub repo that clones-and-runs from the README on a clean machine.
7. The README publishes the full scoring formula, including the new component-severity table for recalls, with no language from the Section 8.2 deny-list.
8. The four spec-driven artifacts (`scope.md`, `prd.md`, `spec.md`, `checklist.md`) are present in `docs/` and zip cleanly for Devpost upload.

**The proudest version** of done is when someone Steve shows the deployed URL to says, unprompted, "wait, why doesn't Carfax do that?" — meaning the transparent-verdict positioning landed.

## What's Explicitly Cut

**Cut from v0 — strict scope discipline:**

- **VIN decode entry path (was US-4)** — demoted to stretch. YMM-only entry. Cost to cut: low; benefit if time allows: nice convenience for users with the VIN handy.
- **Playwright E2E test** — demoted to stretch. Vitest unit tests on the scoring function remain non-negotiable.
- **Curated "known-flagged campaigns" JSON list** (e.g., a hand-maintained file of dieselgate / Takata / GM ignition-switch YMMs). Rejected in favor of **component-weighted recall penalties** — which catches the same vehicles by reading NHTSA's `Component` field at runtime, no curation, formula stays publishable.
- **Mileage as an input** — *not* added despite being mentioned in the brain dump. None of the public APIs return mileage; adding it would be cosmetic on the form. If we add it later it's an `age × mileage` interaction in the age sub-score, but not in v0.

**Cut by the v0 spec from the start (deny-list, see RideCheck_Hackathon_Spec_v0.md §8.2):**

- Any inspection-program data (state I/M, OBD/DTC/MIL, RSD/NOV, station-level data)
- State-jurisdiction-specific calibration of failure rates
- Any prediction of state-mandated inspection failure
- Premium data sources (CARFAX, AutoCheck, CarMD, NMVTIS, OEM warranty)
- Predictive ML models — v0 is rule-based on purpose
- User accounts, payments, dealer integrations, save/share/history
- Two-vehicle comparison view
- Mobile native apps
- Any backend database — the app is stateless

**Cut on triage grounds — kill order if Day 4 runs late:**

1. VIN decode + vPIC integration (already cut to stretch)
2. Playwright E2E (already cut to stretch)
3. Sample-vehicle cards on landing — *if* even Day 4 morning slips
4. Graceful degradation — *only* if everything else is on fire (cutting this means an API timeout bricks the demo)

The summary-generator (the verdict line) is **not cuttable** — it is the demo moment.

## Loose Implementation Notes

Non-binding; refined in `/spec`.

- **Stack** locked from v0 spec §4.2: Next.js 14 (App Router) + TypeScript + Tailwind, deployed to Vercel. Vitest for unit tests. No UI library, no database, no auth.
- **Architecture** is one serverless function (`app/api/profile/route.ts`) that fans out to NHTSA recalls, NHTSA complaints, NHTSA NCAP, and EPA fuel-economy in parallel via `Promise.allSettled`, with a 3-second per-upstream timeout. Returns a single JSON profile to the frontend.
- **Scoring** keeps the naive transparent weighted-sum form from v0 spec §4.4, with **one addition this conversation introduced:** a component-severity multiplier on the recall penalty.
  - Recall component severity: Airbag / Fuel / Engine / Steering / Brakes → 2.0×; Powertrain / Electrical → 1.5×; everything else → 1.0×.
  - The `lib/upstream/recalls.ts` client now extracts `{component, year, summary}` per recall, not just a count.
  - The component-severity table is published in the README alongside the rest of the formula.
  - This is the mechanism that makes the dieselgate demo land without needing a curated list — NHTSA's `Component` field on those recalls is `FUEL SYSTEM, DIESEL` and `ENGINE`, both 2.0× bucket.
- **Verdict generator (`lib/summary.ts`)** has to *commit*, not hedge. For an F-grade dieselgate vehicle: name the unrepaired-recall components by category (e.g., "two unrepaired fuel-system recalls and a known emissions-related recall campaign"). For an A-grade vehicle: positive and specific (e.g., "no open recalls, five-star NCAP overall, Tier 3 emissions"). No "this vehicle has some issues" hedging.
- **Letter bands** unchanged from v0 spec §4.4: A ≥ 85, B ≥ 70, C ≥ 55, D ≥ 40, F otherwise. Five bands. Spec §8.2 deny-list forbids any other scale.
- **Caching** is in-memory LRU within the serverless function — warm-instance reuse only, no Redis, no KV.
- **Failure modes**: if more than two of five sub-scores are unavailable, render "not enough public data on this vehicle" instead of a composite. Per v0 spec §4.6.
- **Public-artifact hygiene** (v0 spec §8) is not optional. README, commit messages, Devpost description, deployed app copy — all reviewed against the §8.2 deny-list before publishing. The substitution table in §8.3 is the rulebook.

---

*Generated from the `/scope` conversation on 2026-04-24. The 442-line `RideCheck_Hackathon_Spec_v0.md` is the upstream source-of-truth document; this scope.md is the curriculum-shaped distillation, with two real refinements added in conversation: (a) the component-severity multiplier on recall scoring, and (b) the cut line that demotes VIN decode and Playwright E2E to stretch.*
