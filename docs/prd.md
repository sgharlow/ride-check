# RideCheck — Product Requirements

## Problem Statement

A used-car shopper considering a specific vehicle has thirty seconds to decide whether the listing is worth a closer look. NHTSA has the authoritative public records but renders no verdict; Carfax/AutoCheck render a verdict but hide the math behind a paywall; CarComplaints renders a verdict but looks like a 2010 forum. The buyer is stuck choosing between *trustworthy raw data they can't interpret* and *opaque grades they paid for.* RideCheck fills the empty cell on that grid: a clear A–F verdict on any year/make/model, with every weight and data source in the open, on free public data.

## User Stories

Stories are grouped into three epics plus a cross-cutting concern. Epic headings are stable reference addresses for `/spec` and `/checklist`.

### Epic A: Entering a Vehicle

- **US-1.** *As a buyer with a candidate vehicle in mind, I want to enter year, make, model, mileage, and price on a single screen and submit with one click, so I'm in the result page within five seconds.*
  - [ ] Home page renders an input form with five fields in this render order: Year, Make, Model, Mileage, Price.
  - [ ] Year is a dropdown bounded `1981` to `current_year + 1`, default unselected.
  - [ ] Make is a dropdown populated from a static top-50 makes list baked into the build (Toyota, Honda, Ford, Chevrolet, Nissan, Volkswagen, BMW, Mercedes-Benz, Hyundai, Kia, Subaru, Mazda, Jeep, Ram, GMC, Audi, Lexus, Acura, Infiniti, Cadillac, Buick, Lincoln, Volvo, Porsche, Land Rover, Jaguar, Mini, Mitsubishi, Tesla, Dodge, Chrysler, Fiat, Genesis, Alfa Romeo, Maserati, Bentley, Rolls-Royce, Ferrari, Lamborghini, McLaren, Aston Martin, Lotus, Smart, Saab, Saturn, Pontiac, Hummer, Suzuki, Isuzu, Scion). Default unselected. Disabled until Year is selected.
  - [ ] Model is a dropdown populated live from `vPIC GetModelsForMakeYear` after Year + Make are both selected. Default unselected. Disabled until Model list loads.
  - [ ] Mileage is a numeric input that defaults to `0`, accepts integers `≥ 0` only, no upper bound enforced client-side. (Form-level: a value of `0` means "user did not provide" and is the signal the Age & Wear formula uses to fall back to the year-only branch.)
  - [ ] Price is a numeric input, optional, accepts integers `≥ 0`, displayed cosmetically on the result card; does not affect the grade.
  - [ ] A single primary action button labeled **"Evaluate"** submits the form. Button is disabled until Year, Make, and Model are all selected.
  - [ ] Submitting transitions to a loading state within 100ms.
  - [ ] Cold-API result renders in under 5 seconds; warm result in under 1 second.
  - [ ] Form re-submission while a request is in flight cancels the in-flight request and starts a new one.

- **US-1a.** *As a buyer who hits an API failure, I want to be told clearly what went wrong, so I don't think the app is broken.*
  - [ ] If the Model list fetch from vPIC fails, the Model dropdown shows a single "Couldn't load models — try again" entry and the Evaluate button stays disabled.
  - [ ] If a network/timeout error occurs during Evaluate submission, the loading state is replaced by a single retry button and the message **"Couldn't reach our data sources — try again."**
  - [ ] If the YMM is valid but every public API returned no data for it, the result page shows a **"Not enough public data on this vehicle"** message — never a partially-rendered grade.
  - *(Note: typo / unknown-make / unknown-model error states from the v0 spec are eliminated by construction — the form has no free-text fields. Cascading dropdowns only allow valid combinations.)*

### Epic B: Reading the Verdict

- **US-2.** *As a buyer staring at the result, I want the letter grade to be the first and biggest thing I see, so I get the headline answer in under a second.*
  - [ ] Result card vertical hierarchy, top to bottom: vehicle identity (Year + Make + Model + mileage + price as cosmetic display) → letter grade as a large chip → numeric composite score (`xx / 100`) as a secondary number → plain-English verdict copy → five sub-score bars → data sources strip.
  - [ ] Letter grade chip is the largest single element on the card.
  - [ ] Numeric composite is shown smaller than the letter, never equal weight.
  - [ ] Mobile single-column reflow preserves the same vertical order.
  - [ ] Bars are monochrome (no green/yellow/red traffic-light coding). Visual restraint matches the calmly-authoritative design lens.
  - [ ] If price was provided, it renders as `$9,500` (USD, comma-separated) above the grade chip. If price is `0` or blank, no price line is rendered.

- **US-3.** *As a buyer, I want the result to tell me in plain English why this vehicle got the grade it did — naming the specific issues by category, not by jargon — so I know what I'm being warned about and can decide if it's a dealbreaker.*
  - [ ] The verdict copy appears below the score chip, before the sub-bar breakdown.
  - [ ] For grades C and below, the verdict names the specific sub-score categories that pulled the grade down, ranked by **contribution to grade reduction** (the lowest sub-score × its formula weight, descending).
  - [ ] Up to **the worst three** sub-score categories are named in the verdict copy. If a fourth or fifth is also in the danger zone, those reflect in the bar visualization but are not named in the verdict.
  - [ ] Recall categories in the verdict use NHTSA's `Component` field mapped to plain English (e.g., "fuel-system" / "airbag" / "engine"), not the raw API string.
  - [ ] For grades A or B, the verdict is positive and specific (e.g., "no open recalls, five-star NCAP overall, modern emissions controls").
  - [ ] Verdict length scales with content: 1 sentence for A-grade, up to 3 sentences for F-grade.
  - [ ] The verdict never uses hedge words: "some," "may have," "potentially," "might," "possibly." It commits to what the public data says.
  - [ ] The verdict copy stays calm in voice: factual, no exclamation marks, no all-caps, no scare quotes. The data carries the weight, not the prose.
  - [ ] The verdict is deterministic — the same input always produces the same verdict copy.

- **US-5.** *As a buyer who wants to verify the grade, I want every data source named and linked, so I can click through and check NHTSA / EPA myself.*
  - [ ] A "Sources" strip appears at the bottom of the result card.
  - [ ] Each of the four data sources used (NHTSA Recalls, NHTSA Complaints, NCAP Safety Ratings, EPA fueleconomy.gov) is named with a link to the relevant query for *this specific vehicle*, not the source homepage.
  - [ ] If a source returned no data for this YMM, it's still listed, with the note "no data returned" — transparency about gaps is part of the value.
  - [ ] A "How we calculate this" link (anchor or footer link) goes to the README's scoring section on GitHub.

### Epic C: First Impression and Discovery

- **US-6.** *(In scope, first to cut.)* *As a curious onlooker who hasn't typed anything yet, I want to click a sample vehicle from the landing page and see a fully-rendered result, so I understand what RideCheck does in one click.*
  - [ ] The landing page shows a "Try a sample" section with three cards spanning the grade range — at minimum: one A/B vehicle, one C/D vehicle, one F vehicle (the dieselgate-class demo car).
  - [ ] Clicking a sample card runs the same flow as entering a YMM manually — it does *not* short-cut to a cached static result. The demo's credibility depends on the live-API path being the path the user uses.
  - [ ] The sample-card area is visible without scrolling on a 1366×768 desktop viewport.
  - **Cut policy:** US-6 is the first feature dropped if Day 4 runs late. Cascading dropdowns serve as the discoverability mechanism if US-6 ships, and as the *only* discoverability mechanism if it doesn't.

- **US-4.** *(Stretch only — demoted from primary in `/scope`.)* *As a buyer who has a VIN, I want to enter that instead of YMM, so I don't have to look up the spec sheet first.*
  - If shipped: the form gets a "Have a VIN?" toggle that swaps the YMM dropdowns for a single 17-char VIN field, decoded via vPIC, and the rest of the flow is identical.

### Cross-cutting

- **US-7.** *As a buyer hitting the app during an NHTSA outage, I want a partial result rather than an error, so the app stays useful even when one data source is down.*
  - [ ] If 1 or 2 of the 4 data-driven sub-scores fail, the composite renders using **renormalized weights** across the remaining sub-scores, and the failed sub-bars display "data unavailable" instead of a numeric value.
  - [ ] If 3 or more sub-scores fail, no composite is rendered. The result page shows the **"Not enough public data on this vehicle"** state from US-1a.
  - [ ] No partial composite is ever shown without a small disclosure note on the card stating which sources were unavailable and that the composite has been renormalized.
  - [ ] Result URLs are shareable: pasting a `/profile/[query]` URL (or `?` query-string equivalent on `/`) into another browser produces the same result page. No share button, no Open Graph share-card metadata in v0.

## What We're Building

Everything below is in v0 scope. Each item has acceptance criteria above; this section names the scoping discipline, not the criteria.

- **Single-page Next.js 14 app** (App Router, TypeScript, Tailwind, Vercel free tier) deployed at a public URL.
- **Cascading Year/Make/Model dropdown form** (static top-50 makes, vPIC live model list) + Mileage + Price.
- **One serverless function** at `app/api/profile/route.ts` that fans out to 4 NHTSA/EPA endpoints in parallel, computes the composite, and returns JSON.
- **Composite scoring formula** with five sub-scores: Recalls (with component-severity multiplier), Complaints, Safety (NCAP), Emissions, Age & Wear. All weights, cut points, and the component-severity table published in the README.
- **Result card** with letter-grade hero, numeric composite, plain-English committing verdict (worst-3 categories named for grades C and below), monochrome sub-bars, sources strip with per-vehicle links, methodology link to README.
- **Three sample-vehicle cards** on the landing page covering different grade bands (US-6 — first to cut if Day 4 slips).
- **Graceful degradation** per US-7 (renormalized composite for 1–2 source failures, "not enough data" page for 3+).
- **Shareable URL** for results — query parameters in the URL, no share UI affordance.
- **Public GitHub repo** with MIT license and README that publishes the full scoring formula plus the component-severity table, no Section 8.2 deny-list language.
- **Vitest unit tests** on the scoring function and the verdict generator (deterministic output testable with fixed inputs).
- **Section 8 hygiene review** of all public artifacts before push.

## What We'd Add With More Time

Stretch items, in cut order from least-painful (top) to most-painful (bottom). Items are non-trivial enough to defer; cheap enough that `/iterate` could pick them up in a v0.1 pass after the deadline.

- **VIN decode entry path** (US-4) — toggle on the form, vPIC integration, identical downstream flow. ~30 min if all the form scaffolding is already in place.
- **Playwright happy-path E2E test** — one spec covering "open landing → submit a YMM → verify result card renders with letter + bars + verdict." Vitest stays primary either way.
- **Sample-vehicle cards on the landing page** (US-6 — already in scope but first to cut).
- **Open Graph share-card metadata** so a shared URL renders a preview image with the grade.
- **A second-vehicle compare view** — paste two URLs, see them side-by-side. Significant UI work; rejected explicitly in scope.md but obvious v1 candidate.
- **Free-text Make/Model entry as a fallback** to handle the long tail of makes outside the top 50. Adds back error states US-1a was originally written for.
- **Persisted last-N results in localStorage** so a user can revisit recent lookups. Crosses the scope.md "no save/share/history" line; explicit v1.

## Non-Goals

Explicit "we are NOT building this" list. Pulled from `scope.md` cuts, the v0 spec §2.2 deny-list, and decisions made in this PRD conversation.

- **No value sub-score keyed to Blue Book.** Decided in this conversation. KBB has no free public API; scraping is forbidden; paid alternatives violate the free-public-data positioning. Price stays cosmetic in v0.
- **No traffic-light color coding on sub-bars.** Decided in this conversation. Bars are monochrome. The grade letter and verdict copy carry the meaning; the design lens forbids visual oversell.
- **No fuzzy-matching on Make/Model.** Decided in this conversation. Cascading dropdowns make typos impossible by construction; we don't need a confidently-wrong fuzzy match suggesting a different car than the user meant.
- **No user accounts, no auth, no save/share/history, no payments.** From scope.md. The app is stateless.
- **No backend database.** From scope.md. The serverless function is stateless; no Postgres / no Redis / no KV in v0.
- **No mobile native apps.** From scope.md. Responsive web only.
- **No predictive ML.** From scope.md. v0 is rule-based on purpose; the transparent published formula is the value prop.
- **No inspection-program data, OBD/DTC/MIL signals, RSD/NOV records, or state-jurisdiction-specific calibration.** From v0 spec §8.2 deny-list. Hard line, applies to code, copy, README, commit messages, and Devpost submission.
- **No alternate scoring scales.** Five-band A/B/C/D/F only. Cut points 85/70/55/40 only. From v0 spec §8.2. (Explicitly forbidden: 0–1000 scales, six-band scales, percentile bands.)
- **No language gesturing at a "v1" or "production system" with specifics** in any public artifact. From v0 spec §8.2.

## Open Questions

Items unresolved at PRD time. Each flagged with whether it blocks `/spec` or can wait until build.

- **Exact coefficients of the new Age & Wear two-input formula.** Conversation locked the *shape* (`max(0, 100 − a × age_years − b × miles)` with `a` and `b` placeholders), not the values. **Blocks `/spec` §4.4.** Pin in `/spec` by computing what the formula returns for a few known sample vehicles (2014 Passat at 150k mi, 2018 Camry at 60k mi, 1999 Civic at 280k mi) and tuning until the band assignments feel right.
- **Exact coefficients of the recall component-severity multiplier.** Conversation locked the buckets (Airbag/Fuel/Engine/Steering/Brakes → 2.0×, Powertrain/Electrical → 1.5×, else → 1.0×) but not the weighting interaction with the count-based formula `100 − 15 × recall_count`. **Blocks `/spec` §4.4.** Verify by pulling the actual NHTSA recall response for a 2014 VW Passat TDI and confirming the dieselgate recalls' `Component` strings parse cleanly into the 2.0× bucket. Per `/scope` embedded feedback.
- **Permalink shape: `/profile/[query]` vs `/?ymm=...`.** Either works for the user-facing requirement (pasted URL produces same result). **Does not block `/spec`** — picked in `/spec` based on Next.js routing ergonomics. Default to `/profile/[query]` unless it adds non-trivial routing plumbing.
- **Plain-English mapping table for NHTSA `Component` strings.** Need a finite enumeration of the component categories used in verdicts ("fuel-system," "airbag," "engine," "powertrain," "electrical," "brakes," "steering," "suspension," "body," "other"). **Does not block `/spec`** — finalized during `lib/summary.ts` build.
- **Sample-vehicle YMM choices for US-6 cards.** Need three concrete YMMs: one A/B, one C/D, one F (dieselgate-class). **Does not block `/spec`** — picked during build, can be smoke-tested live against the deployed API in 5 minutes.
- **Top-50 makes list — is the list above complete?** It includes some defunct makes (Saab, Saturn, Pontiac, Hummer, Scion) that have used vehicles in the wild. Likely fine but worth a sanity check at build time. **Does not block `/spec`** — list is editable until form ships.
