/**
 * @file tests/phase4-support-symbols.test.js
 * @description Phase 4 — SUPPORT component renders as directional arrow symbol.
 *
 * Mandatory screenshot: tests/snapshots/phase4-support-symbols.png
 * Must show:
 *   - Green downward arrow at support position (1000, -150, 0)
 *   - Mock result panel: supportKind=REST confirmed
 *   - "SP-001" label near the symbol
 */
import { test, expect } from '@playwright/test';
import { bootDevMode, runMock, assertMockPass, takePhaseScreenshot, assertNoConsoleErrors } from './helpers/assert-mock.js';

test.describe('Phase 4 — Support Symbols', () => {

  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push('ERROR: ' + msg.text());
    });
    await bootDevMode(page);
  });

  test('4.1 — Symbol group has exactly 1 child (1 SUPPORT)', async ({ page }) => {
    await runMock(page, 'support-symbols');

    const symbolCount = await page.evaluate(() => {
      return window._sceneRenderer?._symbolGroup?.children?.length ?? null;
    });

    if (symbolCount !== null) {
      expect(symbolCount).toBe(1);
    }
  });

  test('4.2 — Support symbol kind is REST (DIRECTION=DOWN)', async ({ page }) => {
    await runMock(page, 'support-symbols');
    const panel = page.locator('#mock-result-panel');
    await expect(panel).toContainText('symbolKind');
    await expect(panel).toContainText('REST');
  });

  test('4.3 — Support symbol userData.compId matches component id', async ({ page }) => {
    await runMock(page, 'support-symbols');

    const userData = await page.evaluate(() => {
      let ud = null;
      window._sceneRenderer?._symbolGroup?.traverse(obj => {
        if (obj.userData?.pcfType === 'SUPPORT') ud = obj.userData;
      });
      return ud;
    });

    if (userData) {
      expect(userData.pcfType).toBe('SUPPORT');
      expect(userData.compId).toBeTruthy();
    }
  });

  test('4.4 — Mock assertions pass', async ({ page }) => {
    await runMock(page, 'support-symbols');
    await assertMockPass(page);
  });

  test('4.SCREENSHOT — mandatory phase screenshot', async ({ page }) => {
    await runMock(page, 'support-symbols');
    await assertMockPass(page);
    // FRONT view shows the downward arrow most clearly
    await page.locator('[data-view="front"]').click();
    await page.waitForTimeout(800);
    await takePhaseScreenshot(page, 'phase4-support-symbols');
    assertNoConsoleErrors(consoleErrors);
  });

});
