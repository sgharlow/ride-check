/**
 * Profile orchestrator — wires the upstream clients, scoring functions, and
 * verdict generator into a single Profile JSON.
 *
 * Implements docs/spec.md > Library (lib/) > lib/profile.ts and the
 * 3-parallel + 1-sequential fan-out described in docs/spec.md > Architecture
 * Overview. Note that lib/upstream/ncap.ts already wraps step-1 + step-2
 * internally, so from this orchestrator's perspective NCAP is one Promise.
 *
 * Algorithm:
 *   1. Promise.allSettled([fetchRecalls, fetchComplaints, fetchNcap]) — three
 *      parallel upstreams. Rejections are converted to available:false
 *      SubScores with the rejection's message as the reason. NCAP fulfilled-
 *      with-null (legitimate "no rating") is also unavailable but with reason
 *      'no rating'.
 *   2. Compute emissions (year-only) and ageWear (year + mileage) locally —
 *      always available per types.
 *   3. Run sub-score functions, combine() for composite + letter, then
 *      generateVerdict() for the plain-English copy.
 *   4. Special case: composite=null (3+ unavailable) returns a deterministic
 *      "not enough data" verdict and skips generateVerdict (which expects a
 *      non-null letter).
 *   5. Assemble sources[] (one per data source plus methodology) and
 *      unavailable[] (the SourceKey list of failed upstreams).
 *
 * Pure — no Next.js types, no Response, no caching directives. Called by
 * /api/profile/route.ts only.
 */
import type {
  Profile,
  Recall,
  SourceKey,
  SourceLink,
  SubScore,
} from '@/lib/types';
import {fetchRecalls} from '@/lib/upstream/recalls';
import {fetchComplaints} from '@/lib/upstream/complaints';
import {fetchNcap} from '@/lib/upstream/ncap';
import {subRecallScore} from '@/lib/scoring/recalls';
import {subComplaintsScore} from '@/lib/scoring/complaints';
import {subSafetyScore} from '@/lib/scoring/safety';
import {subEmissionsScore} from '@/lib/scoring/emissions';
import {subAgeWearScore} from '@/lib/scoring/ageWear';
import {combine} from '@/lib/scoring/composite';
import {generateVerdict} from '@/lib/summary';

export type BuildProfileInput = {
  year: number;
  make: string;
  model: string;
  mileage: number;
  price: number | null;
};

/**
 * Reduce a PromiseSettledResult into a short, user-safe error string. We
 * surface the upstream's error message but keep it bounded so an HTML 500
 * page from a rogue NHTSA mirror doesn't end up serialized into the SubScore.
 */
function reasonFromRejection(reason: unknown): string {
  if (reason instanceof Error) {
    return reason.message.slice(0, 200);
  }
  if (typeof reason === 'string') {
    return reason.slice(0, 200);
  }
  return 'upstream error';
}

/**
 * Build one of the three result-card source links. The url shape mirrors
 * NHTSA's public page conventions documented in docs/spec.md > SourcesStrip.
 */
function ymmSourceUrl(
  key: 'recalls' | 'complaints' | 'safety',
  year: number,
  make: string,
  model: string,
): string {
  const m = encodeURIComponent(make);
  const mo = encodeURIComponent(model);
  switch (key) {
    case 'recalls':
      return `https://www.nhtsa.gov/vehicle/${year}/${m}/${mo}`;
    case 'complaints':
      return `https://www.nhtsa.gov/vehicle/${year}/${m}/${mo}#complaints`;
    case 'safety':
      return `https://www.nhtsa.gov/ratings/${year}/${make ? m : ''}/${mo}`;
  }
}

export async function buildProfile(input: BuildProfileInput): Promise<Profile> {
  const {year, make, model, mileage, price} = input;

  // --- 1. Fan-out: 3 parallel upstreams (NCAP wraps both internal steps).
  const [recallsR, complaintsR, ncapR] = await Promise.allSettled([
    fetchRecalls(year, make, model),
    fetchComplaints(year, make, model),
    fetchNcap(year, make, model),
  ]);

  // --- 2. Settle each into a SubScore + capture raw recalls list (needed
  // by the verdict generator to enumerate categories on F/D grades).
  let recallsList: Recall[] = [];
  let recalls: SubScore;
  if (recallsR.status === 'fulfilled') {
    recallsList = recallsR.value;
    recalls = {
      available: true,
      value: subRecallScore(recallsList),
      sourceLabel: 'NHTSA Recalls',
    };
  } else {
    recalls = {
      available: false,
      value: null,
      reason: reasonFromRejection(recallsR.reason),
    };
  }

  let complaints: SubScore;
  if (complaintsR.status === 'fulfilled') {
    const raw = subComplaintsScore(complaintsR.value);
    complaints = {
      available: true,
      value: Math.round(raw),
      sourceLabel: 'NHTSA Complaints',
    };
  } else {
    complaints = {
      available: false,
      value: null,
      reason: reasonFromRejection(complaintsR.reason),
    };
  }

  let safety: SubScore;
  if (ncapR.status === 'fulfilled') {
    if (ncapR.value === null) {
      // Legitimate "no rating" — NCAP step 1 returned 0 results, OR step 2
      // returned "Not Rated". Per spec this is unavailable for scoring but
      // not an error.
      safety = {available: false, value: null, reason: 'no rating'};
    } else {
      const computed = subSafetyScore(ncapR.value.overallRating);
      if (computed === null) {
        safety = {available: false, value: null, reason: 'no rating'};
      } else {
        safety = {
          available: true,
          value: computed,
          sourceLabel: 'NCAP',
        };
      }
    }
  } else {
    safety = {
      available: false,
      value: null,
      reason: reasonFromRejection(ncapR.reason),
    };
  }

  // --- 3. Local-only sub-scores. Always available per types.
  const emissions: SubScore = {
    available: true,
    value: subEmissionsScore(year),
    sourceLabel: 'Emissions Tier (computed)',
  };

  const ageWear: SubScore = {
    available: true,
    value: Math.round(subAgeWearScore(year, mileage)),
    sourceLabel: 'Age & Wear (computed)',
  };

  const subScores: Profile['subScores'] = {
    recalls,
    complaints,
    safety,
    emissions,
    ageWear,
  };

  // --- 4. Composite + letter (with renormalization for 1-2 unavailables).
  const combined = combine(subScores);

  // --- 5. Verdict. If composite is null (3+ unavailable), use the
  // deterministic "not enough public data" copy and skip the generator
  // (which assumes a real letter grade).
  let verdict: string;
  if (combined.composite === null || combined.letter === null) {
    verdict = 'Not enough public data on this vehicle to compute a grade.';
  } else {
    verdict = generateVerdict({
      letter: combined.letter,
      subScores,
      // If recalls upstream rejected, we have no list to pass — empty array
      // means the verdict generator's recalls breakdown sentence falls
      // through (which is fine because an unavailable recalls SubScore
      // can't be in the top-3-by-contribution anyway).
      recalls: recallsList,
    });
  }

  // --- 6. Sources strip. One entry per source, marked with note when
  // the corresponding SubScore is unavailable. Order: data sources, then
  // emissions methodology, then the GitHub methodology link.
  const sources: SourceLink[] = [
    {
      key: 'recalls',
      label: 'NHTSA Recalls',
      url: ymmSourceUrl('recalls', year, make, model),
      ...(recalls.available ? {} : {note: 'no data returned'}),
    },
    {
      key: 'complaints',
      label: 'NHTSA Complaints',
      url: ymmSourceUrl('complaints', year, make, model),
      ...(complaints.available ? {} : {note: 'no data returned'}),
    },
    {
      key: 'safety',
      label: 'NCAP Safety Ratings',
      url: ymmSourceUrl('safety', year, make, model),
      ...(safety.available ? {} : {note: 'no data returned'}),
    },
    {
      key: 'emissions',
      label: 'EPA Tier methodology',
      url: 'https://www.epa.gov/regulations-emissions-vehicles-and-engines/final-rule-control-air-pollution-motor-vehicles-tier-3',
    },
    {
      key: 'methodology',
      label: 'How we calculate this',
      url: 'https://github.com/sgharlow/ride-check#scoring',
    },
  ];

  // --- 7. unavailable[]: which of the three data-driven sources failed.
  const unavailable: SourceKey[] = [];
  if (!recalls.available) unavailable.push('recalls');
  if (!complaints.available) unavailable.push('complaints');
  if (!safety.available) unavailable.push('safety');

  return {
    vehicle: {year, make, model, mileage, price},
    composite: combined.composite,
    letter: combined.letter,
    subScores,
    verdict,
    sources,
    unavailable,
    renormalized: combined.renormalized,
  };
}
