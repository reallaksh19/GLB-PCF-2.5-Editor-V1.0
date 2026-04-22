# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/phase10-dxf.test.js >> Phase 10 — DXF Import + Export >> 10.5 — DXF export: file downloads with .dxf extension
- Location: tests/phase10-dxf.test.js:55:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('#mock-result-panel') to be visible

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - tablist [ref=e2]:
    - tab "2.5D Viewer" [ref=e3] [cursor=pointer]:
      - img [ref=e4]
      - text: 2.5D Viewer
    - tab "Debug" [ref=e7] [cursor=pointer]:
      - img [ref=e8]
      - text: Debug
    - generic [ref=e10]:
      - generic [ref=e11]:
        - img [ref=e12]
        - heading "GLB-PCF-Editor" [level=1] [ref=e18]
      - button "☀" [ref=e20] [cursor=pointer]
  - main [ref=e21]:
    - tabpanel [ref=e22]:
      - generic [ref=e23]:
        - generic "pcf-parse" [ref=e24]: ○
        - generic "Load PCF / DXF file" [ref=e25]: PCF/DXF
        - button "📂 Open" [ref=e26] [cursor=pointer]
        - button "🔬" [ref=e27] [cursor=pointer]
        - generic "glb-load" [ref=e29]: ○
        - generic "Load GLB file"
        - button "📦 GLB" [ref=e30] [cursor=pointer]
        - button "🔬" [ref=e31] [cursor=pointer]
        - generic "scene-renderer" [ref=e33]: ○
        - button "ISO-NE" [ref=e34] [cursor=pointer]
        - button "ISO-NW" [ref=e35] [cursor=pointer]
        - button "ISO-SE" [ref=e36] [cursor=pointer]
        - button "ISO-SW" [ref=e37] [cursor=pointer]
        - button "PLAN" [ref=e38] [cursor=pointer]
        - button "FRONT" [ref=e39] [cursor=pointer]
        - button "⊞ Fit" [ref=e40] [cursor=pointer]
        - button "🔬" [ref=e41] [cursor=pointer]
        - generic "heatmap" [ref=e43]: ○
        - combobox "Colour by property" [ref=e44]:
          - option "No heatmap" [selected]
          - option "By OD / Bore"
          - option "By Material"
          - option "By Temp (T1)"
          - option "By Pressure (P1)"
        - button "🔬" [ref=e45] [cursor=pointer]
        - generic "css2d-labels" [ref=e47]: ○
        - generic "Show/hide labels" [ref=e48]:
          - checkbox "Labels" [checked] [ref=e49]
          - text: Labels
        - button "🔬" [ref=e50] [cursor=pointer]
        - button "🔬" [ref=e51] [cursor=pointer]
        - button "🔬" [ref=e52] [cursor=pointer]
        - generic "theme" [ref=e54]: ○
        - combobox "Rendering theme" [ref=e55]:
          - option "NavisDark" [selected]
          - option "DrawLight"
        - generic "glb-export" [ref=e57]: ○
        - button "⬇ GLB" [ref=e58] [cursor=pointer]
        - button "🔬" [ref=e59] [cursor=pointer]
        - generic "dxf-export" [ref=e60]: ○
        - button "⬇ DXF" [ref=e61] [cursor=pointer]
        - button "🔬 DXF Import" [ref=e62] [cursor=pointer]
        - button "🔬" [active] [ref=e63] [cursor=pointer]
        - generic [ref=e64]: Ready
      - generic [ref=e67]: Click a component to inspect
  - contentinfo [ref=e68]:
    - generic [ref=e71]: Ready
    - generic [ref=e72]: GLB-PCF-Editor — Release 1A
```

# Test source

```ts
  1  | /**
  2  |  * @file tests/helpers/assert-mock.js
  3  |  * @description Playwright test helper — asserts mock result panel shows PASS
  4  |  *              and takes a mandatory screenshot.
  5  |  */
  6  | import { expect } from '@playwright/test';
  7  | import path from 'path';
  8  |
  9  | /**
  10 |  * Set dev mode flag and wait for page to boot.
  11 |  * Call at the start of every test.
  12 |  * @param {import('@playwright/test').Page} page
  13 |  */
  14 | export async function bootDevMode(page) {
  15 |   // Set dev flag before any scripts run
  16 |   await page.addInitScript(() => { window.__GLB_PCF_DEV__ = true; });
  17 |   await page.goto('http://localhost:3000/');
  18 |   await page.waitForLoadState('networkidle');
  19 |   // Wait for app boot log
  20 |   await page.waitForFunction(() => typeof window.capabilities !== 'undefined'
  21 |     || document.querySelector('[data-cap]') !== null,
  22 |     { timeout: 10_000 }
  23 |   );
  24 | }
  25 |
  26 | /**
  27 |  * Click the 🔬 Mock button for a capability and wait for the result panel.
  28 |  * @param {import('@playwright/test').Page} page
  29 |  * @param {string} capId
  30 |  */
  31 | export async function runMock(page, capId) {
  32 |   const btn = page.locator(`[data-cap-mock="${capId}"]`);
  33 |   await btn.first().click({ force: true });
  34 |
  35 |   // Wait for result panel to appear
> 36 |   await page.waitForSelector('#mock-result-panel', { state: 'visible', timeout: 10_000 });
     |              ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  37 | }
  38 |
  39 | /**
  40 |  * Assert that the mock result panel shows PASS.
  41 |  * @param {import('@playwright/test').Page} page
  42 |  */
  43 | export async function assertMockPass(page) {
  44 |   const panel = page.locator('#mock-result-panel');
  45 |   await expect(panel).toBeVisible();
  46 |   await expect(panel).toContainText('PASS');
  47 |   await expect(panel).not.toContainText('FAIL');
  48 | }
  49 |
  50 | /**
  51 |  * Assert capability chip is green (ready).
  52 |  * @param {import('@playwright/test').Page} page
  53 |  * @param {string} capId
  54 |  */
  55 | export async function assertCapabilityReady(page, capId) {
  56 |   const chip = page.locator(`[data-cap-chip="${capId}"]`);
  57 |   if (await chip.isVisible()) {
  58 |     await expect(chip).toContainText('●');
  59 |     const color = await chip.evaluate(el => el.style.color);
  60 |     expect(color).toBe('rgb(74, 222, 128)');   // #4ade80 green
  61 |   }
  62 | }
  63 |
  64 | /**
  65 |  * Take the mandatory phase screenshot.
  66 |  * The screenshot MUST capture:
  67 |  *   1. Full browser viewport at 1280×800
  68 |  *   2. Mock result panel showing PASS (bottom-right)
  69 |  *   3. The feature actively in use
  70 |  *
  71 |  * @param {import('@playwright/test').Page} page
  72 |  * @param {string} snapshotName  e.g. 'phase1-pcf-parse'
  73 |  */
  74 | export async function takePhaseScreenshot(page, snapshotName) {
  75 |   // Ensure mock panel is visible in shot
  76 |   const panel = page.locator('#mock-result-panel');
  77 |   await expect(panel).toBeVisible();
  78 |   // Take full-page screenshot
  79 |   await page.screenshot({
  80 |     path:     path.join('tests', 'snapshots', `${snapshotName}.png`),
  81 |     fullPage: false,   // viewport only — shows browser chrome context
  82 |   });
  83 | }
  84 |
  85 | /**
  86 |  * Assert no red console errors fired since page load.
  87 |  * @param {string[]} consoleErrors  collected via page.on('console', ...)
  88 |  */
  89 | export function assertNoConsoleErrors(consoleErrors) {
  90 |   const fatal = consoleErrors.filter(msg =>
  91 |     msg.startsWith('ERROR') &&
  92 |     !msg.includes('[capabilities]') &&  // expected capability warnings are ok
  93 |     !msg.includes('Not yet implemented')
  94 |   );
  95 |   expect(fatal, `Unexpected console errors:\n${fatal.join('\n')}`).toHaveLength(0);
  96 | }
  97 |
```