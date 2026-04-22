/**
 * @file tests/phase10-dxf.test.js
 * @description Phase 10 — DXF import parses entities; DXF export produces valid ASCII.
 *
 * Mandatory screenshot: tests/snapshots/phase10-dxf.png
 * Must show:
 *   - DXF components visible in scene (6 components from MOCK_DXF_TEXT)
 *   - Export DXF button enabled
 *   - Mock result panel: PASS (6 components, correct types)
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { bootDevMode, runMock, assertMockPass, takePhaseScreenshot, assertNoConsoleErrors } from './helpers/assert-mock.js';

test.describe('Phase 10 — DXF Import + Export', () => {

  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push('ERROR: ' + msg.text());
    });
    await bootDevMode(page);
  });

  test('10.1 — DXF import: 6 components parsed', async ({ page }) => {
    await runMock(page, 'dxf-import');
    await assertMockPass(page);
    const panel = page.locator('#mock-result-panel');
    await expect(panel).toContainText('componentCount: expected 6, got 6');
  });

  test('10.2 — DXF import: correct type breakdown', async ({ page }) => {
    await runMock(page, 'dxf-import');
    const panel = page.locator('#mock-result-panel');
    await expect(panel).toContainText('PIPE count: expected 3, got 3');
    await expect(panel).toContainText('ELBOW count: expected 1, got 1');
    await expect(panel).toContainText('FLANGE count: expected 1, got 1');
  });

  test('10.3 — DXF import: layer maps to PIPELINE-REFERENCE', async ({ page }) => {
    await runMock(page, 'dxf-import');
    const panel = page.locator('#mock-result-panel');
    await expect(panel).toContainText('TEST-LINE-A');
  });

  test('10.4 — DXF import: ACI colour 1 maps to material CS', async ({ page }) => {
    await runMock(page, 'dxf-import');
    const panel = page.locator('#mock-result-panel');
    await expect(panel).toContainText('CS');
  });

  test('10.5 — DXF export: file downloads with .dxf extension', async ({ page }) => {
    await runMock(page, 'dxf-export');

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15_000 }),
      page.locator('#btn-export-dxf').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.dxf$/i);
  });

  test('10.6 — DXF export: file contains SECTION and LINE entities', async ({ page }) => {
    await runMock(page, 'dxf-export');

    const downloadDir = path.join(process.cwd(), 'tests', 'downloads');
    fs.mkdirSync(downloadDir, { recursive: true });

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15_000 }),
      page.locator('#btn-export-dxf').click(),
    ]);

    const savePath = path.join(downloadDir, 'test-export.dxf');
    await download.saveAs(savePath);

    const text = fs.readFileSync(savePath, 'utf-8');
    expect(text).toContain('SECTION');
    expect(text).toContain('ENTITIES');
    expect(text).toContain('LINE');
    expect(text).toContain('LAYER');
    expect(text).toContain('EOF');
    expect(text).toContain('TEST-LINE-A');  // pipeline reference as layer
  });

  test('10.7 — Mock assertions pass (import)', async ({ page }) => {
    await runMock(page, 'dxf-import');
    await assertMockPass(page);
  });

  test('10.SCREENSHOT — mandatory phase screenshot', async ({ page }) => {
    // Load DXF mock into the scene
    await runMock(page, 'dxf-import');
    await assertMockPass(page);

    // Click ISO-NE for the DXF scene view
    await page.locator('[data-view="iso-ne"]').click();
    await page.waitForTimeout(800);

    await takePhaseScreenshot(page, 'phase10-dxf');
    assertNoConsoleErrors(consoleErrors);
  });

});
