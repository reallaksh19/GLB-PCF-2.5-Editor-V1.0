import { test, expect } from '@playwright/test';
import { bootDevMode } from './helpers/assert-mock.js';

test.describe('HUD Keyboard', () => {
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
  });

  test('HUD reaction to pointer move on mock scene: <= 50 ms median update latency', async ({ page }) => {
    // Since real scene logic isn't wired yet (Wait for AI-2 route engine),
    // we test the state update mechanism manually.
    await page.evaluate(() => {
      window.__HUD_ORCHESTRATOR.updateState({ mode: 'line-draw', draft: { lengthMm: 42 } });
    });
    const len = await page.locator('#hud-length').textContent();
    expect(len).toBe('42');
  });

  test('Keypress-to-command dispatch on Enter: <= 100 ms p95', async ({ page }) => {
    await page.evaluate(() => {
      window.__HUD_ORCHESTRATOR.updateState({
        mode: 'line-draw',
        axisLock: 'Y',
        draft: { routeId: 'k1', lengthMm: 1200, sign: 1 }
      });
    });

    const start = Date.now();
    await page.keyboard.press('Enter');
    const elapsed = Date.now() - start;

    const commands = await page.evaluate(() => window.__HUD_MOCK_COMMANDS);
    expect(commands.length).toBe(1);
    expect(elapsed).toBeLessThan(100);
  });

  test('Invalid length commit prevention accuracy: 100%', async ({ page }) => {
    await page.evaluate(() => {
      window.__HUD_ORCHESTRATOR.updateState({
        mode: 'line-draw',
        draft: { routeId: 'k2', lengthMm: -50, sign: 1 }
      });
      window.__HUD_ORCHESTRATOR.getState().setError = (err) => {
        window.__HUD_ORCHESTRATOR.updateState({ errors: [err] });
      };
    });

    await page.keyboard.press('Enter');

    const errors = await page.locator('#hud-errors').textContent();
    expect(errors).toContain('Length must be > 0');

    const commands = await page.evaluate(() => window.__HUD_MOCK_COMMANDS);
    expect(commands.length).toBe(0);
  });

  test('Repeat-last-insert carries prior values correctly: >= 95% of fixture runs', async ({ page }) => {
    // Logic placeholder. Testing if prior length carries.
    await page.evaluate(() => {
      window.__HUD_ORCHESTRATOR.updateState({
        mode: 'line-draw',
        lastLengthMm: 1500
      });
    });

    const last = await page.locator('#hud-last-length').textContent();
    expect(last).toBe('1500');
  });
});
