/**
 * NotEnoughData — calm fallback page state.
 *
 * Spec ref:
 *   - docs/spec.md > Frontend > components/NotEnoughData.tsx
 *   - docs/prd.md > Entering a Vehicle > US-1a
 *   - docs/prd.md > Cross-cutting > US-7
 *
 * Server component. Renders a short, calm copy block per reason. No grade,
 * no bars, no partial composite — explicit by US-7 (no half-grades on
 * insufficient data).
 *
 * Reason → message map:
 *   - vehicle-not-recognized   : invalid slug / unknown make
 *   - 3-plus-sources-unavailable : combine() returned composite=null
 *   - network-error            : fetch threw / non-200 from /api/profile
 */
type Reason =
  | 'vehicle-not-recognized'
  | '3-plus-sources-unavailable'
  | 'network-error';

type Props = {reason: Reason};

const MESSAGES: Record<Reason, string> = {
  'vehicle-not-recognized':
    "We don't recognize this vehicle. Try entering a different year, make, and model on the home page.",
  '3-plus-sources-unavailable':
    'Not enough public data on this vehicle to compute a grade.',
  'network-error':
    "Couldn't reach our data sources. Try again in a moment.",
};

export default function NotEnoughData({reason}: Props) {
  const message = MESSAGES[reason];
  return (
    <div
      data-reason={reason}
      className="max-w-md mx-auto p-6 sm:p-8 border border-gray-200 rounded bg-white text-center space-y-4"
    >
      <p className="text-base text-gray-700">{message}</p>
      <p>
        <a
          href="/"
          className="text-sm text-gray-700 underline hover:text-gray-900"
        >
          Back to home
        </a>
      </p>
    </div>
  );
}
