# Process Notes

## /onboard

- **Technical experience:** Experienced engineering manager who codes regularly with heavy AI-agent use. Skip primers.
- **Preferred stack:** Next.js + TypeScript + Vercel. Editor: Claude Code (primary) + Windsurf.
- **Learning goal:** Evaluate spec-driven development as a *transferable pattern for his team*. The curriculum is being reverse-engineered into a teaching artifact, not just used to ship an app. Every step is dual-purpose — flag teachability moments as we go.
- **Creative sensibility:** Currently reading Orson Scott Card; writing a book on AI Leadership. Design lens: transparent, calmly authoritative, no flash. UI doesn't oversell.
- **Prior SDD experience:** Significant — has used **AWS Kiro**, the closest sibling to this curriculum. He is comparing implementations, not learning the concept. `/reflect` should ask comparative/evaluative questions, not introductory ones.
- **Notable context:** Folder already contains a 442-line `RideCheck_Hackathon_Spec_v0.md` — a deliberately-narrow public-data-only spec with a strict Section 8.2 deny-list. Downstream commands should treat it as a strong starting draft to refine, and respect the deny-list (no inspection-program / OBD / DTC / RSD language in public artifacts). Hackathon deadline: 2026-04-29 5pm EDT.
- **Engagement style:** Crisp, no-nonsense, low-overhead answers. Wants the substance, doesn't need hand-holding. Match that energy.

## /scope

- **How the idea evolved.** Starting state: a 442-line defensive spec that named what RideCheck *won't* be but didn't quite say what it *is*. The brain-dump question had to be adapted — "tell me everything" is insulting to someone with that much already on paper. Re-asked as "what's the demo moment that makes you lean in?" and got the dieselgate-catch-the-known-bad-car answer immediately. That answer became the load-bearing design constraint for the rest of the conversation.
- **Pushback / refinements.**
  - Steve mentioned "mileage" as an input. Flagged that none of the public APIs return mileage; either it's user-entered (feeds an age/wear adjustment) or cosmetic. He didn't push back; mileage is captured in scope.md as explicitly-not-added in v0.
  - Steve mentioned "warning" as a UI element. Flagged that this implies either component-severity scoring or a curated YMM list. Led directly to the (a)/(b)/(c) decision in question 3.
- **References that resonated.** Carfax's visual restraint plus a clear verdict — Steve picked that explicitly out of the four-cell comparator grid (NHTSA, EPA, CarComplaints, Carfax/AutoCheck). The "fill the empty cell on the grid" framing was useful.
- **Decision made in conversation that wasn't in the v0 spec:** component-severity multiplier on the recall sub-score (option b). NHTSA's `Component` field × a 2.0× / 1.5× / 1.0× lookup table. This is the mechanism that makes the dieselgate demo land without a curated YMM list. Locked into scope.md and propagated as an instruction to `/spec` (§4.4 scoring + §6 project structure + README publishing requirement).
- **Cut decisions made in conversation.** VIN decode (US-4) demoted to stretch; Playwright E2E demoted to stretch. Vitest unit tests on scoring stay non-negotiable. Summary generator (`lib/summary.ts`) declared not-cuttable because it carries the demo moment.
- **Deepening rounds:** Steve chose to skip deepening rounds and generate scope.md directly after the four mandatory questions. Worth noting for /reflect — efficient learner with strong starting context skipped the "go deeper" offer, which is the right call for his profile but worth comparing to a less-experienced learner who would benefit from the rounds.
- **Active shaping.** Steve drove every decision point: he picked the Carfax aesthetic (open question), he picked option (b) over (a) and (c) (3-way choice), he confirmed the cut line (proposed but he could have moved it). He did not contribute ideas I hadn't proposed — but he made every call.
- **Teachability moments flagged for /reflect.**
  - The opener has to adapt when the learner arrives with substantial pre-work. The script-following version of /scope would have failed.
  - The "comparator grid with one empty cell" framing was a useful improvisation in question 2's research-and-react beat — would translate to a workshop as a generic move.
  - The deepening-round opt-out is a transplantable pattern: explicit choice between "ship" and "go deeper" lets the learner control depth without the facilitator guessing.

## /prd

- **What changed vs. scope.md.** The PRD revealed real revisions Steve hadn't surfaced in /scope:
  - **Mileage came back as an input.** Steve had agreed in /scope to drop it as cosmetic; in the journey walkthrough he reflexively listed it as a form field. Caught and re-decided: mileage feeds the Age & Wear sub-score (renamed from Age) via a published two-input formula. Net add: ~30 min of build, 1 sub-score formula change.
  - **Price was new.** Not in scope.md or the v0 spec at all. After flagging the three options (cosmetic / value sub-score / drop), Steve picked "value sub-score keyed to Blue Book." That triggered the second pushback: KBB has no free public API. After the (v-a)/(v-b)/(v-c)/(v-d) breakdown Steve reverted to (v-d) cosmetic. This was the largest pushback-and-recover of the conversation.
  - **Cascading dropdowns** replaced free-text Make/Model fields. Steve drove this — he answered "what if user types a typo" with "dropdowns prevent it," which collapsed three US-1a error branches but added ~3 hrs of build for the dropdown-population plumbing. Recovered ~1.5 hrs by static-baking the top-50 makes list.
  - **Worst-3 ranking** for the verdict copy. Replaces the v0 spec's vague "customized to band" with a deterministic "rank sub-scores by contribution to grade reduction, name top 3 in copy."
  - **US-6 demoted to "first to cut."** Made room for the dropdown UX without going over budget.

- **What "what if?" surprises landed.** The two with real teeth:
  - The KBB / value-sub-score rabbit hole. Steve initially picked the most ambitious option without seeing the data-source problem; the (v-a)→(v-d) walk-through worked.
  - The cascading-dropdown decision's downstream cost. Steve's answer was correct UX-wise but tripled the form's complexity. Naming the cost explicitly let him make the right call (static top-50) instead of finding out on Day 3.

- **What Steve felt strongly about.**
  - Verdict has to commit, not hedge. He explicitly affirmed the revised US-3 wording, including the no-hedge-words rule.
  - No traffic-light coding on bars. He said "colors = no" with no elaboration — strongly tracks his "calmly authoritative, no flash" design lens from learner-profile.

- **Scope guard outcome.** Net-net the build is bigger than scope.md had it. ~3 hrs added by dropdowns, partially recovered by static top-50 (~1.5 hrs back) and US-6 demotion (~1 hr saved if it gets cut). Verdict-generator worst-3 ranking is a real adder over the spec's per-band template approach. Buffer is gone but the build is achievable.

- **Deepening rounds.** Steve again chose to skip and went straight to (D) generate. Same pattern as /scope — efficient learner with strong starting context doesn't need the rounds. The teaching-artifact (C) round in particular is a missed opportunity for /reflect data; flagging for the workshop transplant analysis.

- **Active shaping.** Steve drove every decision point, including the ones I expected him to defer to me on:
  - Picked option (b) component-weighted recalls in /scope — drove the technical mechanism that makes the demo land.
  - Re-introduced mileage and price unprompted — drove the input-form scope expansion.
  - Insisted on dropdowns when offered free-text-with-error-states — drove the form UX.
  - Confirmed worst-3 verdict ranking instead of name-all or name-2-plus-other — drove the verdict copy spec.
  He passively accepted my recommendations only on lower-stakes calls (kill-order for stretch list, static-top-50 simplification, mobile "make it not break" sufficiency).

- **Teachability moments flagged for /reflect.**
  - The price → KBB → no-free-API moment is a clean workshop scenario: a learner casually adds a feature in a journey question, the facilitator's job is to surface that the feature has no clean data path, and force a real decision before /spec. Translates directly.
  - The dropdown decision's downstream-cost naming is the SDD payoff in miniature: 2 minutes of facilitator pushback saved 3 hrs on Day 3. This is the single most-translatable beat in the curriculum so far.
  - The journey walkthrough as Q1 (instead of generic "what does the user see?") was a genuine improvement for someone with a strong starting spec — adapting the question to the learner's prep state matters.

## /spec

- **Stack confirmed quickly.** Next.js 14 (not 16), TypeScript, Tailwind, Vercel free tier on default `*.vercel.app` URL. Steve picked 14 over 16 explicitly — battle-tested, doesn't need Next.js 16 Cache Components for a single-form lookup app. Compressed Q1 + Q2 into one check-in since the v0 spec already locked the stack; the senior-engineer calibration worked.
- **Live API research surfaced five findings, four of them real.**
  1. Recall `Component` strings are colon-hierarchical (`AIR BAGS:FRONTAL:DRIVER SIDE:INFLATOR MODULE`), not flat. Mechanical fix.
  2. NCAP requires TWO sequential API calls, not one. Architecture diagram changed from pure parallel fan-out to 3-parallel + 1-sequential.
  3. Complaints API for 2014 Passat returns 588 — naive `100 − count` floored at 0. Locked log10 normalization: `max(0, 100 − 20 × log10(count + 1))`.
  4. **EPA fueleconomy.gov has NO emissions-tier field.** The v0 spec's emissions sub-score was always going to be derived from year locally. Net change: drop EPA from runtime fan-out entirely, list EPA Tier methodology as a footnote reference. Cleaner architecture. The v0 spec contained a phantom dependency that /spec caught.
  5. **Dieselgate isn't an NHTSA recall — it's an EPA enforcement action.** The 2014 Passat returns 10 ordinary recalls in NHTSA's API but the actual emissions-cheat doesn't appear there. **This was the highest-stakes /spec finding** — it broke the original demo narrative ("type the dieselgate Passat, see the verdict pop").
- **Pivoted demo car from 2014 Passat to 2007 Honda Civic.** Steve picked option (β) — pick a different F-grade demo car with cleaner public-data alignment. Live API check confirmed 2007 Civic returns 9 recalls with 6 airbag-inflator (Takata) recalls in the 2.0× severity bucket. F-grade demo lands honestly: "multiple unrepaired airbag inflator recalls related to propellant degradation." 2014 Passat retained as secondary demo (D-grade, multi-category recalls — honest answer to a curious dieselgate query).
- **Architecture decisions Steve drove (not me).**
  - HTTP-only between result page and `/api/profile` (overrode my recommendation of direct-import, accepting the ~10–30ms latency in exchange for a single contract).
  - Single `[query]` slug segment on `/profile/` route (overrode my proposed nested `[year]/[make]/[model]`).
  - `lib/` structure as proposed (accepted).
  - `(1a)` Tighten per-upstream timeout from 3s to 2s (accepted my recommendation).
- **Self-review (Phase 2 D) caught three real issues.** Ran honestly, not performatively. The three: (i) Vercel cold-start math vs. PRD's 5s SLO worst-case 6–8s, (ii) `loading.tsx` was missing from the file tree (user would see a blank page on Evaluate → result navigation), (iii) `lib/baseUrl.ts` was missing (HTTP-only locks server-component fetch on absolute URL with three-environment resolution). Steve confirmed all three and fixes are in spec.md. The self-review was the highest-leverage deepening round; flagging for /reflect.
- **Coefficient open-questions resolved with locked baselines.** Age & Wear: `score = max(0, 100 − 2 × age − 0.0002 × mileage)` with mileage=0 fallback to year-only. Recall component-severity: prefix-match table with 2.0× / 1.5× / 1.0× tiers. Complaints normalization: `max(0, 100 − 20 × log10(count + 1))`. Tunable during build via fixture-based test cases on the three demo vehicles, but locked enough for /checklist.
- **Active shaping.** Steve made every consequential call without deflecting:
  - Picked Next.js 14 over 16.
  - Picked Takata over dieselgate when the data didn't support the original demo narrative.
  - Overrode my direct-import recommendation in favor of HTTP-only.
  - Overrode my nested-route in favor of single-slug.
  - Took (1a) timeout-tighten over (1b) SLO-relax — interesting because (1a) is the more conservative choice.
  He accepted my proposals on lower-stakes decisions (lib structure, slug encoding rule, severity table prefixes, complaints normalization formula).
- **Deepening rounds.** Steve picked D then E (self-review then generate). First time he opted into a deepening round across all three commands. The self-review delivered real value (3 finds, all confirmed). The (A) coefficient-lock round was also recommended and was skipped — coefficients are locked in /spec as baselines, but a follow-on tuning pass during /build would have produced higher confidence. Worth flagging for /reflect — the trade-off between locking-with-defensible-baselines and locking-with-empirical-tuning is a real workshop question.
- **Teachability moments flagged for /reflect.**
  - **The dieselgate-isn't-an-NHTSA-recall finding is the most translatable workshop beat in the entire curriculum so far.** It's a perfect example of why /spec exists: the v0 spec, /scope, AND /prd all carried an unverified assumption ("we'll catch dieselgate via NHTSA recall data") for ~3 hours of conversation, and only the live-API check in /spec exposed the gap. The fix was small (swap demo car to 2007 Civic) but the lesson — *verify upstream data shape before building, not after* — is the entire SDD value proposition in one beat.
  - **The phantom EPA dependency.** The v0 spec confidently listed EPA fueleconomy.gov as a data source for emissions tier, which was never actually correct. The architecture would have collapsed in /build when whoever was writing `lib/upstream/epa.ts` discovered the API doesn't return tier data. /spec caught it before /build. Direct fuel for the workshop's "live-research-during-spec" beat.
  - **Self-review as a built-in phase.** The (D) deepening option is genuinely valuable — the agent stepping back and reviewing its own draft caught three real issues, two of which would have caused build stalls. Translates well to a workshop pattern: every spec gets a self-review pass before lock.

## /checklist

- **Sequencing decisions.** 12 items, ~5–6 build hours total. Key non-default sequencing choice: **deploy hello-world to Vercel as item 2**, immediately after the scaffold. Catches Vercel-specific issues (env-var resolution in `lib/baseUrl.ts`, function timeouts, fetch-cache behavior, build-time config) on Day 1 instead of Day 4. The cost is 15 minutes; the benefit is hours of avoided debugging on a deadline day.
- **Pure-function libs come before any UI work.** Items 3–5 build types/slug/baseUrl/makes/years, all 7 scoring modules, and the verdict generator before a single React component is written. Reasoning: the spec's coefficients are locked, the formulas are deterministic, and Vitest tests can verify everything without a browser. Front-loading the testable code reduces the risk surface for the items that depend on it.
- **API clients (item 6) come before the orchestrator (item 7) before the form (item 8) before the result page (item 9).** Strict dependency order. Each item has end-to-end verification that proves the layer works before the next layer assumes it does.
- **Sample vehicles (item 10) intentionally come AFTER the result page (item 9).** Sample cards are the "first-to-cut" feature. By placing them after the result page and the production-ready API, cutting them is a 5-minute delete with zero cascade. If item 10 is dropped, items 11 and 12 still ship cleanly.
- **README + production deploy is item 11, not bundled with item 9.** Reasoning: README writing is its own discipline (Section 8 hygiene review, formula publication, data-source link verification) and would dilute the focus of item 9 (the demo-moment work). Item 11 also re-runs the §8.4 hygiene checklist on the latest deployed code.
- **Build mode: autonomous with checkpoints at items 5, 8, 10.** Steve's Claude-Code-daily / experienced engineering manager profile makes step-by-step a poor fit (the comprehension-check beat doesn't earn its keep). Three checkpoints sit at natural seams: after pure-function libs (item 5 closes scoring + verdict), after the form is wired (item 8 closes form + API + dropdown UX), after the demo lands (item 10 closes the full landing + sample-card flow).
- **Verification ON.** Steve confirmed despite his autonomous-mode preference. Real risks documented in spec.md's Open Issues that gambling against would be foolish: NCAP trim selection, severity prefix matching across all three demo cars, Vercel cold-start vs. SLO.
- **Git: commit + push after each item.** Push triggers Vercel preview deployments from item 2 onward — every item produces a publicly-verifiable preview URL.
- **Submission planning.** Devpost story flows directly from scope.md's "empty cell on the comparator grid" framing. Wow moment is the 2007 Civic F-grade rendering with the airbag-by-category verdict — verified honestly via NHTSA's public recall data, no curated lists, no hidden math. Four screenshots planned: landing page, loading state, F-grade Civic, B/A-grade Camry. Both screenshots #1 and #3 are captured during build verification (items 10 and 9 respectively), so screenshot capture happens organically during verification rather than as a separate step.
- **Active shaping.** Steve accepted the 12-item sequence as drafted, accepted the autonomous-with-checkpoints recommendation, accepted the verification-on default, and confirmed nothing was missing. First time across the four commands he didn't override a recommendation. Reading: the prior three commands (/scope, /prd, /spec) had real product/architecture decisions to make; /checklist is mostly procedural translation, and he was happy to defer.
- **Deepening rounds.** Steve skipped — went directly to "ready" after the proposal. Same crisp pattern as /scope and /prd, but this time the deepening rounds had less to add since the heavy thinking landed in /spec.
- **Teachability moments flagged for /reflect.**
  - **The deploy-hello-world-at-item-2 pattern is highly transplantable.** The senior-engineer instinct is to defer deployment to "after the app works." The workshop lesson: deploy the scaffold *before* it does anything, so deployment becomes a one-line concern instead of a Day-4 blocker.
  - **Pure functions first / UI last is also transplantable.** Steve recognized this without prompting. Worth surfacing in the workshop as the explicit principle: "If it can be unit-tested without a browser, build it before anything that needs a browser."
  - **Five-field item format as a contract with /build.** Title + spec ref + what-to-build + acceptance + verify. Each field is mandatory because /build's failure mode is filling in ambiguity with confident guesses. The format eliminates that failure mode at the planning step. Direct parallel to /spec's lesson about ambiguity = coin flip; /checklist applies it at the next level of granularity.
