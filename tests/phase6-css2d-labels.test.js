/**
 * @file tests/phase6-css2d-labels.test.js
 * @description Phase 6 — CSS2D floating labels for MESSAGE-CIRCLE and SUPPORT name.
 *
 * Mandatory screenshot: tests/snapshots/phase6-css2d-labels.png
 * Must show:
 *   - "NOTE-1" text floating at message-circle position
 *   - "SP-001" text floating near support symbol
 *   - Labels checkbox is checked
 *   - Mock result panel: PASS
 */
import { test, expect } from '@playwright/test';
import { bootDevMode, runMock, assertMockPass, takePhaseScreenshot, assertNoConsoleErrors } from './helpers/assert-mock.js';

test.describe('Phase 6 — CSS2D Labels', () => {

  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push('ERROR: ' + msg.text());
    });
    await bootDevMode(page);
  });

  test('6.1 — "NOTE-1" label visible in DOM when labels ON', async ({ page }) => {
    await runMock(page, 'css2d-labels');

    // CSS2DRenderer adds spans to the DOM inside the canvas div
    const labelText = page.locator('#viewer-canvas').getByText('NOTE-1');
    await expect(labelText).toBeVisible({ timeout: 5_000 });
  });

  test('6.2 — "SP-001" support name label visible', async ({ page }) => {
    await runMock(page, 'css2d-labels');
    const labelText = page.locator('#viewer-canvas').getByText('SP-001');
    await expect(labelText).toBeVisible({ timeout: 5_000 });
  });

  test('6.3 — Labels toggle OFF hides labels', async ({ page }) => {
    await runMock(page, 'css2d-labels');

    // Labels should be visible initially
    const labelText = page.locator('#viewer-canvas').getByText('NOTE-1');
    await expect(labelText).toBeVisible({ timeout: 5_000 });

    // Uncheck labels toggle
    const toggle = page.locator('#viewer-labels-toggle');
    await expect(toggle).toBeEnabled();
    await toggle.uncheck();
    await page.waitForTimeout(300);

    // Labels should now be hidden
    await expect(labelText).not.toBeVisible();
  });

  test('6.4 — Labels toggle ON restores labels', async ({ page }) => {
    await runMock(page, 'css2d-labels');
    const toggle = page.locator('#viewer-labels-toggle');
    await toggle.uncheck();
    await page.waitForTimeout(200);
    await toggle.check();
    await page.waitForTimeout(300);
    const labelText = page.locator('#viewer-canvas').getByText('NOTE-1');
    await expect(labelText).toBeVisible();
  });

  test('6.5 — Mock assertions pass', async ({ page }) => {
    await runMock(page, 'css2d-labels');
    await assertMockPass(page);
  });

  test('6.SCREENSHOT — mandatory phase screenshot', async ({ page }) => {
    await runMock(page, 'css2d-labels');
    await assertMockPass(page);
    // Ensure labels visible
    await expect(page.locator('#viewer-canvas').getByText('NOTE-1')).toBeVisible();
    await takePhaseScreenshot(page, 'phase6-css2d-labels');
    assertNoConsoleErrors(consoleErrors);
  });

});
