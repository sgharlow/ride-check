/**
 * GradeChip — large monochrome letter chip.
 *
 * Spec ref: docs/spec.md > Frontend > components/GradeChip.tsx.
 *
 * Server component. Renders the composite letter grade as the largest
 * typographic element on the result card. Monochrome by design — no color
 * coding (per docs/prd.md > Reading the Verdict > US-2). The chip is a
 * bordered square; the letter inside is text-7xl bold.
 */
type Props = {letter: 'A' | 'B' | 'C' | 'D' | 'F'};

export default function GradeChip({letter}: Props) {
  return (
    <div className="flex justify-center">
      <span
        aria-label={`Grade ${letter}`}
        className="inline-flex items-center justify-center w-32 h-32 rounded-2xl border-2 border-gray-900 text-7xl font-bold text-gray-900"
      >
        {letter}
      </span>
    </div>
  );
}
