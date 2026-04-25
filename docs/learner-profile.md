<!-- This template captures who the learner is. Every downstream command reads this
     document to calibrate its depth, tone, and recommendations. Keep it scannable. -->

# Learner Profile

## Who They Are
**Steve Harlow** — professional engineering manager. Joined this hackathon to **field-test the spec-driven-development process for use with his team** — he's effectively reverse-engineering the curriculum into a teaching artifact, not just shipping a project. Treat every step as dual-purpose: produce the artifact, *and* surface what about the step would or wouldn't transplant into a team workshop.

## Technical Experience
**Experienced.** Codes regularly with heavy AI-agent use day-to-day — does not need framework or tooling primers.
- **Preferred stack:** Next.js, TypeScript, Vercel deployment.
- **Editors / agents:** Claude Code (primary), Windsurf editor.
- **Other SDD tooling tried:** AWS Kiro (the closest sibling to this curriculum).
- **Implication for tone:** skip "what is a serverless function" / "what is TypeScript" asides; do explain *why* curriculum steps exist (since teachability is the point).

## Learning Goals
> "How can I share this process with my team so they can learn how to use AI better for complex technical tasks?"

He is evaluating the curriculum as a **transferable pattern**, not just a personal skill. Downstream commands should periodically flag the moments that would translate well into team-workshop content — the aha beats, the parts where SDD pays off vs. gets in the way, the parts that wouldn't survive a transplant. `/reflect` should loop back to this goal explicitly and produce a debrief-flavored output, not a generic learning summary.

## Creative Sensibility
- Currently reading **Orson Scott Card** (Card's hallmark: quiet confidence, clarity, character-forward, morally serious without being preachy).
- Writing a book on **AI Leadership** — thinks deliberately about how humans and AI collaborate well.

**Design lens for RideCheck:** transparent, calmly authoritative, no flash. The score and its inputs speak for themselves; copy respects the user; the UI does not oversell. Keep this in mind in `/scope` (framing) and `/spec` (UI/UX section).

## Prior SDD Experience
**Significant.** Has experimented with **AWS Kiro**, which uses the same flipped-interaction → spec → build pattern. Steve is not learning *what* SDD is — he is comparing *this* implementation against one he's already used.

**Calibration for `/reflect`:** ask comparative / evaluative questions ("where did this curriculum's flow help vs. Kiro's?", "what would you change before introducing this to your team?", "which artifact carried the most weight?") rather than introductory ones ("what is a spec?"). Skip basics in process explanations throughout; lean into nuance and trade-offs.

## Project Context Carried In
The folder already contains `docs/RideCheck_Hackathon_Spec_v0.md` — a 442-line starting spec Steve wrote as a defensible, deliberately-narrow input to this curriculum. Key points downstream commands should respect:
- **Strict deny-list (Section 8.2):** public-data-only demo; no inspection-program, OBD/DTC/MIL, RSD/NOV, or state-calibration language anywhere in public artifacts.
- **Naive transparent weighted-sum scoring is intentional** — do not "improve" it toward a richer model. Auditability is the value prop.
- **Deadline:** April 29, 2026, 5:00 PM EDT (5 days from /onboard).
- **Stack already chosen:** Next.js 14 + TypeScript + Tailwind + Vercel + Vitest + Playwright.

`/scope` should treat the existing spec as a strong starting draft to refine, not a blank page to fill.
