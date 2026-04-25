import {withTimeout, UPSTREAM_TIMEOUT_MS} from './timeout';

/**
 * NHTSA NCAP Safety Ratings — TWO-step lookup.
 *
 * Step 1: GET /SafetyRatings/modelyear/{year}/make/{make}/model/{model}
 *         Returns {Count, Message, Results: [{VehicleId, VehicleDescription}, ...]}
 *         where each VehicleId corresponds to a specific trim/configuration
 *         that NHTSA crash-tested. Per spec: we always pick Results[0] —
 *         documented transparency trade-off (we score against a single trim,
 *         not an aggregate).
 *
 * Step 2: GET /SafetyRatings/VehicleId/{id}
 *         Returns a result object including OverallRating as a string.
 *         The string is either "1"–"5" or "Not Rated".
 *
 * Returns:
 *   - {overallRating: number 0–5} on success.
 *   - null when step 1 returns Count=0 / empty Results, OR when step 2
 *     returns "Not Rated", OR when OverallRating fails to parse to a
 *     finite number. Per spec: this null is NOT an error — it's a
 *     legitimate "no rating exists for this vehicle" outcome that the
 *     orchestrator turns into the safety SubScore being null without
 *     marking the safety source as unavailable due to error.
 *
 * Timeouts: 2s PER STEP, not 2s total. Each step gets its own AbortController.
 *
 * Errors propagate (timeout or non-200) per spec — only the explicit
 * "no rating" cases above resolve with null.
 */
export async function fetchNcap(
  year: number,
  make: string,
  model: string,
): Promise<{overallRating: number} | null> {
  const step1Url =
    `https://api.nhtsa.gov/SafetyRatings/modelyear/${encodeURIComponent(String(year))}` +
    `/make/${encodeURIComponent(make)}` +
    `/model/${encodeURIComponent(model)}`;

  const step1Res = await withTimeout(
    (signal) => fetch(step1Url, {signal, next: {revalidate: 86400}}),
    UPSTREAM_TIMEOUT_MS,
  );

  if (!step1Res.ok) {
    throw new Error(`ncap step1 non-200: ${step1Res.status}`);
  }

  const step1 = (await step1Res.json()) as {
    Count?: number;
    Results?: Array<{VehicleId?: number; VehicleDescription?: string}>;
  };

  if (!step1.Count || !step1.Results || step1.Results.length === 0) {
    return null;
  }

  const vehicleId = step1.Results[0]?.VehicleId;
  if (typeof vehicleId !== 'number') {
    // Defensive: NHTSA contract promises VehicleId in Results, but if for
    // some reason the first row is malformed, treat as "no rating" rather
    // than synthesize a bogus URL.
    return null;
  }

  const step2Url = `https://api.nhtsa.gov/SafetyRatings/VehicleId/${vehicleId}`;

  const step2Res = await withTimeout(
    (signal) => fetch(step2Url, {signal, next: {revalidate: 86400}}),
    UPSTREAM_TIMEOUT_MS,
  );

  if (!step2Res.ok) {
    throw new Error(`ncap step2 non-200: ${step2Res.status}`);
  }

  const step2 = (await step2Res.json()) as {
    Results?: Array<{OverallRating?: string}>;
  };

  const ratingStr = step2.Results?.[0]?.OverallRating;
  if (!ratingStr || ratingStr === 'Not Rated') {
    return null;
  }

  const parsed = Number(ratingStr);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return {overallRating: parsed};
}
