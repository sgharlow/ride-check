/**
 * SourcesStrip — per-vehicle deep links to the underlying public-data sources.
 *
 * Spec ref:
 *   - docs/spec.md > Frontend > components/SourcesStrip.tsx
 *   - docs/prd.md > Reading the Verdict > US-5
 *
 * Server component. Renders a footer with a list of links, one per source:
 *   1. NHTSA Recalls
 *   2. NHTSA Complaints
 *   3. NCAP Safety Ratings
 *   4. EPA Tier methodology (footnote — computed locally, not fetched)
 *   5. How we calculate this (methodology key — links to README scoring)
 *
 * Links open in a new tab with rel="noopener noreferrer". If a source has a
 * `note` (e.g. "no data returned"), it's rendered in parentheses after the
 * label. The links are styled as understated inline text — calm, not flashy.
 */
import type {SourceLink} from '@/lib/types';

type Props = {sources: SourceLink[]};

export default function SourcesStrip({sources}: Props) {
  return (
    <footer className="border-t border-gray-200 pt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Sources</h3>
      <ul className="space-y-1 text-sm">
        {sources.map((s) => (
          <li key={s.key}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 underline hover:text-gray-900"
            >
              {s.label}
            </a>
            {s.note ? (
              <span className="text-gray-500"> ({s.note})</span>
            ) : null}
          </li>
        ))}
      </ul>
    </footer>
  );
}
