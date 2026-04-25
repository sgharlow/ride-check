# Screenshot Capture Instructions

Four screenshots, all PNG, all at least 1366 px wide. PNG is preferred over JPEG — type rendering stays crisp, which matches the calmly-authoritative aesthetic. Save them all into `submission/screenshots/` (create the folder when you take the first one).

## Setup once

1. Open Chrome (or any Chromium browser).
2. Open DevTools (F12).
3. Click the device-toolbar toggle (Ctrl+Shift+M, the small phone/tablet icon).
4. Set the viewport to **Responsive** and dial it to **1366 x 768**. This is the desktop viewport `prd.md > US-6` calls out and is what the sample-card layout was designed against.
5. Reload once at this size so the layout settles.

## Screenshot 1: Landing page

- **URL:** `https://ride-check.vercel.app/`
- **What should be visible:**
  - The "RideCheck" heading at the top.
  - The InputForm with five fields (Year, Make, Model, Mileage, Price) and the "Evaluate" button.
  - The horizontal divider.
  - The "Try a sample" heading.
  - All three sample cards (2007 Honda Civic, 2014 VW Passat, 2023 Toyota RAV4).
- **Capture:** Use Chrome's built-in viewport screenshot — Ctrl+Shift+P, type "Capture screenshot", pick "Capture screenshot" (the visible-viewport one, not "full size"). If the sample cards are cut off at 768 px tall, scroll just enough that the page fits, or use "Capture full size screenshot" instead and save the full page.
- **Save as:** `submission/screenshots/01-landing.png`

## Screenshot 2: Loading state

- **URL:** `https://ride-check.vercel.app/profile/2007-honda-civic?mi=180000&p=4500`
- **Why a fresh window:** The loading skeleton only renders during a cold-cache fetch. If you've already hit this URL in the last few minutes, Vercel's edge cache will serve the warm result and you won't see the skeleton at all.
- **Method A (preferred — fresh incognito):**
  1. Open a new incognito window.
  2. Open DevTools first (F12), Network tab.
  3. Set throttling to **Slow 3G** (top of the Network tab, dropdown that defaults to "No throttling").
  4. Paste the URL and hit Enter.
  5. As the page is loading, take the screenshot via DevTools (Ctrl+Shift+P → "Capture screenshot").
- **Method B (if A is too fast):**
  1. Same as A, but set throttling to **Slow 3G** AND additionally set CPU throttling to "6x slowdown" in DevTools → Performance tab.
- **What should be visible:** The loading skeleton component — gray placeholder bars where the score chip, sub-bars, and verdict will land. The header / vehicle identity may already be rendered.
- **Save as:** `submission/screenshots/02-loading.png`

## Screenshot 3: F-grade 2007 Honda Civic

- **URL:** `https://ride-check.vercel.app/profile/2007-honda-civic?mi=180000&p=4500`
- **Wait until it fully loads** (no throttling this time). Let the result card settle.
- **What should be visible (full result card, scroll if needed):**
  - Vehicle identity row: "2007 Honda Civic" + mileage (180,000 mi) + price ($4,500).
  - The large F chip as the visual hero.
  - Composite score "33 / 100" rendered smaller than the F chip.
  - Verdict copy mentioning airbag-inflator recalls (no hedge words).
  - Renormalization disclosure note (Safety bar will read "data unavailable" since NCAP doesn't rate that trim — composite renormalizes).
  - All five sub-bars labeled with their data sources.
  - Sources strip at the bottom with per-vehicle links to NHTSA / EPA references.
- **Capture:** "Capture full size screenshot" (Ctrl+Shift+P → "Capture full size screenshot") so the entire card is in one image.
- **Save as:** `submission/screenshots/03-civic-f-grade.png`

## Screenshot 4: B-grade 2023 Toyota RAV4

- **URL:** `https://ride-check.vercel.app/profile/2023-toyota-rav4?mi=30000&p=32000`
- **Wait until it fully loads.**
- **What should be visible (full result card):**
  - Vehicle identity row: "2023 Toyota RAV4" + mileage (30,000 mi) + price ($32,000).
  - Large B chip.
  - Composite score in the high range.
  - Calmly positive verdict (specific, no exclamations, no hedges).
  - Five sub-bars, all rendered (no "data unavailable").
  - Sources strip at the bottom.
- **Capture:** "Capture full size screenshot."
- **Save as:** `submission/screenshots/04-rav4-b-grade.png`

## After capture

- Spot-check each PNG opens cleanly and is at least 1366 px wide.
- The four files together are what gets uploaded to Devpost's image gallery in step 6 of `SUBMISSION_STEPS.md`.
- Commit the screenshots in a separate commit — `submission/.gitignore` ignores `screenshots/` only as a placeholder; once you have the four, run `git add -f submission/screenshots/*.png && git commit -m "step-12: Devpost submission screenshots"`.
