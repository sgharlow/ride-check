/**
 * ScoreBars — five monochrome sub-score bars.
 *
 * Spec ref: docs/spec.md > Frontend > components/ScoreBars.tsx.
 *
 * Server component. Five rows in a locked vertical order:
 *   1. Recalls
 *   2. Complaints
 *   3. Safety (NCAP)
 *   4. Emissions
 *   5. Age & Wear
 *
 * Each row has three columns on >=sm: label (left), bar (middle, full-flex),
 * value (right). On mobile (<sm) the row collapses to label-on-top, bar +
 * value below — preserving vertical reading order per docs/prd.md > Reading
 * the Verdict > US-2.
 *
 * Bars are monochrome (gray-700 fill on gray-200 track). NO color coding.
 *
 * Unavailable sub-scores: empty bar track, right side reads "data unavailable".
 */
import type {Profile} from '@/lib/types';

type Props = {subScores: Profile['subScores']};

type Row = {
  key: keyof Profile['subScores'];
  label: string;
};

const ROWS: ReadonlyArray<Row> = [
  {key: 'recalls', label: 'Recalls'},
  {key: 'complaints', label: 'Complaints'},
  {key: 'safety', label: 'Safety (NCAP)'},
  {key: 'emissions', label: 'Emissions'},
  {key: 'ageWear', label: 'Age & Wear'},
];

export default function ScoreBars({subScores}: Props) {
  return (
    <div className="space-y-4">
      {ROWS.map(({key, label}) => {
        const sub = subScores[key];
        const available = sub.available;
        const value = available ? sub.value : 0;
        // Clamp width display for safety, even though scoring is 0-100.
        const widthPct = Math.max(0, Math.min(100, value));

        return (
          <div
            key={key}
            className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
          >
            <div className="sm:w-32 text-sm font-medium text-gray-700">
              {label}
            </div>
            <div className="flex-1">
              <div className="h-2 w-full bg-gray-200 rounded">
                {available ? (
                  <div
                    className="h-2 bg-gray-700 rounded"
                    style={{width: `${widthPct}%`}}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </div>
            <div className="sm:w-32 text-sm text-right">
              {available ? (
                <span className="text-gray-700 tabular-nums">{value}</span>
              ) : (
                <span className="text-gray-500">data unavailable</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
