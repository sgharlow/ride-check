import {withTimeout, UPSTREAM_TIMEOUT_MS} from './timeout';

/**
 * vPIC GetModelsForMakeYear — populates the cascading Model dropdown in
 * components/InputForm.tsx. Called by the /api/models proxy route.
 *
 * Endpoint: https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/...
 *           Note this is on a different host (vpic.nhtsa.dot.gov) from the
 *           api.nhtsa.gov endpoints used by recalls/complaints/ncap.
 * Auth:     none
 * Response: {Count, Results: [{Make_ID, Make_Name, Model_ID, Model_Name}, ...]}
 *           PascalCase + underscore_separated. We only consume Model_Name.
 *
 * Returns deduped + alphabetically sorted model names. NHTSA occasionally
 * returns the same model under multiple Make_IDs (e.g., when a maker has
 * subsidiary entities), so dedup is a real-world need, not just a cleanup.
 *
 * Cache: 7 days (longer than the 24h on the other three) — model rosters
 * for past model years are stable in practice.
 *
 * Errors propagate. Rejects on timeout or non-200 status.
 */
export async function fetchModels(
  year: number,
  make: string,
): Promise<string[]> {
  const url =
    `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear` +
    `/make/${encodeURIComponent(make)}` +
    `/modelyear/${encodeURIComponent(String(year))}` +
    `?format=json`;

  const res = await withTimeout(
    (signal) => fetch(url, {signal, next: {revalidate: 604800}}),
    UPSTREAM_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(`vpic upstream non-200: ${res.status}`);
  }

  const body = (await res.json()) as {
    Count?: number;
    Results?: Array<{Model_Name?: string}>;
  };

  const names = (body.Results ?? [])
    .map((r) => r.Model_Name)
    .filter((n): n is string => typeof n === 'string' && n.length > 0);

  // Dedup, then sort alphabetically (case-insensitive comparator so e.g.
  // "iX" sorts next to "Impreza" rather than after all uppercase entries).
  const deduped = Array.from(new Set(names));
  deduped.sort((a, b) =>
    a.localeCompare(b, undefined, {sensitivity: 'base'}),
  );
  return deduped;
}
