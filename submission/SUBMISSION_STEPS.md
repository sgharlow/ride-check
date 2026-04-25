# Devpost Submission — Step-by-Step

You're submitting `RideCheck — public-data risk profile for any used car` to the spec-driven-development hackathon. Everything you need is in this `submission/` folder. Walk it top to bottom; don't click Submit until step 13.

## Pre-flight

Before you start, you should have:

- [ ] All four PNGs in `submission/screenshots/` (per `SCREENSHOT_INSTRUCTIONS.md`).
- [ ] The docs zip at `submission/ride-check-docs.zip` (already created — verify it exists).
- [ ] Production app loading cleanly at `https://ride-check.vercel.app`.
- [ ] Public GitHub repo loading at `https://github.com/sgharlow/ride-check`.

## Steps

1. **Open the hackathon page on Devpost.** This is the spec-driven-development hackathon you've been building against. Click "Submit a project" (or "Submit your project" — Devpost varies the label).

2. **Project name.** Open `submission/PROJECT_NAME.txt` and paste the single line into Devpost's name field.
   ```
   RideCheck — public-data risk profile for any used car
   ```

3. **Tagline.** Open `submission/TAGLINE.txt` and paste:
   ```
   A transparent A-F grade for any used car, from free public data.
   ```

4. **Project description / story.** Open `submission/DESCRIPTION.md` and copy the full file contents into Devpost's project description / story field. Devpost renders Markdown — you can paste raw `.md` and it will format. After pasting, use Devpost's preview button to confirm headings, bold text, and the bullet lists render correctly.

5. **Built with.** Open `submission/BUILT_WITH.txt`. Devpost has an autocomplete tag picker — type each tag below and select the matching suggestion. If a tag isn't pre-listed (e.g., "NHTSA APIs"), Devpost will let you create it as a custom tag.
   - Next.js
   - TypeScript
   - Tailwind CSS
   - Vercel
   - NHTSA APIs
   - Vitest

6. **Image gallery.** Upload all four screenshots from `submission/screenshots/` in this order:
   1. `01-landing.png`
   2. `02-loading.png`
   3. `03-civic-f-grade.png`
   4. `04-rav4-b-grade.png`

   The first image becomes the project's cover image on the gallery page — landing page is the right call.

7. **"Try it out" links.**
   - **Demo URL:** `https://ride-check.vercel.app`
   - **Code repository:** `https://github.com/sgharlow/ride-check`

8. **Supplementary files.** Upload `submission/ride-check-docs.zip`. This is the curriculum artifact — `learner-profile.md`, `scope.md`, `prd.md`, `spec.md`, `checklist.md`, the v0 starting spec, and `process-notes.md`. The zip is the closest thing the hackathon has to "show your work."

9. **Video.** Skip unless you have time and want to record a 2-minute screen capture. If you do: load the landing page, click the 2007 Civic sample card, narrate over the result, click back, click the 2023 RAV4 sample card, narrate over the contrast. Upload to YouTube as unlisted, paste the link.

10. **Re-read pass.** Before clicking Submit, scroll to the top of the description field and read it top to bottom one more time. Things to spot-check:
    - No mention of any inspection-program terms (the deny-list lives in `docs/RideCheck_Hackathon_Spec_v0.md > §8.2`).
    - No "production system," "novel approach," "proprietary scoring," or "what we're patenting" language.
    - The phrase "v0 concept demo" appears (it does — in the opening line).
    - The links all point at the right URLs.
    - "B grade" and "F grade" are spelled out, not coded with traffic-light colors anywhere.

11. **Click Submit.**

12. **Confirm.** Look for the green "Submitted" badge on your project's Devpost page. If you don't see it, the submission didn't go through — re-check required fields highlighted in red.

13. **Mark item 12 complete.** Open `docs/checklist.md`, change item 12's checkbox from `[ ]` to `[x]`, commit and push:
    ```
    git add docs/checklist.md
    git commit -m "step-12: Devpost submission live"
    git push
    ```

## If something breaks

- **Image upload fails:** Devpost's image limit per file is typically ~5MB. If a PNG is too big, either compress it (TinyPNG works) or re-capture at a slightly smaller viewport.
- **Markdown doesn't render:** Devpost sometimes mangles fenced code blocks. If the description looks weird, switch the Devpost editor to "rich text" mode and paste again.
- **Tag autocomplete doesn't suggest "NHTSA APIs":** create it as a custom tag — Devpost allows it.
- **Submit button is grayed out:** there's a required field you missed. Devpost highlights them in red after a failed submit click; usually it's the demo URL or the cover image.
