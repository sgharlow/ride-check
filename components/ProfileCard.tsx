/**
 * ProfileCard — composes the result-page hero card.
 *
 * Spec ref:
 *   - docs/spec.md > Frontend > components/ProfileCard.tsx
 *   - docs/prd.md > Reading the Verdict > US-2 (visual hierarchy)
 *
 * Server component. Locked vertical order (top → bottom):
 *   1. Vehicle identity   — Year + Make + Model
 *   2. Mileage / Price    — cosmetic, only when provided (>0)
 *   3. Grade chip         — largest typographic element on the card
 *   4. Numeric composite  — `xx / 100`, calm gray
 *   5. Renormalization disclosure (conditional, when profile.renormalized)
 *   6. Verdict paragraph
 *   7. Sub-bars (5 rows)
 *   8. Sources strip
 *
 * Mobile reflow: single-column, vertical order preserved. No gradients, no
 * shadows beyond the single border, generous spacing. Monochrome palette.
 */
import type {Profile} from '@/lib/types';
import GradeChip from '@/components/GradeChip';
import Verdict from '@/components/Verdict';
import ScoreBars from '@/components/ScoreBars';
import SourcesStrip from '@/components/SourcesStrip';

type Props = {profile: Profile};

function formatPrice(p: number): string {
  return `$${p.toLocaleString('en-US')}`;
}

function formatMileage(mi: number): string {
  return `${mi.toLocaleString('en-US')} mi`;
}

export default function ProfileCard({profile}: Props) {
  const {vehicle, composite, letter, subScores, verdict, sources, unavailable, renormalized} =
    profile;

  // The page-level guard for composite=null/letter=null is in
  // app/profile/[query]/page.tsx (renders NotEnoughData). If we reach here,
  // both are set — but TypeScript needs the narrowing.
  if (composite === null || letter === null) {
    // Defensive guard — shouldn't happen in practice.
    return null;
  }

  const showPrice = vehicle.price !== null && vehicle.price > 0;
  const showMileage = vehicle.mileage > 0;
  const unavailableCount = unavailable.length;

  return (
    <article className="max-w-2xl mx-auto p-6 sm:p-8 border border-gray-200 rounded bg-white space-y-6">
      {/* 1. Vehicle identity. */}
      <header className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h2>
        {(showPrice || showMileage) && (
          <div className="text-gray-600 text-sm space-x-3">
            {showPrice && <span>{formatPrice(vehicle.price as number)}</span>}
            {showMileage && <span>{formatMileage(vehicle.mileage)}</span>}
          </div>
        )}
      </header>

      {/* 2. Grade chip — largest typographic element on the card. */}
      <GradeChip letter={letter} />

      {/* 3. Numeric composite. Calm, gray. */}
      <p className="text-center text-gray-700 tabular-nums">
        {composite} / 100
      </p>

      {/* 4. Renormalization disclosure (conditional). */}
      {renormalized && unavailableCount > 0 && (
        <p className="text-sm text-gray-500 italic text-center">
          Score recalculated — {unavailableCount} data source
          {unavailableCount === 1 ? '' : 's'} unavailable.
        </p>
      )}

      {/* 5. Verdict. */}
      <Verdict text={verdict} />

      {/* 6. Sub-bars. */}
      <ScoreBars subScores={subScores} />

      {/* 7. Sources strip. */}
      <SourcesStrip sources={sources} />
    </article>
  );
}
