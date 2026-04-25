# RideCheck

A v0 concept demo that gives prospective used-car shoppers a transparent A-F letter grade for any year/make/model, computed entirely from free public data.

## What it does

Type a year, make, and model (optionally a mileage and asking price). Within a few seconds you get back a single A-F letter grade as the hero of the page, a numeric composite score out of 100, a plain-English verdict that names what's pulling the grade up or down, and five labeled sub-bars showing the public-record signals that produced it. Every weight and cut point is published in the README.

## The problem we set out to solve

A used-car shopper considering a specific vehicle has thirty seconds to decide whether the listing is worth a closer look. NHTSA has the authoritative public records but renders no verdict; AutoCheck and Carfax render a verdict but hide the math behind a paywall. The buyer is stuck choosing between trustworthy raw data they can't interpret and opaque grades they paid for.

## The empty cell on the comparator grid

NHTSA is data without a verdict. AutoCheck and Carfax are verdicts without visible math. The cell that's empty — clean presentation, with a verdict, and showing its work — is the cell RideCheck fills. It uses only free public data, publishes every weight and cut point, and commits to a verdict in plain English.

## How it works

Five sub-scores, each backed by a single named public source.

**Recalls** uses the NHTSA Recalls API. Every open recall starts at a fixed penalty, multiplied by a severity factor based on the recall's component category. Airbag, fuel-system, engine, steering, and brake recalls count double. Powertrain and electrical count one and a half. Everything else counts once. The full table is in the README — anyone can verify how a 2007 Honda Civic with six Takata airbag-inflator recalls earns its grade.

**Complaints** uses the NHTSA Complaints API on a logarithmic curve, so one or two complaints barely move the score while hundreds land the bar in the danger zone.

**Safety** uses NHTSA's NCAP crash-test ratings, scaled from stars to 0-100. If a vehicle has no NCAP rating, the bar reads "data unavailable" and the composite renormalizes across the remaining four sub-scores.

**Emissions** is derived locally from the model year against published EPA Tier definitions.

**Age & Wear** is a two-input formula on the model year and the user-entered mileage, with a year-only fallback if mileage is left at zero.

The five sub-scores get a weighted-sum composite, which maps to a letter band (A, B, C, D, or F) using fixed cut points published in the README. The verdict generator ranks sub-scores by how much each one pulled the grade down, names the worst three by category in plain English, and is forbidden from hedge words — no "may have," no "potentially," no "some." The grade either stands on the public record or it does not.

## What I built / How spec-driven development paid off

This was a five-day spec-driven build using the hackathon-in-a-plugin curriculum. The conversation walked from `/onboard` to `/scope` to `/prd` to `/spec` to `/checklist` to `/build`, with each command writing one durable artifact before any code got written. The full journey is captured in `process-notes.md`, attached as supplementary material.

Two moments earned the approach its keep. First, the `/spec` command's live-API research surfaced that the original demo car (a 2014 VW Passat, picked for its emissions story) returns ten ordinary recalls in NHTSA's API but the relevant emissions issue does not appear there — it lives in EPA enforcement records, separate. Catching that during spec instead of during build let me swap to a 2007 Honda Civic with verified Takata airbag recalls; the F-grade demo lands honestly. Second, the verdict generator carries a hedge-word linter that rejects any output containing "may have," "some," "potentially," "might," or "possibly." The verdict has to commit. Both came out of conversations that happened on paper before code shipped. 139 unit tests cover the scoring formula and the verdict generator directly.

## What's next

This is a v0 concept demo, scoped tight on purpose. Future versions could include richer free public data sources.

## Tech stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS (no UI library)
- **Testing:** Vitest (139 tests, all passing)
- **Hosting:** Vercel (free tier, no API keys, no database)

## Try it live, source, docs

- **Live app:** https://ride-check.vercel.app
- **Source:** https://github.com/sgharlow/ride-check
- **Docs (zip):** attached as supplementary file — `learner-profile.md`, `scope.md`, `prd.md`, `spec.md`, `checklist.md`, the v0 starting spec, and `process-notes.md`
