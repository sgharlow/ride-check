/**
 * GET /api/models?year=&make=
 *
 * Implements docs/spec.md > Backend (Serverless API) > app/api/models/route.ts.
 *
 * Thin proxy in front of vPIC's GetModelsForMakeYear, scoped to the
 * TOP_50_MAKES dropdown so we never hit vPIC for a make the form can't
 * produce. Cached for 7 days at the edge — past-year model rosters are
 * stable in practice.
 */
import {NextRequest, NextResponse} from 'next/server';
import {fetchModels} from '@/lib/upstream/vpic';
import {TOP_50_MAKES} from '@/lib/makes';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const yearRaw = sp.get('year');
  const make = sp.get('make') ?? '';

  const year = Number(yearRaw);

  const currentYear = new Date().getFullYear();
  if (yearRaw === null || !Number.isInteger(year) || year < 1981 || year > currentYear + 1) {
    return NextResponse.json({error: 'invalid-year'}, {status: 400});
  }
  if (!(TOP_50_MAKES as readonly string[]).includes(make)) {
    return NextResponse.json({error: 'invalid-make'}, {status: 400});
  }

  try {
    const models = await fetchModels(year, make);
    return NextResponse.json(
      {models},
      {headers: {'Cache-Control': 'public, s-maxage=604800'}},
    );
  } catch {
    return NextResponse.json({error: 'fetch-failed'}, {status: 502});
  }
}
