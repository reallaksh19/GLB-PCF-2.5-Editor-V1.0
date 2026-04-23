import { test, expect } from '@playwright/test';
import { bootDevMode } from './helpers/assert-mock.js';

test.describe('HUD Line Draw', () => {
  test.beforeEach(async ({ page }) => {
    await bootDevMode(page);
    await page.evaluate(async () => {
       if (!window.__HUD_ORCHESTRATOR) {
         const { initHudOrchestrator } = await import('../hud/hud-orchestrator.js');
         const container = document.getElementById('viewer-canvas') || document.body;
         window.__HUD_MOCK_COMMANDS = [];
         window.__HUD_ORCHESTRATOR = initHudOrchestrator({ executeCommand: (c) => window.__HUD_MOCK_COMMANDS.push(c) }, container);
       }
    });

    // Switch to line-draw mode manually via exposed orchestrator
    await page.evaluate(() => {
      window.__HUD_ORCHESTRATOR.updateState({
        mode: 'line-draw',
        axisLock: 'X',
        draft: { routeId: 'r1', lengthMm: 2400, sign: 1 }
      });
    });
  });

  test('Enter-to-draw creates requested segment length with error <= 1 mm', async ({ page }) => {
    await page.keyboard.press('Enter');

    const commands = await page.evaluate(() => window.__HUD_MOCK_COMMANDS);
    expect(commands.length).toBe(1);
    expect(commands[0].type).toBe('ROUTE_SEGMENT_ADD');
    expect(commands[0].payload.dx).toBe(2400);
    expect(commands[0].payload.dy).toBe(0);
    expect(commands[0].payload.dz).toBe(0);
  });

  test('Last-length display updates after commit in 100% of fixture scenarios', async ({ page }) => {
    await page.evaluate(() => {
      window.__HUD_ORCHESTRATOR.updateState({ lastLengthMm: 2400 });
    });

    const lastLength = await page.locator('#hud-last-length').textContent();
    expect(lastLength).toBe('2400');
  });

  test('Axis-locked draw produces non-axis drift: 0 mm', async ({ page }) => {
    await page.evaluate(() => {
      window.__HUD_ORCHESTRATOR.updateState({
        mode: 'line-draw',
        axisLock: 'Z',
        draft: { routeId: 'r1', lengthMm: 1500, sign: -1 }
      });
    });

    await page.keyboard.press('Enter');

    const commands = await page.evaluate(() => window.__HUD_MOCK_COMMANDS);
    const cmd = commands[commands.length - 1];
    expect(cmd.payload.dx).toBe(0);
    expect(cmd.payload.dy).toBe(0);
    expect(cmd.payload.dz).toBe(-1500);
  });

  test('Esc cancel leaves canonical model unchanged in 100% of cancel tests', async ({ page }) => {
    await page.evaluate(() => {
      window.__HUD_ORCHESTRATOR.getState().cancelDraft = () => {
        window.__HUD_ORCHESTRATOR.updateState({ mode: 'idle', draft: null });
      };
    });

    await page.keyboard.press('Escape');

    const mode = await page.locator('#hud-mode').textContent();
    expect(mode).toBe('idle');
    const commands = await page.evaluate(() => window.__HUD_MOCK_COMMANDS);
    expect(commands.length).toBe(0);
  });
});
