import {withTimeout, UPSTREAM_TIMEOUT_MS} from './timeout';

/**
 * NHTSA Complaints — returns the count of consumer complaints filed for a
 * given (year, make, model). For v0 we only consume the count; the scoring
 * function (lib/scoring/complaints.ts) is purely a function of count.
 *
 * Endpoint: https://api.nhtsa.gov/complaints/complaintsByVehicle
 * Auth:     none
 * Response: {count, message, results: [...]} — note camelCase here, in
 *           contrast to the recalls API's lowercase `results` + PascalCase
 *           inner fields. The two NHTSA APIs have inconsistent casing; we
 *           treat each upstream's contract literally.
 *
 * Errors propagate. Rejects on timeout or non-200 status.
 */
export async function fetchComplaints(
  year: number,
  make: string,
  model: string,
): Promise<number> {
  const url =
    `https://api.nhtsa.gov/complaints/complaintsByVehicle` +
    `?make=${encodeURIComponent(make)}` +
    `&model=${encodeURIComponent(model)}` +
    `&modelYear=${encodeURIComponent(String(year))}`;

  const res = await withTimeout(
    (signal) => fetch(url, {signal, next: {revalidate: 86400}}),
    UPSTREAM_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(`complaints upstream non-200: ${res.status}`);
  }

  const body = (await res.json()) as {count?: number};
  return typeof body.count === 'number' ? body.count : 0;
}
