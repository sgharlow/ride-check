> 📦 **Archived** — RideCheck: hackathon entry (Devpost), submitted spring 2026. Event concluded; not maintained. Code and history remain browsable.

# RideCheck — public-data risk profile for any used car

A v0 concept demo that gives prospective used-car shoppers a transparent A–F letter grade for any year/make/model, computed entirely from free public data (NHTSA + EPA Tier definitions). Inspired by FICO score cards and the NHTSA five-star safety rating; positioned in the empty cell on the comparator grid where AutoCheck and Carfax sit (clean visual restraint with a clear verdict) but with the math in the open.

**Live:** https://ride-check.vercel.app
**Repo:** https://github.com/sgharlow/ride-check
**License:** MIT

## What it does

Type a year, make, and model. Get back a single A–F letter grade with five labeled sub-bars showing the public-record signals that produced it: open recalls, complaint volume, NCAP crash-test rating, EPA emissions tier (year-based), and age & wear. Every input, every weight, and every cut point is published below — nothing is hidden behind a paywall.

Three sample vehicles are seeded on the landing page so the result-card UX can be inspected end-to-end without typing anything: a 2007 Honda Civic (F, airbag-era recalls), a 2014 Volkswagen Passat (C, multi-category recalls), and a 2023 Toyota RAV4 (B, modern clean record).

## Why it exists

NHTSA has the data and won't render a verdict. AutoCheck and Carfax render verdicts but hide the math behind a paywall. RideCheck fills the empty cell on that grid: a clear verdict on free public data, with every input and weight in the open. The framing borrows the public five-band letter scale familiar from FICO score categories, the AutoCheck score's banding, and the NHTSA five-star safety rating's familiarity — three comparators that have already taught the public how to read this kind of card.

## Screenshots

The fastest way to see the UI is to open the live deployment and click one of the three sample cards on the landing page:

- Landing page with sample cards and Year/Make/Model form: https://ride-check.vercel.app
- Result page (B grade — modern vehicle, clean record): https://ride-check.vercel.app/profile/2023-toyota-rav4?mi=30000&p=32000
- Result page (F grade — older vehicle with airbag-era recalls): https://ride-check.vercel.app/profile/2007-honda-civic?mi=180000&p=4500

## Data sources (all free, all public, no API keys)

- **NHTSA Recalls API** — https://api.nhtsa.gov/recalls/recallsByVehicle
- **NHTSA Complaints API** — https://api.nhtsa.gov/complaints/complaintsByVehicle
- **NHTSA NCAP Safety Ratings** — https://api.nhtsa.gov/SafetyRatings
- **vPIC VIN/model decoder** — https://vpic.nhtsa.dot.gov/api/vehicles
- **EPA Tier methodology reference** — https://www.epa.gov/regulations-emissions-vehicles-and-engines/final-rule-control-air-pollution-motor-vehicles-tier-3 (used to derive emissions tier from model year; not called at runtime)

## How we calculate this

<a id="scoring"></a>

The composite score is a transparent weighted sum of five sub-scores. Every coefficient below is what the running code uses.

### Sub-scores

- **Recalls** = `max(0, 100 − 15 × Σ severity(component))` for each open recall returned by NHTSA. The severity multiplier is below.
- **Complaints** = `max(0, 100 − 20 × log₁₀(count + 1))` from NHTSA's complaint count for the vehicle.
- **Safety (NCAP)** = `OverallRating × 20`. Returns "data unavailable" if NHTSA has no rating for the vehicle.
- **Emissions** = year-based EPA Tier lookup: ≥2017 → 100 (Tier 3), 2004–2016 → 75 (Tier 2), 1994–2003 → 50 (Tier 1), <1994 → 25.
- **Age & Wear** = `max(0, 100 − 2 × age_years − 0.0002 × mileage)`, with a year-only fallback `max(0, 100 − 3 × age_years)` if mileage is not provided.

### Component severity multiplier (recalls)

| Component prefix (NHTSA `Component` field) | Multiplier | Plain-English label |
| --- | --- | --- |
| `AIR BAGS` | 2.0× | airbag |
| `FUEL SYSTEM` | 2.0× | fuel-system |
| `ENGINE AND ENGINE COOLING` | 2.0× | engine |
| `STEERING` | 2.0× | steering |
| `SERVICE BRAKES` | 2.0× | brakes |
| `POWER TRAIN` | 1.5× | powertrain |
| `ELECTRICAL SYSTEM` | 1.5× | electrical |
| `EXTERIOR LIGHTING` | 1.0× | lighting |
| `SUSPENSION` | 1.0× | suspension |
| (anything else) | 1.0× | other |

### Composite weights

- Recalls: 0.25
- Complaints: 0.15
- Safety (NCAP): 0.25
- Emissions: 0.20
- Age & Wear: 0.15

When 1 or 2 sub-scores are unavailable (e.g., NHTSA has no NCAP rating for a vehicle), the composite is recomputed using only available sub-scores with weights renormalized to sum to 1.0. When 3+ are unavailable, no grade is rendered — the page shows "Not enough public data on this vehicle to compute a grade."

### Letter bands

- A: composite ≥ 85
- B: composite ≥ 70
- C: composite ≥ 55
- D: composite ≥ 40
- F: otherwise

These bands are inspired by the public five-band letter scale familiar from FICO score categories and the AutoCheck score's banding.

## Run from a clean clone

```
git clone https://github.com/sgharlow/ride-check
cd ride-check
npm install
npm run dev
```

Open http://localhost:3000. No API keys, no environment variables required for local dev.

To run tests: `npm test`. To build: `npm run build`.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Vitest · Vercel. No database, no authentication, no third-party paid APIs.

## What this is NOT

This is a v0 concept demo — a public-data prototype. Not a real-time market estimate, not a vehicle history report, not a substitute for a pre-purchase mechanical inspection. The grade summarizes public reliability signals; it does not predict any specific outcome about any specific vehicle.

## License

MIT. See [LICENSE](LICENSE).
