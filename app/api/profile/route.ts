/**
 * GET /api/profile?year=&make=&model=&mi=&p=
 *
 * Implements docs/spec.md > Backend (Serverless API) > app/api/profile/route.ts.
 *
 * Validates inputs (year integer in range, make in TOP_50_MAKES, model
 * non-empty, mileage non-negative integer, price non-negative finite when
 * provided), calls buildProfile(), returns Profile JSON with the spec'd
 * Cache-Control header.
 *
 * No `export const dynamic = 'force-dynamic'` — we want Next.js's data cache
 * for warm-instance reuse per spec Key Technical Decision (no entry).
 */
import {NextRequest, NextResponse} from 'next/server';
import {buildProfile} from '@/lib/profile';
import {TOP_50_MAKES} from '@/lib/makes';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const yearRaw = sp.get('year');
  const make = sp.get('make') ?? '';
  const model = sp.get('model') ?? '';
  const miRaw = sp.get('mi') ?? '0';
  const pRaw = sp.get('p');

  const year = Number(yearRaw);
  const mi = Number(miRaw);
  const price = pRaw === null || pRaw === '' ? null : Number(pRaw);

  // --- Validation. Each branch returns its own machine-readable error code.
  const currentYear = new Date().getFullYear();
  if (yearRaw === null || !Number.isInteger(year) || year < 1981 || year > currentYear + 1) {
    return NextResponse.json({error: 'invalid-year'}, {status: 400});
  }
  if (!(TOP_50_MAKES as readonly string[]).includes(make)) {
    return NextResponse.json({error: 'invalid-make'}, {status: 400});
  }
  if (!model) {
    return NextResponse.json({error: 'invalid-model'}, {status: 400});
  }
  if (!Number.isInteger(mi) || mi < 0) {
    return NextResponse.json({error: 'invalid-mileage'}, {status: 400});
  }
  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    return NextResponse.json({error: 'invalid-price'}, {status: 400});
  }

  const profile = await buildProfile({year, make, model, mileage: mi, price});

  return NextResponse.json(profile, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
