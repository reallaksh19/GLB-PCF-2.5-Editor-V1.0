/**
 * @file tests/helpers/assert-mock.js
 * @description Playwright test helper — asserts mock result panel shows PASS
 *              and takes a mandatory screenshot.
 */
import { expect } from '@playwright/test';
import path from 'path';

/**
 * Set dev mode flag and wait for page to boot.
 * Call at the start of every test.
 * @param {import('@playwright/test').Page} page
 */
export async function bootDevMode(page) {
  // Set dev flag before any scripts run
  await page.addInitScript(() => { window.__GLB_PCF_DEV__ = true; });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  // Wait for app boot log
  await page.waitForFunction(() => typeof window.capabilities !== 'undefined'
    || document.querySelector('[data-cap]') !== null,
    { timeout: 10_000 }
  );
}

/**
 * Click the 🔬 Mock button for a capability and wait for the result panel.
 * @param {import('@playwright/test').Page} page
 * @param {string} capId
 */
export async function runMock(page, capId) {
  const btn = page.locator(`[data-cap-mock="${capId}"]`);
  await btn.first().click({ force: true });

  // Wait for result panel to appear
  await page.waitForSelector('#mock-result-panel', { state: 'visible', timeout: 10_000 });
}

/**
 * Assert that the mock result panel shows PASS.
 * @param {import('@playwright/test').Page} page
 */
export async function assertMockPass(page) {
  const panel = page.locator('#mock-result-panel');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('PASS');
  await expect(panel).not.toContainText('FAIL');
}

/**
 * Assert capability chip is green (ready).
 * @param {import('@playwright/test').Page} page
 * @param {string} capId
 */
export async function assertCapabilityReady(page, capId) {
  const chip = page.locator(`[data-cap-chip="${capId}"]`);
  if (await chip.isVisible()) {
    await expect(chip).toContainText('●');
    const color = await chip.evaluate(el => el.style.color);
    expect(color).toBe('rgb(74, 222, 128)');   // #4ade80 green
  }
}

/**
 * Take the mandatory phase screenshot.
 * The screenshot MUST capture:
 *   1. Full browser viewport at 1280×800
 *   2. Mock result panel showing PASS (bottom-right)
 *   3. The feature actively in use
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} snapshotName  e.g. 'phase1-pcf-parse'
 */
export async function takePhaseScreenshot(page, snapshotName) {
  // Ensure mock panel is visible in shot
  const panel = page.locator('#mock-result-panel');
  await expect(panel).toBeVisible();
  // Take full-page screenshot
  await page.screenshot({
    path:     path.join('tests', 'snapshots', `${snapshotName}.png`),
    fullPage: false,   // viewport only — shows browser chrome context
  });
}

/**
 * Assert no red console errors fired since page load.
 * @param {string[]} consoleErrors  collected via page.on('console', ...)
 */
export function assertNoConsoleErrors(consoleErrors) {
  const fatal = consoleErrors.filter(msg =>
    msg.startsWith('ERROR') &&
    !msg.includes('[capabilities]') &&  // expected capability warnings are ok
    !msg.includes('Not yet implemented')
  );
  expect(fatal, `Unexpected console errors:\n${fatal.join('\n')}`).toHaveLength(0);
}
