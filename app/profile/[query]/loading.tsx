/**
 * Result-page loading skeleton.
 *
 * Spec ref: docs/spec.md > Frontend > app/profile/[query]/loading.tsx.
 *
 * Next.js convention file — shown automatically while page.tsx is server-
 * rendering (the upstream NHTSA fan-out is the slow part). Skeleton mirrors
 * the eventual ProfileCard layout: identity row → grade chip placeholder →
 * composite line → verdict block → 5 sub-bar placeholders.
 *
 * Calmly-authoritative aesthetic: monochrome greys, no shimmer animation —
 * just static grey blocks at the right rough sizes. Stable, not flashy.
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <div
          aria-busy="true"
          aria-label="Loading vehicle profile"
          className="max-w-2xl mx-auto p-6 sm:p-8 border border-gray-200 rounded bg-white space-y-6 animate-pulse"
        >
          {/* Identity placeholder */}
          <div className="space-y-2 text-center">
            <div className="h-6 w-2/3 mx-auto bg-gray-200 rounded" />
            <div className="h-4 w-1/3 mx-auto bg-gray-100 rounded" />
          </div>

          {/* Grade chip placeholder */}
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-2xl bg-gray-200" />
          </div>

          {/* Composite placeholder */}
          <div className="h-4 w-24 mx-auto bg-gray-100 rounded" />

          {/* Verdict placeholder */}
          <div className="max-w-prose mx-auto space-y-2">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-5/6 bg-gray-100 rounded" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
          </div>

          {/* 5 sub-bar placeholders */}
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
              >
                <div className="sm:w-32 h-4 bg-gray-100 rounded" />
                <div className="flex-1 h-2 bg-gray-200 rounded" />
                <div className="sm:w-32 h-4 bg-gray-100 rounded" />
              </div>
            ))}
          </div>

          {/* Sources strip placeholder */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </main>
  );
}
