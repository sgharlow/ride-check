// Capture the four submission screenshots from the live deployed URL.
// Run with: npx playwright install chromium && node scripts/capture-screenshots.mjs
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const SHOTS_DIR = resolve('submission/screenshots');
const BASE = 'https://ride-check.vercel.app';
const VIEWPORT = { width: 1366, height: 768 };

async function main() {
  await mkdir(SHOTS_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });

  // Screenshot 1: Landing page
  {
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS_DIR}/01-landing.png`, fullPage: false });
    console.log('01-landing.png captured');
    await page.close();
  }

  // Screenshot 2: Loading skeleton state for the Civic profile.
  // Strategy: intercept the /api/profile call and delay it long enough to screenshot the loading.tsx skeleton.
  {
    const page = await context.newPage();
    await page.route('**/api/profile*', async route => {
      await new Promise(r => setTimeout(r, 8000));
      await route.continue();
    });
    const navPromise = page.goto(`${BASE}/profile/2007-honda-civic?mi=180000&p=4500`, { waitUntil: 'commit' });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${SHOTS_DIR}/02-loading.png`, fullPage: false });
    console.log('02-loading.png captured');
    await navPromise.catch(() => {});
    await page.close();
  }

  // Screenshot 3: F-grade 2007 Honda Civic result page
  {
    const page = await context.newPage();
    await page.goto(`${BASE}/profile/2007-honda-civic?mi=180000&p=4500`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SHOTS_DIR}/03-civic-f-grade.png`, fullPage: true });
    console.log('03-civic-f-grade.png captured');
    await page.close();
  }

  // Screenshot 4: B-grade 2023 Toyota RAV4 result page
  {
    const page = await context.newPage();
    await page.goto(`${BASE}/profile/2023-toyota-rav4?mi=30000&p=32000`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SHOTS_DIR}/04-rav4-b-grade.png`, fullPage: true });
    console.log('04-rav4-b-grade.png captured');
    await page.close();
  }

  await browser.close();
  console.log('All 4 screenshots captured to', SHOTS_DIR);
}

main().catch(e => { console.error(e); process.exit(1); });
