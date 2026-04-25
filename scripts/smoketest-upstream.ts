/**
 * scripts/smoketest-upstream.ts
 *
 * One-off live-API verification for the four upstream clients in
 * lib/upstream/*. Exists to satisfy item 6's acceptance step:
 *   "Run a one-off script that calls each upstream against the 2007 Civic
 *    fixture; print the results; eyeball that the recall list has 6+
 *    airbag entries, complaints count is plausible (>0), NCAP returns a
 *    star rating, and vPIC's model list contains Civic."
 *
 * NOT a unit test. Lives in scripts/ so Vitest doesn't pick it up. Hits
 * live NHTSA / vPIC APIs every run — do not commit fixtures or mocks.
 *
 * Run:
 *   npx tsx scripts/smoketest-upstream.ts
 *
 * Exit codes:
 *   0 — all four clients returned without throwing
 *   1 — any client threw, OR any of the eyeball checks failed
 *
 * Per Steve's CLAUDE.md: avoid curl on Windows (SSL issues). This is
 * Node fetch end-to-end.
 */

import {fetchRecalls} from '../lib/upstream/recalls';
import {fetchComplaints} from '../lib/upstream/complaints';
import {fetchNcap} from '../lib/upstream/ncap';
import {fetchModels} from '../lib/upstream/vpic';

type CheckResult = {label: string; passed: boolean; detail: string};

function fmt(label: string, value: unknown): string {
  return `\n=== ${label} ===\n${JSON.stringify(value, null, 2)}`;
}

async function main(): Promise<number> {
  const checks: CheckResult[] = [];

  // -- Recalls: 2007 Honda Civic ---------------------------------------------
  console.log('\n--- fetchRecalls(2007, "Honda", "Civic") ---');
  const recalls = await fetchRecalls(2007, 'Honda', 'Civic');
  console.log(`recalls.length = ${recalls.length}`);
  console.log('first 3 components:');
  for (const r of recalls.slice(0, 3)) {
    console.log(`  - ${r.component} (campaign ${r.campaignNumber})`);
  }
  const airbagCount = recalls.filter((r) =>
    r.component.startsWith('AIR BAGS'),
  ).length;
  checks.push({
    label: 'recalls >= 9',
    passed: recalls.length >= 9,
    detail: `got ${recalls.length}`,
  });
  checks.push({
    label: 'airbag-prefixed components >= 6',
    passed: airbagCount >= 6,
    detail: `got ${airbagCount}`,
  });

  // -- Complaints: 2007 Honda Civic ------------------------------------------
  console.log('\n--- fetchComplaints(2007, "Honda", "Civic") ---');
  const complaints = await fetchComplaints(2007, 'Honda', 'Civic');
  console.log(`complaints count = ${complaints}`);
  checks.push({
    label: 'complaints is integer',
    passed: Number.isInteger(complaints),
    detail: `got ${complaints} (typeof ${typeof complaints})`,
  });
  checks.push({
    label: 'complaints > 0',
    passed: complaints > 0,
    detail: `got ${complaints}`,
  });

  // -- NCAP: 2007 Honda Civic (two-step) -------------------------------------
  console.log('\n--- fetchNcap(2007, "Honda", "Civic") ---');
  const ncap = await fetchNcap(2007, 'Honda', 'Civic');
  console.log(fmt('ncap result', ncap));
  checks.push({
    label: 'ncap returned a rating object (not null)',
    passed: ncap !== null,
    detail: ncap === null ? 'GOT NULL — demo car would render with renormalized weights' : `got ${ncap.overallRating}`,
  });
  if (ncap !== null) {
    checks.push({
      label: 'ncap.overallRating is a finite number 0–5',
      passed:
        Number.isFinite(ncap.overallRating) &&
        ncap.overallRating >= 0 &&
        ncap.overallRating <= 5,
      detail: `got ${ncap.overallRating}`,
    });
  }

  // -- vPIC: 2014 Volkswagen models ------------------------------------------
  console.log('\n--- fetchModels(2014, "Volkswagen") ---');
  const models = await fetchModels(2014, 'Volkswagen');
  console.log(`models.length = ${models.length}`);
  console.log(`first 10: ${JSON.stringify(models.slice(0, 10))}`);
  const hasPassat = models.some((m) => m.toLowerCase() === 'passat');
  console.log(`Passat in list? ${hasPassat}`);
  checks.push({
    label: 'vPIC returned an array',
    passed: Array.isArray(models),
    detail: `length ${models.length}`,
  });
  checks.push({
    label: 'vPIC list contains "Passat"',
    passed: hasPassat,
    detail: hasPassat ? 'found' : 'NOT FOUND',
  });

  // Bonus: spec also calls for confirming vPIC for (2007, Honda) contains Civic.
  console.log('\n--- fetchModels(2007, "Honda") ---');
  const hondaModels = await fetchModels(2007, 'Honda');
  console.log(`models.length = ${hondaModels.length}`);
  const hasCivic = hondaModels.some((m) => m.toLowerCase() === 'civic');
  console.log(`Civic in list? ${hasCivic}`);
  checks.push({
    label: 'vPIC (2007, Honda) contains "Civic"',
    passed: hasCivic,
    detail: hasCivic ? 'found' : 'NOT FOUND',
  });

  // -- Summary ---------------------------------------------------------------
  console.log('\n--- summary ---');
  let allPassed = true;
  for (const c of checks) {
    const mark = c.passed ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${c.label} — ${c.detail}`);
    if (!c.passed) allPassed = false;
  }

  return allPassed ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('\nUNEXPECTED THROW:');
    console.error(err);
    process.exit(1);
  });
