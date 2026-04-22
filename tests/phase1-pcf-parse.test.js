/**
 * @file tests/phase1-pcf-parse.test.js
 * @description Phase 1 verification — PCF parsing + piping domain registry.
 *
 * Mandatory screenshot: tests/snapshots/phase1-pcf-parse.png
 * Must show:
 *   - Mock result panel: "✅ PASS (5/5 assertions)"
 *   - Debug tab Summary: "Components: 10"
 *   - Component type breakdown matching MOCK_EXPECTED.pcf.byType
 *   - Domain badge showing "domain: piping"
 */
import { test, expect } from '@playwright/test';
import { bootDevMode, runMock, assertMockPass, assertCapabilityReady, takePhaseScreenshot, assertNoConsoleErrors } from './helpers/assert-mock.js';

test.describe('Phase 1 — PCF Parse + Piping Domain', () => {

  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push('ERROR: ' + msg.text());
    });
    await bootDevMode(page);
  });

  test('1.1 — Capability chip turns green after self-check', async ({ page }) => {
    // Wait up to 10s for the self-check to complete
    await page.waitForFunction(() => {
      const chip = document.querySelector('[data-cap-chip="pcf-parse"]');
      return chip && chip.textContent === '●';
    }, { timeout: 10_000 });

    await assertCapabilityReady(page, 'pcf-parse');
  });

  test('1.2 — Mock load: 10 components, correct type breakdown', async ({ page }) => {
    // Run mock for pcf-parse
    await runMock(page, 'pcf-parse');

    // Switch to debug tab to see results
    await page.click('#rtab-debug');

    await assertMockPass(page);

    // Assert mock panel shows expected count
    const panel = page.locator('#mock-result-panel');
    await expect(panel).toContainText('componentCount: expected 10, got 10');
    await expect(panel).toContainText('PIPE count: expected 3, got 3');
    await expect(panel).toContainText('ELBOW count: expected 2, got 2');

    // Assert debug tab summary (requires debug-tab capability to be ready too,
    // but even placeholder debug-tab may show raw data injected by mock)
    const debugContent = page.locator('#debug-content');
    if (await debugContent.isVisible()) {
      const text = await debugContent.textContent();
      if (text && !text.includes('Load a file')) {
        expect(text).toContain('10');  // total component count somewhere in summary
      }
    }
  });

  test('1.3 — ELBOW has cp (CENTRE-POINT parsed)', async ({ page }) => {
    await runMock(page, 'pcf-parse');
    const panel = page.locator('#mock-result-panel');
    await expect(panel).toContainText('elbowHasCp: expected true, got true');
  });

  test('1.4 — SUPPORT direction inferred as REST', async ({ page }) => {
    await runMock(page, 'pcf-parse');
    const panel = page.locator('#mock-result-panel');
    await expect(panel).toContainText("supportKind: expected REST, got REST");
  });

  test('1.5 — Validation: 0 errors on clean mock', async ({ page }) => {
    await runMock(page, 'pcf-parse');
    const panel = page.locator('#mock-result-panel');
    await expect(panel).toContainText('validationErrors: expected 0, got 0');
  });

  test('1.SCREENSHOT — mandatory phase screenshot', async ({ page }) => {
    // Run mock
    await runMock(page, 'pcf-parse');

    // Switch to debug tab for richer view
    await page.click('#rtab-debug');
    await page.waitForTimeout(500);

    await assertMockPass(page);

    // Ensure key elements are visible before screenshot
    await expect(page.locator('#mock-result-panel')).toBeVisible();
    await expect(page.locator('#mock-result-panel')).toContainText('PASS');

    await takePhaseScreenshot(page, 'phase1-pcf-parse');
    assertNoConsoleErrors(consoleErrors);
  });

});
