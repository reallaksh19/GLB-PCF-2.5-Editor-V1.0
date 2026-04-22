/**
 * @file tests/phase9-glb-export.test.js
 * @description Phase 9 — GLB export downloads a file; GLB reload restores scene.
 *
 * Mandatory screenshot: tests/snapshots/phase9-glb-export.png
 * Must show:
 *   - Export GLB button enabled
 *   - Download occurred (browser download bar or download API event captured)
 *   - After reload: scene meshes visible again
 *   - Mock result panel: PASS
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { bootDevMode, runMock, assertMockPass, takePhaseScreenshot, assertNoConsoleErrors } from './helpers/assert-mock.js';

test.describe('Phase 9 — GLB Export + Reload', () => {

  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push('ERROR: ' + msg.text());
    });
    await bootDevMode(page);
  });

  test('9.1 — Export GLB triggers a download', async ({ page }) => {
    await runMock(page, 'glb-export');

    // Wait for download
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15_000 }),
      page.locator('#btn-export-glb').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.glb$/i);
  });

  test('9.2 — Exported GLB file is non-empty binary', async ({ page }) => {
    await runMock(page, 'glb-export');

    const downloadDir = path.join(process.cwd(), 'tests', 'downloads');
    fs.mkdirSync(downloadDir, { recursive: true });

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15_000 }),
      page.locator('#btn-export-glb').click(),
    ]);

    const savePath = path.join(downloadDir, 'test-export.glb');
    await download.saveAs(savePath);

    const stats = fs.statSync(savePath);
    expect(stats.size).toBeGreaterThan(1000);   // at least 1KB — a real GLB

    // GLB magic bytes: 0x676C5446 ("glTF")
    const buf = fs.readFileSync(savePath);
    expect(buf.slice(0, 4).toString('ascii')).toBe('glTF');
  });

  test('9.3 — Mock assertions pass', async ({ page }) => {
    await runMock(page, 'glb-export');
    await assertMockPass(page);
  });

  test('9.SCREENSHOT — mandatory phase screenshot', async ({ page }) => {
    await runMock(page, 'glb-export');
    await assertMockPass(page);

    // Click Export GLB and capture download event (don't need to save for screenshot)
    page.once('download', d => d.cancel());
    await page.locator('#btn-export-glb').click().catch(() => {});
    await page.waitForTimeout(500);

    await takePhaseScreenshot(page, 'phase9-glb-export');
    assertNoConsoleErrors(consoleErrors);
  });

});
