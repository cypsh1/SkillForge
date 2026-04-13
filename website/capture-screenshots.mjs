/**
 * Capture SkillForge screenshots for the website.
 * Requires: SkillForge dev server running at http://localhost:5173
 * Usage: node capture-screenshots.mjs
 */
import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'public', 'screenshots');
const BASE = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Navigate to app
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click tech-news-digest (most content-rich skill)
  const tnd = page.locator('text=tech-news-digest').first();
  if (await tnd.isVisible()) {
    await tnd.click();
    await page.waitForTimeout(500);
  }

  // Screenshot 1: Overview (tech-news-digest selected)
  await page.screenshot({ path: join(outDir, 'hero-overview.png') });
  console.log('✓ hero-overview.png');

  // Click SKILL.md to show editor view
  const skillMd = page.locator('text=SKILL.md').first();
  if (await skillMd.isVisible()) {
    await skillMd.click();
    await page.waitForTimeout(500);
  }

  // Screenshot 2: Editor view (visual editing pillar)
  await page.screenshot({ path: join(outDir, 'pillar-visual-edit.png') });
  console.log('✓ pillar-visual-edit.png');

  // Click sources.json to show config editing
  const sources = page.locator('text=defaults/sources.json').first();
  if (await sources.isVisible()) {
    await sources.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: join(outDir, 'pillar-connect.png') });
  console.log('✓ pillar-connect.png');

  // Go back to overview for validation screenshot
  if (await tnd.isVisible()) {
    await tnd.click();
    await page.waitForTimeout(500);
  }
  // Scroll to validation section
  await page.evaluate(() => {
    const el = document.querySelector('[class*="validation"], [class*="校验"]');
    if (el) el.scrollIntoView();
  });
  await page.screenshot({ path: join(outDir, 'pillar-quality.png') });
  console.log('✓ pillar-quality.png');

  await browser.close();
  console.log('\nAll screenshots saved to public/screenshots/');
}

main().catch(console.error);
