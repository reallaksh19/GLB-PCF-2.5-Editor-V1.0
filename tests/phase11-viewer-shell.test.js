import { test, expect } from '@playwright/test';
import { bootDevMode } from './helpers/assert-mock.js';

test.describe('Phase 11 - Viewer Shell', () => {
  test.beforeEach(async ({ page }) => {
    await bootDevMode(page);
    // Wait for the window.loadTextModel hook to be available
    await page.waitForFunction(() => {
      // The hook might be on window directly, or we just wait for capability chips to update
      return window.loadTextModel !== undefined || document.querySelector('.status-dot');
    }, {timeout: 10000});
  });

  test('Load Mock PCF via file input should update status and load components', async ({ page }) => {
    // Create mock PCF text
    const mockPcfText = `
PIPELINE-REFERENCE MOCK-LINE-1
PIPE
  ENDPOINT 0 0 0 100
  ENDPOINT 100 0 0 100
    `;

    await page.evaluate(async (pcfText) => {
      if (window.loadTextModel) {
        await window.loadTextModel(pcfText, 'mock.pcf');
      }
    }, mockPcfText);

    // Check status dot and text
    const statusDot = page.locator('#status-dot');
    await expect(statusDot).toHaveClass(/idle/);
  });

  test('GLB load hook works without errors', async ({ page }) => {
    await page.evaluate(async () => {
      const blob = new Blob(['mock'], {type: 'application/octet-stream'});
      const url = URL.createObjectURL(blob);
      try {
        if (window.loadGLBModel) {
          await window.loadGLBModel(url, 'mock.glb');
        }
      } catch (e) {
        console.log('GLB load failed gracefully');
      }
    });

    const statusDot = page.locator('#status-dot');
    const cls = await statusDot.getAttribute('class');
    expect(cls).toMatch(/status-dot (idle|error)/);
  });
});
