# RideCheck — Hackathon Submission Spec (v0)

**Working title:** RideCheck (suggested; check trademark availability before publishing)
**One-line summary:** A buyer-facing public-data risk profile card for used-vehicle shoppers
**Target hackathon:** Devpost Learning Hackathon — Spec Driven Development
**Submission deadline:** April 29, 2026, 5:00 PM EDT
**Status:** Spec for v0. This is a public concept demo. The production system is a separate workstream and is not described in this document.

---

## 0. How to use this document

This is a starting-point spec to bring into the Claude Code spec-driven plugin process. The plugin will walk through scoping, requirements, technical spec, and build checklist conversationally; the goal of this document is to give that conversation a defensible starting point that stays inside a deliberately narrow scope.

Two non-negotiable constraints apply to every section that follows:

1. **The demo uses only public data sources** — NHTSA APIs, EPA fuel economy data, the vPIC VIN decoder. No data from any inspection or maintenance program is used or referenced.
2. **The scoring methodology is intentionally naive** — a transparent weighted sum across public signals. It is not the production scoring approach and is not described as such in any public artifact.

Both constraints exist to keep the public submission cleanly outside the territory of any pending or future patent work on a richer scoring product.

---

## 1. Project description (Devpost-facing)

> RideCheck is a single-page web app that gives prospective used-car buyers a quick public-record risk profile of any year/make/model combination. Enter a YMM (or a VIN, which we decode to YMM); get back a one-card summary with an A–F letter grade and five sub-scores covering open recalls, complaint volume, crash-test safety, EPA emissions tier, and vehicle age. Inspired by the FICO score's visual language, the AutoCheck score's banding, and the NHTSA five-star safety rating's familiarity. v0 uses a transparent weighted sum across NHTSA and EPA public APIs — every input is auditable, every weight is in the README, and every data source is free.

Three things this framing does deliberately:

- Anchors comparators only on public, well-known scoring products
- Names every data source, proving nothing proprietary is involved
- Calls itself v0 explicitly, signaling a richer version exists elsewhere without describing what it is

---

## 2. Scope document

### 2.1 In scope

- **Public data inputs only:** NHTSA recalls API, NHTSA complaints API, NHTSA NCAP star ratings, EPA fueleconomy.gov, vPIC VIN decoder
- **Single-page web application** — no native apps, no auth, no user accounts
- **Year/make/model lookup** with optional VIN-decode entry path
- **Five sub-scores** rolled into a composite letter grade (A through F, five bands)
- **Plain-English summary line** explaining the grade
- **Three to five sample vehicles** seeded for demo purposes (one each across A/B/C/D/F bands ideally)
- **Naive transparent weighted-sum scoring** with weights and cut points published in the README
- **Stateless serverless deployment** suitable for Vercel, Netlify, or Cloudflare Pages
- **Open-source repository** with README, license (MIT), and run instructions

### 2.2 Explicitly out of scope

These are out of scope for sound product reasons (v0 is a public-data concept demo) and they are also the boundary of what the public submission must not touch. Each of these belongs to a different workstream and is not part of this hackathon project.

- Any inspection-program data of any kind (state I/M test outcomes, OBD inspection signals, MIL or DTC records, station-level test data)
- Any roadside or remote-sensing emissions measurement data
- Any state-jurisdiction-specific calibration of failure rates or scoring weights
- Any prediction of the outcome of a state-mandated inspection — the demo describes "public reliability signals," not "inspection failure probability"
- Any cross-state vehicle-history or evasion-pattern features
- Any specific scoring band cut points or weights from any other product or workstream
- Any score-to-failure-probability calibration mapping
- Premium data sources: CARFAX, AutoCheck, CarMD, LexisNexis, Verisk, NMVTIS title brand, OEM warranty data
- User accounts, payment processing, dealer integrations
- Predictive ML models — v0 is rule-based on purpose
- Mobile native apps
- A backend database — the app is stateless

### 2.3 Success criteria

The submission is complete if and only if all of the following are true:

- A working web app is deployed at a public URL
- The repo is public and clones-and-runs from a clean checkout following the README
- Three to five seeded sample vehicles render correctly with all five sub-scores
- A user can enter a new YMM and see results in under 5 seconds (cold) and under 1 second (warm)
- The four spec-driven-development artifacts (scope, requirements, technical spec, build checklist) are present in the docs folder
- The README contains the language hygiene constraints from Section 8 of this document

There is no comparative judging in this hackathon — completion is the only criterion — so "win" means "submission accepted and badge earned."

---

## 3. Requirements

### 3.1 User stories

#### Primary user: a used-car shopper considering a specific vehicle

- **US-1.** *As a buyer, I want to enter a year/make/model and see a single risk grade, so I can quickly compare candidates without reading a 30-page report.*
  - Acceptance: input form takes year, make, model; returns within 5 seconds; displays a single A–F letter grade prominently.
- **US-2.** *As a buyer, I want to see the components behind the grade, so I understand what the grade means and what's driving it.*
  - Acceptance: five sub-scores are displayed, each with the data source labeled and the contribution to the composite shown.
- **US-3.** *As a buyer, I want a one-sentence plain-English summary, so I don't have to interpret the breakdown myself.*
  - Acceptance: a sentence is generated for each result, customized to the band (e.g., "This vehicle scores A — public records show no open recalls, strong crash safety, and modern emissions controls.").
- **US-4.** *As a buyer who has a VIN, I want to enter that instead of typing year/make/model, so I don't have to look up the spec sheet first.*
  - Acceptance: VIN field accepts 17-character input; vPIC API decodes to YMM; flow continues identically.
- **US-5.** *As a buyer, I want to see what data sources backed the grade, so I can trust it and look up details if I want.*
  - Acceptance: a "data sources" section links to NHTSA recalls, NHTSA complaints, NHTSA NCAP, EPA fueleconomy.gov, vPIC.

#### Secondary user: a curious onlooker

- **US-6.** *As someone exploring the app, I want to click a sample vehicle and see what the result looks like, so I can understand the product before entering my own data.*
  - Acceptance: home page shows three to five clickable example vehicles; clicking one renders a full result.

### 3.2 Non-functional requirements

- **Latency:** p95 response under 5 seconds cold, under 1 second warm
- **Availability:** static-frontend + serverless-functions architecture; uptime depends on hosting platform
- **Accessibility:** semantic HTML, alt text on images, keyboard navigation, sufficient color contrast (WCAG 2.1 AA)
- **Mobile:** responsive layout, single-column on widths under 600px
- **Privacy:** no logging of user inputs, no analytics SDK in v0, no cookies
- **Cost:** zero recurring cost — all APIs used are free, deployment fits on free tiers

### 3.3 Out-of-scope requirements

- No personalization, no user history, no save / share functionality in v0
- No comparison-of-two-vehicles view in v0 (could be v1)
- No price information, no dealer integration
- No interpretation of individual recall severity beyond count
- No mobile native apps

---

## 4. Technical spec

### 4.1 Architecture

```
[Browser]
   │
   │ user enters YMM or VIN
   ▼
[Static frontend]              ◄── deployed to Vercel/Netlify/Cloudflare Pages
   │
   │ POST /api/profile
   ▼
[Serverless function]          ◄── one function, fan-out
   │
   ├─► vPIC API (if VIN)       ◄── decode → YMM
   ├─► NHTSA Recalls API
   ├─► NHTSA Complaints API
   ├─► NHTSA NCAP Ratings API
   └─► EPA Fuel Economy API
   │
   │ aggregate, score, package
   ▼
[Frontend renders profile card]
```

No database. No persistent state. The serverless function is the only backend logic; it fans out to the five public APIs in parallel, computes the composite score, and returns a JSON payload the frontend renders.

### 4.2 Tech stack

- **Framework:** Next.js 14 (React, App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, no UI library
- **Deployment:** Vercel (free tier), with a Cloudflare Pages fallback
- **API client:** native fetch in serverless function with 3-second timeout per upstream and AbortController for parallelism
- **Caching:** simple in-memory LRU within the serverless function for warm-instance reuse; no external cache in v0
- **Testing:** Vitest for unit tests of the scoring function; Playwright for one happy-path E2E
- **Linting:** eslint + prettier with default Next config

This stack is chosen for shippability in five days, not novelty. Every choice is the most boring option that works.

### 4.3 Data sources and endpoints

| Source | Endpoint | What we extract |
| :--- | :--- | :--- |
| vPIC VIN decoder | `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}?format=json` | year, make, model |
| NHTSA recalls | `https://api.nhtsa.gov/recalls/recallsByVehicle?make=X&model=Y&modelYear=Z` | count of recalls returned |
| NHTSA complaints | `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=X&model=Y&modelYear=Z` | count of complaints returned |
| NHTSA NCAP | `https://api.nhtsa.gov/SafetyRatings/modelyear/{year}/make/{make}/model/{model}` | overallRating (1-5 stars) |
| EPA fuel economy | `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=X&make=Y&model=Z` | EPA emissions tier (derived from year) |

Every endpoint is free, public, and has been used in the search results we observed during planning. No API keys required for any of them.

### 4.4 Scoring methodology

The composite score is a deliberately simple weighted sum of five sub-scores. Each sub-score is independently computed on a 0–100 scale, then combined.

```
sub_recalls    = max(0, 100 − 15 × open_recall_count)
sub_complaints = max(0, 100 − complaint_normalization(yamm_complaints))
sub_safety     = 20 × ncap_overall_star_rating          // 0 if no rating available
sub_emissions  = emissions_tier_lookup(year)            // see table below
sub_age        = max(0, 100 − 3 × (current_year − model_year))

composite = 0.25 × sub_recalls
          + 0.15 × sub_complaints
          + 0.25 × sub_safety
          + 0.20 × sub_emissions
          + 0.15 × sub_age

letter = A if composite >= 85
       = B if composite >= 70
       = C if composite >= 55
       = D if composite >= 40
       = F otherwise
```

Emissions tier sub-score lookup, derived from EPA-published model-year tier definitions:

| Model year | Tier | Sub-score |
| :--- | :--- | ---: |
| 2017 + | 3 | 100 |
| 2004–2016 | 2 | 75 |
| 1994–2003 | 1 | 50 |
| pre-1994 | 0 | 25 |

Every weight, every cut point, every coefficient in this section is published in the README. This is intentional: the v0 prototype's value proposition is transparency, not predictive power.

A note for the conversation in the spec-driven plugin: do not adjust this scoring to align with anything from a different workstream. The naive transparent form is the right form for this prototype, both from a UX perspective (auditability) and from a project-hygiene perspective (Section 8).

### 4.5 UI/UX design

Single-page, single-card layout. Inspirations referenced in the README: a credit-score summary card and the NHTSA five-star safety label.

```
┌───────────────────────────────────────────────────────┐
│   2008 Ford F-250 Super Duty                          │
│                                                       │
│           ╭───╮                                       │
│           │ D │     Score: 47 / 100                   │
│           ╰───╯                                       │
│                                                       │
│   Recalls       ████░░░░░░  40                        │
│   Complaints    ██████░░░░  62                        │
│   Safety (NCAP) ██████░░░░  60                        │
│   Emissions tier ███████░░  75                        │
│   Age           ██░░░░░░░░  46                        │
│                                                       │
│   This vehicle's grade is D — public records show     │
│   multiple unrepaired recalls and a Tier 2 emissions  │
│   profile typical of vehicles 18+ years old.          │
│                                                       │
│   Sources: NHTSA Recalls · NHTSA Complaints · NCAP    │
│            · EPA fuel-economy.gov · vPIC              │
└───────────────────────────────────────────────────────┘
```

Style notes: large letter grade, secondary numeric score, five horizontal sub-bars with raw values, plain-English summary, sources list. Mobile collapses to single column. Print stylesheet for screenshot-friendliness.

### 4.6 Failure modes and graceful degradation

- **NHTSA API timeout:** sub-score is reported as "data unavailable" and excluded from composite; weights of remaining sub-scores are renormalized so the grade is still produced
- **Unknown YMM / no NCAP rating:** sub_safety = 0, surfaced explicitly to user
- **Invalid VIN:** clear error message; suggest YMM entry instead
- **Rate-limit response from any upstream:** retry once with exponential backoff, then degrade as above

Composite is never displayed if more than two of five sub-scores are unavailable; instead, a "not enough public data on this vehicle" message is shown.

---

## 5. Build checklist

Day-by-day, assuming a Friday-through-Tuesday timeline ending at the April 29 EDT deadline. Most participants finish in 4–6 hours total per the hackathon brief; the schedule below is generous.

### Day 1 — Friday

- [ ] Run the Claude Code plugin's scoping conversation with this document as a starting point
- [ ] Confirm scope in/out matches Section 2 of this spec
- [ ] Save scoping output to `docs/01_scope.md`

### Day 2 — Saturday

- [ ] Run the requirements conversation; refine US-1 through US-6 with the plugin's prompts
- [ ] Save requirements doc to `docs/02_requirements.md`
- [ ] Confirm acceptance criteria are testable
- [ ] Run the technical-spec conversation; finalize tech stack and architecture
- [ ] Save technical spec to `docs/03_technical_spec.md`

### Day 3 — Sunday

- [ ] Scaffold Next.js project with TypeScript and Tailwind
- [ ] Build the serverless function with one upstream API integrated end-to-end (recommend NHTSA recalls — simplest)
- [ ] Add scoring function with unit tests for each sub-score
- [ ] Wire up the rest of the upstream APIs in parallel
- [ ] Verify a known sample (e.g., a 2008 Ford F-250) returns sensible output

### Day 4 — Monday

- [ ] Build the result-card UI
- [ ] Add the YMM and VIN input forms
- [ ] Add three to five sample-vehicle quick-start cards on the landing page
- [ ] Implement graceful degradation per Section 4.6
- [ ] Add a Playwright happy-path E2E test
- [ ] Deploy to Vercel; set custom subdomain if available
- [ ] Smoke test the public deployment from a clean browser

### Day 5 — Tuesday

- [ ] Final README pass — apply the language-hygiene checklist in Section 8 of this document
- [ ] Verify the docs folder contains all four required artifacts
- [ ] Zip the docs folder
- [ ] Submit to Devpost: project description, public repo URL, deployed URL, zipped docs
- [ ] Verify the submission is marked "complete"

Buffer day: there isn't one. Treat the deadline as a real one.

---

## 6. Project structure

```
ridecheck/
├── README.md                 ← public-facing; apply Section 8 hygiene
├── LICENSE                   ← MIT
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── docs/                     ← submitted zipped, private to Devpost staff
│   ├── 01_scope.md
│   ├── 02_requirements.md
│   ├── 03_technical_spec.md
│   └── 04_build_checklist.md
├── app/
│   ├── layout.tsx
│   ├── page.tsx              ← landing page with sample cards
│   ├── profile/[query]/page.tsx
│   └── api/profile/route.ts  ← single serverless function
├── lib/
│   ├── scoring.ts            ← weighted-sum composite (see 4.4)
│   ├── upstream/
│   │   ├── recalls.ts
│   │   ├── complaints.ts
│   │   ├── ncap.ts
│   │   ├── fuel-economy.ts
│   │   └── vpic.ts
│   └── summary.ts            ← plain-English grade-to-sentence generator
├── components/
│   ├── ProfileCard.tsx
│   ├── ScoreBars.tsx
│   ├── InputForm.tsx
│   └── SampleVehicles.tsx
├── tests/
│   ├── scoring.test.ts
│   └── e2e.spec.ts
└── public/
    └── og-image.png
```

---

## 7. Risks and mitigations

| Risk | Likelihood | Mitigation |
| :--- | :--- | :--- |
| NHTSA API rate-limits or downtime during demo | Low | Cache successful upstream responses for 24h in serverless instance memory; show degraded-mode message if unavailable |
| Unknown / sparse data for some YMM combinations | Medium | Display "limited data" disclaimer and renormalize weights as in 4.6 |
| Time pressure causes scope creep | Medium | Cut features to fit the day-5 deadline; the badge requires only completion, not polish |
| README or commit message accidentally references out-of-scope data sources | Medium | Apply the hygiene checklist in Section 8 before every push |
| Trademark conflict on "RideCheck" | Low | Do a USPTO TESS search before publishing; if conflicted, swap to a generic placeholder name |

---

## 8. Public-artifact language hygiene

This section is the entire reason this spec exists. Every public-facing artifact (the GitHub repo, README, commit messages, Devpost project description, deployed app, demo video) must be reviewed against the rules below before publishing.

### 8.1 What to include in the public artifacts

- The five public data sources by name, with links
- The complete scoring formula from Section 4.4, including weights and cut points
- The five-band letter scale (A/B/C/D/F)
- "v0 prototype" framing throughout
- Public-domain comparator references (FICO, AutoCheck, NHTSA five-star)
- The generic claim that public-data signals can summarize buyer-relevant vehicle reliability

### 8.2 What to exclude from every public artifact

The following are out of scope for the demo and are not described, hinted at, or alluded to in any public artifact. Treat these as a strict deny-list when writing the README, the project description, and the demo video script.

- Inspection program data of any kind — state I/M tests, OBD-during-inspection signals, MIL status from inspections, DTCs from inspections, station-level test data
- Roadside or remote-sensing emissions measurements
- State-specific calibration of risk or failure rates
- Any prediction of inspection-failure probability — the demo *summarizes public records*, it does not *predict failure*
- Cross-state vehicle-movement features or evasion-detection
- Six-band scales, 0–1000 score scales, or band cut points other than 85/70/55/40 from Section 4.4
- The phrases "state-cohort," "calibrated baseline," "signal lift," or "threshold sweep"
- References to RSD, NOV, federal-standard multiples, EPA tiers below the year-based level used in 4.4
- Any phrase containing "what we're patenting," "novel approach," "proprietary scoring," or "production system"
- Any data file from any other workstream

### 8.3 Substitution language

When the impulse arises to describe what makes the project interesting in a way that overlaps the deny-list, the substitution below preserves the public framing:

| Don't say | Say instead |
| :--- | :--- |
| "Predicts inspection failure" | "Summarizes public reliability signals" |
| "Calibrated against real-world data" | "Computed from public NHTSA and EPA data" |
| "Production model uses [X]" | "Future versions could include richer data sources" |
| "Beyond the basic score" | (delete; don't gesture at v1) |
| "Trained on [anything]" | (delete; v0 is rule-based, no training) |
| "Industry-leading" | "Public-data demo" |

If a description would be true for both v0 and the production system, prefer the version that's true only for v0.

### 8.4 README review checklist

Before pushing the final README, check each item:

- [ ] Every data source named is on the public-API list in 4.3
- [ ] No mention of inspection programs, OBD, DTCs, MIL, RSD, or NOV
- [ ] No reference to state-specific calibration
- [ ] No claim that the score predicts inspection outcomes
- [ ] No language gesturing at a "v1" or "production" with specifics
- [ ] No band cut points or score scales other than the ones in 4.4
- [ ] No project-internal data files referenced
- [ ] Phrase "v0 prototype" or "concept demo" appears at least once
- [ ] License is MIT and clearly stated
- [ ] All five data source links resolve

If any of these fail, fix before pushing.

---

## 9. Out-of-band considerations

These are not part of the spec but are flagged for awareness:

- **Provisional patent filing.** The cleanest path for the broader product is to file a provisional patent application before this v0 demo goes public. A provisional gives a 12-month runway and preserves international rights, which public disclosure otherwise destroys. If filing within five days isn't realistic, the deny-list above is designed to keep this v0 narrow enough that it does not constitute enabling disclosure of the production-system claims. Consult a patent attorney before publishing if there is any doubt.
- **Trademark search.** "RideCheck" is a working title. Run a USPTO TESS search and a basic trademark sweep before publishing. If conflicted, swap to a placeholder like "Public Vehicle Profile" or "VIN Card Demo."
- **Future versioning.** A v1 of this product line is a separate workstream and is not a continuation of this code. Do not commit v1 code to this repository or reference v1 in commit messages.

---

## 10. Definition of done

This spec is "done" when the user has:

1. Submitted a working app deployed to a public URL
2. Pushed a public repository that builds from a clean clone
3. Uploaded a zipped `docs/` folder containing all four spec-driven artifacts
4. Completed the Devpost submission form with project description, repo URL, and deployed URL
5. Received a Devpost completion badge

The spec is "successful" if no public artifact contains any item from the deny-list in Section 8.2.

---

*End of spec. Bring this into the Claude Code spec-driven plugin process and let the plugin walk through scope → requirements → technical spec → build checklist conversationally. Resist the urge to make the prototype more sophisticated than the scope here; the discipline of staying narrow is the entire point.*
