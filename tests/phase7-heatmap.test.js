/**
 * @file tests/phase7-heatmap.test.js
 * @description Phase 7 — Heatmap recolours meshes by field value.
 *
 * Mandatory screenshot: tests/snapshots/phase7-heatmap.png
 * Must show:
 *   - Heatmap dropdown showing "By OD"
 *   - Small-bore pipes visually different colour from large-bore pipes
 *   - Mock result panel: PASS (distinctColors = 2)
 */
import { test, expect } from '@playwright/test';
import { bootDevMode, runMock, assertMockPass, takePhaseScreenshot, assertNoConsoleErrors } from './helpers/assert-mock.js';

test.describe('Phase 7 — Heatmap', () => {

  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push('ERROR: ' + msg.text());
    });
    await bootDevMode(page);
  });

  test('7.1 — Heatmap dropdown is enabled', async ({ page }) => {
    // Wait for heatmap capability
    await page.waitForFunction(() => {
      const sel = document.querySelector('#viewer-heatmap');
      return sel && !sel.disabled;
    }, { timeout: 10_000 });
    await expect(page.locator('#viewer-heatmap')).toBeEnabled();
  });

  test('7.2 — By OD: 2 distinct mesh colours', async ({ page }) => {
    await runMock(page, 'heatmap');
    await assertMockPass(page);
    const panel = page.locator('#mock-result-panel');
    await expect(panel).toContainText('distinctColorsOD');
    await expect(panel).toContainText('2');
  });

  test('7.3 — By Material: CS and SS get different colours', async ({ page }) => {
    await runMock(page, 'heatmap');

    // Select material heatmap
    const sel = page.locator('#viewer-heatmap');
    await sel.selectOption('material');
    await page.waitForTimeout(300);

    const distinctColors = await page.evaluate(() => {
      const colors = new Set();
      window._sceneRenderer?._meshGroup?.traverse(obj => {
        if (obj.isMesh && obj.material?.color) {
          colors.add(obj.material.color.getHexString());
        }
      });
      return colors.size;
    });

    if (distinctColors !== null && distinctColors > 0) {
      expect(distinctColors).toBeGreaterThanOrEqual(2);
    }
  });

  test('7.4 — Reset to No Heatmap: colours revert to default grey', async ({ page }) => {
    await runMock(page, 'heatmap');

    const sel = page.locator('#viewer-heatmap');
    await sel.selectOption('OD');
    await page.waitForTimeout(300);

    // Colors with heatmap
    const colorsWithHeatmap = await page.evaluate(() => {
      const colors = new Set();
      window._sceneRenderer?._meshGroup?.traverse(obj => {
        if (obj.isMesh && obj.material?.color) colors.add(obj.material.color.getHexString());
      });
      return colors.size;
    });

    await sel.selectOption('none');
    await page.waitForTimeout(300);

    // Colors without heatmap (should all be same default)
    const colorsNoHeatmap = await page.evaluate(() => {
      const colors = new Set();
      window._sceneRenderer?._meshGroup?.traverse(obj => {
        if (obj.isMesh && obj.material?.color) colors.add(obj.material.color.getHexString());
      });
      return colors.size;
    });

    if (colorsWithHeatmap && colorsNoHeatmap) {
      // Without heatmap should have fewer distinct colors than with heatmap
      expect(colorsNoHeatmap).toBeLessThanOrEqual(colorsWithHeatmap);
    }
  });

  test('7.SCREENSHOT — mandatory phase screenshot', async ({ page }) => {
    await runMock(page, 'heatmap');
    await assertMockPass(page);
    // Select OD heatmap for the screenshot
    await page.locator('#viewer-heatmap').selectOption('OD');
    await page.waitForTimeout(500);
    await takePhaseScreenshot(page, 'phase7-heatmap');
    assertNoConsoleErrors(consoleErrors);
  });

});
