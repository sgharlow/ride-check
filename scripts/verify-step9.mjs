// Verification script for checklist item 9.
// Fetches the three result-page URLs and asserts key strings + grade letter.
const BASE = process.env.BASE || 'http://localhost:3001';

const urls = [
  {
    label: '2007 Honda Civic',
    url: '/profile/2007-honda-civic?mi=180000&p=4500',
    expectGrade: 'F',
    expect: ['airbag', 'Recalls', 'Complaints', 'Safety', 'Emissions', 'Age', 'Sources'],
    expectRenormalized: true,
  },
  {
    label: '2023 Toyota RAV4',
    url: '/profile/2023-toyota-rav4?mi=30000&p=32000',
    expectGrade: 'B',
    expect: ['Recalls', 'Complaints', 'Safety', 'Emissions', 'Age', 'Sources'],
  },
  {
    label: '9999 Frod X (invalid)',
    url: '/profile/9999-frod-x',
    expectGrade: null,
    expect: ['vehicle-not-recognized'],
  },
];

function findGradeChip(html) {
  // Look for the chip span: text-7xl font-bold ... >X<
  const match = html.match(/text-7xl[^>]*>\s*([A-F])\s*</);
  return match ? match[1] : null;
}

(async () => {
  for (const t of urls) {
    const fullUrl = BASE + t.url;
    const t0 = Date.now();
    let res, html;
    try {
      res = await fetch(fullUrl);
      html = await res.text();
    } catch (e) {
      console.log(`FAIL ${t.label}: fetch error: ${e.message}`);
      process.exit(1);
    }
    const elapsed = Date.now() - t0;
    const grade = findGradeChip(html);

    const found = {};
    for (const s of t.expect) {
      found[s] = html.includes(s);
    }
    const renormalizedSeen = html.includes('Score recalculated');

    console.log(`\n=== ${t.label} ===`);
    console.log(`URL:     ${fullUrl}`);
    console.log(`Status:  ${res.status}`);
    console.log(`Time:    ${elapsed}ms`);
    console.log(`Grade chip detected: ${grade}`);
    console.log(`Renormalized note present: ${renormalizedSeen}`);
    console.log(`String checks:`);
    for (const s of t.expect) {
      console.log(`  ${found[s] ? 'YES' : 'NO '}  ${JSON.stringify(s)}`);
    }
    if (t.expectGrade !== null && grade !== t.expectGrade) {
      console.log(`*** MISMATCH: expected grade ${t.expectGrade}, got ${grade}`);
    }
    if (t.expectRenormalized && !renormalizedSeen) {
      console.log(`*** MISMATCH: expected renormalization disclosure to be present`);
    }
  }
})();
