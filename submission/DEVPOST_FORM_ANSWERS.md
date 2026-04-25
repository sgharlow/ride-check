# Devpost Submission — Complete Form Answers

Copy each value into the corresponding Devpost field. Replace the InspectIQ pre-populated content on the Project Overview page first.

---

## STAGE 1 — Project Overview

### Project name (61 chars, 7 left under 68 char limit)

```
RideCheck — public-data risk profile for any used car
```

### Elevator pitch (64 chars, well under 200)

```
A transparent A-F grade for any used car, from free public data.
```

### Thumbnail image

Use `submission/screenshots/03-civic-f-grade.png` (the F-grade Civic result card). 3:2 ratio works — the result card is the strongest single-image representation of what the product does.

---

## STAGE 2 — Project Details

### About the project (paste from `submission/DESCRIPTION.md`)

Devpost supports markdown. Paste the entire contents of `DESCRIPTION.md` raw — it renders.

### Built with (type each tag, autocomplete will suggest)

```
Next.js
TypeScript
Tailwind CSS
Vercel
NHTSA APIs
Vitest
```

### "Try it out" links (use ADD ANOTHER LINK button to add the second)

```
https://ride-check.vercel.app
https://github.com/sgharlow/ride-check
```

### Image gallery (4 screenshots, capture per SCREENSHOT_INSTRUCTIONS.md)

Upload in this order:
1. `submission/screenshots/01-landing.png` — landing page with form + sample cards
2. `submission/screenshots/02-loading.png` — loading skeleton state
3. `submission/screenshots/03-civic-f-grade.png` — F-grade 2007 Civic result
4. `submission/screenshots/04-rav4-b-grade.png` — B-grade 2023 RAV4 contrast

### Video demo link

Leave blank (optional, skipped per checklist).

---

## STAGE 3 — Additional Info

### Upload a File (zip/pdf, ≤35MB)

Upload `submission/ride-check-docs.zip` (51KB, contains all 7 hackathon artifacts).

### How far through the process did you get?

Pick the option indicating completion of all steps (the highest tier in the dropdown — likely "Completed all steps" or "Submitted a working project"). Select whatever the form's most-complete option is.

### How many hours did the full experience take?

```
About 11 hours total — roughly 4 hours of curriculum interviews and plan-generation conversations across /onboard, /scope, /prd, /spec, /checklist, plus about 6 hours of /build (autonomous subagent execution with three verification checkpoints), plus an hour of submission prep.
```

### Upload your files to file storage software and share here

```
The same hackathon-artifact bundle is already attached via the "Upload a File" field above. Browseable copy in the public repo: https://github.com/sgharlow/ride-check/tree/main/docs
```

### How would you rate the overall experience?

Pick the second-highest favorable option (or top, if appropriate to your honest read). Suggested: the option that maps to "very good" / "would recommend" rather than "excellent" — leaves room for honest critique without being negative.

### Which parts of the process were most valuable to you?

```
Three parts carried disproportionate weight.

First, the live-API research baked into /spec. The conversation forced me to hit NHTSA endpoints with real fixtures before locking the scoring formula. That single session caught two assumptions that would have collapsed the build: dieselgate is an EPA enforcement action and never appears in NHTSA's recall API, and EPA's fueleconomy.gov has no emissions-tier field, so its phantom listing in the v0 spec was always going to break. Catching both at /spec rather than mid-build saved hours.

Second, the deepening-rounds opt-out pattern. Every planning command offered "ship the doc now or go deeper" instead of running every round by default. For someone arriving with a strong starting spec, that respect for input volume is the difference between a useful conversation and a tedious one.

Third, the /checklist five-field item format — title, spec ref, what-to-build, acceptance, verify. Each /build subagent dispatch carried that contract plus the full spec.md, which is what kept the autonomous build from drifting. Subagents flagged real issues (NCAP returning null on the demo car, recall formula flooring most modern cars) instead of papering over them, because the contract gave them somewhere to anchor honest reporting.
```

### Where did you get stuck or what felt like a waste of time?

```
Two real friction points.

The recall scoring formula's aggressiveness vs. real-world data. The locked formula floors most modern cars with five-plus accumulated recalls, which made the planned B/A demo car (2018 Toyota Camry) actually grade C in production. Caught it during /build item 7 verification, paused, and swapped the demo car to a 2023 Toyota RAV4 instead of tuning the formula. The right call for transparency, but it surfaced a tension the planning steps didn't anticipate: real upstream data is rarely as clean as a spec assumes, and demo narratives built on assumed data can collapse on contact with reality.

A few NCAP null findings, an EPA URL drift, and one Vercel "first deploy is production by default" surprise added a half-hour of cumulative friction, but each was solvable in-flight. Nothing felt like a true waste of time; the friction came from the gap between spec assumptions and live data, which is exactly what the curriculum is supposed to reveal.
```

### Did this experience change how you approach building with a coding agent?

```
Yes — specifically around the cost of leaving ambiguity in a spec. The five-field checklist format and the explicit anti-shortcut rules in each subagent prompt are the parts I'd transplant directly into a team workflow. The default failure mode of an unsupervised coding agent is filling ambiguity with confident guesses; this curriculum's planning artifacts pre-resolve enough of the ambiguity that the agent has somewhere to anchor.

The other change: the deploy-hello-world-at-item-2 principle. Pushing to production before the app does anything useful surfaces all the deployment-config issues on day one rather than day four. That's a habit I'm carrying forward independent of the curriculum.

The piece I'm still chewing on is the gap between planning artifacts and live-data reality. /spec's API research was load-bearing, but it didn't catch the recall-formula-vs-real-data issue that /build did. Either /spec needs explicit "compute the formula on the live data, not just the assumed counts" or the demo-car selection needs a separate validation step. A team workshop transplant would benefit from naming this seam directly.
```

### How likely are you to use this kind of workflow in your day-to-day work?

```
Very likely for non-trivial features and team teaching. Less so for one-off scripts where the planning overhead exceeds the implementation cost.
```

### Would you recommend this to a colleague?

Check the box: **Yes**.

### What would you change about this experience?

```
Three concrete changes.

First, /spec should run live formula validation on the actual demo cars, not just the API endpoint shapes. Computing scores against real data on day one would have caught the demo-car-grade issue before /build started.

Second, the deepening-rounds wording across /scope, /prd, /spec, and /checklist felt redundant by the third command. Compressing or eliminating it for senior learners with high-volume starting context would respect their time without losing the depth option for those who need it.

Third, having compared this to AWS Kiro, the curriculum's biggest differentiator is the autonomous /build with checkpoints — Kiro's equivalent is closer to step-by-step. The autonomous mode here is the right call for senior engineers, but the curriculum should explicitly describe when each mode is appropriate rather than presenting them as preference. The five-field checklist format is the load-bearing artifact, and that's worth naming.
```

---

## STAGE 4 — Submit

Click Submit on the final page after re-reading all four stages. Confirm the green "Submitted" badge.

---

## CRITICAL — Pre-submit hygiene check

Before clicking Submit on any stage, scan every text field for these forbidden terms (Section 8.2 deny-list):

```
dieselgate, OBD, OBD-II, DTC, MIL, RSD, NOV, inspection program, pass/fail (in vehicle context), readiness monitors, state-cohort, calibrated baseline, signal lift, threshold sweep, opus, opusinspection, virginia, va_cbt, va_reporting, ssrs, bold reports, domo, "what we're patenting", "novel approach", "proprietary scoring", "production system"
```

The InspectIQ-shaped text currently on the Project Overview page contains `OBD-II`, `OBD data`, and `pass/fail` — these MUST be replaced with the RideCheck content above before saving the page.
