import type {Recall} from '../types';
import {withTimeout, UPSTREAM_TIMEOUT_MS} from './timeout';

/**
 * NHTSA Recalls — fetches all recall campaigns affecting a given (year, make, model).
 *
 * Endpoint: https://api.nhtsa.gov/recalls/recallsByVehicle
 * Auth:     none
 * Response: {Count, Message, results: [...]} — note `results` is lowercase plural
 *           on this endpoint, but field names inside each result are PascalCase
 *           (Component, Summary, NHTSACampaignNumber, ReportReceivedDate).
 *
 * Component strings are colon-hierarchical, e.g.
 *   "AIR BAGS:FRONTAL:DRIVER SIDE:INFLATOR MODULE"
 * which the severity table in lib/scoring/severity.ts prefix-matches.
 *
 * Errors propagate. Per item 6 spec: this client rejects on timeout
 * (AbortError) or non-200 status. The orchestrator's Promise.allSettled
 * converts rejections into available:false SubScores.
 */
export async function fetchRecalls(
  year: number,
  make: string,
  model: string,
): Promise<Recall[]> {
  const url =
    `https://api.nhtsa.gov/recalls/recallsByVehicle` +
    `?make=${encodeURIComponent(make)}` +
    `&model=${encodeURIComponent(model)}` +
    `&modelYear=${encodeURIComponent(String(year))}`;

  const res = await withTimeout(
    (signal) => fetch(url, {signal, next: {revalidate: 86400}}),
    UPSTREAM_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(`recalls upstream non-200: ${res.status}`);
  }

  const body = (await res.json()) as {
    Count?: number;
    Message?: string;
    results?: Array<{
      Component?: string;
      Summary?: string;
      NHTSACampaignNumber?: string;
      ReportReceivedDate?: string;
    }>;
  };

  const rows = body.results ?? [];
  return rows.map((r) => ({
    component: r.Component ?? '',
    campaignNumber: r.NHTSACampaignNumber ?? '',
    summary: r.Summary ?? '',
    receivedDate: r.ReportReceivedDate ?? '',
  }));
}
