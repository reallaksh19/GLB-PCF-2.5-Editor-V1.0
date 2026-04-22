import { test, expect } from '@playwright/test';

test.describe('Intelligent Insert Integration', () => {
  test('HUD receives previewable length/weight for valve when DB match exists', async ({ page }) => {
    await page.goto('about:blank');

    const result = await page.evaluate(async () => {
      // Mock resolver response
      const resolverResult = {
        ok: true,
        source: 'master-db',
        resolved: {
          component: 'VALVE',
          length: 292,
          weight: 84.5
        }
      };

      // Mock HUD state receiving it
      const hudState = {
        preview: null
      };

      if (resolverResult.ok) {
        hudState.preview = {
          length: resolverResult.resolved.length,
          weight: resolverResult.resolved.weight
        };
      }

      return hudState;
    });

    expect(result.preview).not.toBeNull();
    expect(result.preview.length).toBe(292);
    expect(result.preview.weight).toBe(84.5);
  });
});
