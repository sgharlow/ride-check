/**
 * Result page — `app/profile/[query]/page.tsx`.
 *
 * Spec ref:
 *   - docs/spec.md > Frontend > app/profile/[query]/page.tsx
 *   - docs/prd.md > Reading the Verdict (US-2, US-3, US-5)
 *   - docs/prd.md > Cross-cutting > US-7
 *
 * Server component. Decodes the slug, fetches /api/profile via absoluteApiUrl,
 * renders <ProfileCard /> on success or <NotEnoughData /> on the various
 * failure modes (invalid slug, 3+ source failures, network error).
 *
 * Why HTTP and not a direct buildProfile() import?  Per spec Key Technical
 * Decision #1 the result page calls /api/profile over HTTP so the form-submit
 * path and the share-URL paste path use a single contract. The Next.js data
 * cache plus the route handler's Cache-Control header mean warm-instance hits
 * are sub-1s.
 */
// `dynamic = 'force-dynamic'` because the slug space is unbounded (any
// year + make + model combo). Without this, Next 14's dev server tries to
// pre-collect static params, which fires the static-paths worker and
// can corrupt webpack module IDs between requests during dev. This does
// NOT bypass the Next.js fetch() data cache used by /api/profile (the
// `next: {revalidate: 86400}` option below still caches that fetch).
export const dynamic = 'force-dynamic';

import {decodeQuery} from '@/lib/slug';
import {absoluteApiUrl} from '@/lib/baseUrl';
import ProfileCard from '@/components/ProfileCard';
import NotEnoughData from '@/components/NotEnoughData';
import type {Profile} from '@/lib/types';

type PageProps = {
  params: {query: string};
  searchParams: {mi?: string; p?: string};
};

export default async function ProfilePage({params, searchParams}: PageProps) {
  // 1. Decode slug. Invalid slug → vehicle-not-recognized.
  const decoded = decodeQuery(params.query);
  if (!decoded) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
          <NotEnoughData reason="vehicle-not-recognized" />
        </div>
      </main>
    );
  }

  const {year, make, model} = decoded;
  const mi = searchParams.mi ?? '0';
  const p = searchParams.p ?? '';

  // 2. Build absolute URL for /api/profile.
  const url = absoluteApiUrl(
    `/api/profile?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&mi=${encodeURIComponent(mi)}&p=${encodeURIComponent(p)}`,
  );

  // 3. Fetch with Next.js data cache (24h revalidate matches /api/profile's
  //    Cache-Control). Catches both network errors and non-2xx responses.
  let profile: Profile | null = null;
  let networkError = false;

  try {
    const res = await fetch(url, {next: {revalidate: 86400}});
    if (!res.ok) {
      networkError = true;
    } else {
      profile = (await res.json()) as Profile;
    }
  } catch {
    networkError = true;
  }

  if (networkError || profile === null) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
          <NotEnoughData reason="network-error" />
        </div>
      </main>
    );
  }

  // 4. 3-plus-sources-unavailable case: combine() returned null composite/letter.
  if (profile.composite === null || profile.letter === null) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
          <NotEnoughData reason="3-plus-sources-unavailable" />
        </div>
      </main>
    );
  }

  // 5. Happy path.
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <ProfileCard profile={profile} />
      </div>
    </main>
  );
}
