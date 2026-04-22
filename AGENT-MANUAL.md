# GLB-PCF-Editor — AI Agent Operating Manual

> **Read this entire document before touching any code.**
> This is the single source of truth for how to implement, verify, and hand off each
> feature of the GLB-PCF-Editor application.

---

## 1. What This App Is

GLB-PCF-Editor is a **domain-agnostic 2.5D engineering viewer** that ships with a
**piping domain** on day one. The viewer core — renderer, heatmap, component panel,
debug tab, export — knows nothing about pipes, rooms, or any specific engineering domain.
Each domain registers a plugin providing parse / geometry / label / symbol / validation.

**Stack:** Vanilla ES modules, no build tool. Three.js 0.160.0 (WebGL + CSS2D), esm.sh CDN.
Open `index.html` directly in a browser (or via local HTTP server — `file://` blocks some
ES module fetches so prefer `npx serve .` or VS Code Live Server).

**Phases:** The plan is split into 10 implementation phases (see §6). Each phase has one or
more Work Instructions (WI) in the `wi/` folder, a mock dataset, quantitative assertions,
and a mandatory Playwright snapshot.

---

## 2. Repository Layout (Key Files)

```
AGENT-MANUAL.md           ← You are here
AGENT-PLAN.md             ← High-level phased plan (see wi/ for detailed WIs)
index.html                ← App shell — importmap + full panel HTML
core/
  app.js                  ← Bootstrap (registers domain, inits tabs)
  domain-registry.js      ← registerDomain / getActiveDomain
  component-model.js      ← GenericComponent factory + componentFromUserData
  state.js                ← Minimal global settings stub
  event-bus.js            ← Pub/sub (emit / subscribe)
js/
  capabilities/
    capability-registry.js  ← Feature status tracking → drives UI grey-out
  mock/
    mock-data.js            ← Canonical mock PCF + DXF text + expected outcomes
  debug/
    logger.js               ← appLogger singleton
  renderer/
    scene-renderer.js       ← THREE.js WebGL renderer (PLACEHOLDER → WI-scene-renderer)
    canvas-renderer.js      ← Konva 2D plan view  (PLACEHOLDER → WI-canvas-renderer, R3)
  ui/
    heatmap.js              ← Heatmap traversal    (PLACEHOLDER → WI-heatmap)
    component-panel.js      ← Info panel renderer  (PLACEHOLDER → WI-component-panel)
    toolbar.js              ← Toolbar wiring        (PLACEHOLDER → WI-toolbar)
  tabs/
    viewer-tab.js           ← 2.5D viewer tab init  (PLACEHOLDER → WI-viewer-tab)
    debug-tab.js            ← Debug tab init        (PLACEHOLDER → WI-debug-tab)
  glb/
    exportSceneToGLB.js     ← GLB export (COPIED — ready)
    exportToDXF.js          ← DXF export (PLACEHOLDER → WI-exportToDXF)
  vendor/
    parsePcfText.js         ← PCF lexer (COPIED — ready)
    splitPcfBlocks.js       ← PCF block splitter (COPIED — ready)
    normalizePcfModel.js    ← PCF normaliser (COPIED — ready)
    buildDraftingScene.js   ← Drafting geometry (PLACEHOLDER → WI-buildDraftingScene)
    buildPipeMesh.js        ← Patched legacy builder (COPIED — ready)
    buildComponentObject.js ← Patched legacy builder (COPIED — ready)
    buildExportScene.js     ← Export scene builder (COPIED — ready)
domains/
  piping/
    index.js               ← Domain plugin (PLACEHOLDER → WI-piping-domain)
    parser.js              ← PCF parser wrapper (PLACEHOLDER → WI-piping-parser)
    geometry-builder.js    ← Mesh/label dispatch (PLACEHOLDER → WI-piping-geometry-builder)
    symbol-library.js      ← Support symbols (PLACEHOLDER → WI-piping-symbol-library)
    info-panel.js          ← Info panel sections (PLACEHOLDER → WI-piping-info-panel)
    dxf-importer.js        ← DXF parser (PLACEHOLDER → WI-dxf-importer)
geometry/
  pipe-geometry.js          ← colorForMode, heatMapColor (COPIED — ready)
  symbols.js                ← createSupportSymbol (COPIED — ready)
  labels.js                 ← CSS2D label builders (COPIED — ready)
  camera-utils.js           ← fitCamera helper (COPIED — ready)
wi/                         ← Work Instructions (one per placeholder file)
tests/                      ← Playwright tests (one per phase)
```

---

## 3. UI Contract — Greyed-Out Placeholders

### Rule
**Every toolbar button and interactive element is disabled by default.**
A button becomes enabled only when the capability that backs it calls
`capabilities.ready(id)` from its implementation file.

### How it works

1. Every interactive element in `index.html` carries a `data-cap="<capability-id>"` attribute.
2. On boot, `capability-registry.js` scans all `[data-cap]` elements and sets them to
   disabled + `opacity: 0.35` + `cursor: not-allowed` + `title="Not yet implemented"`.
3. When an implementation module is loaded and passes its self-check, it calls:
   ```javascript
   import { capabilities } from '../capabilities/capability-registry.js';
   capabilities.ready('scene-renderer');
   ```
4. The registry immediately enables all `[data-cap="scene-renderer"]` elements in the DOM.
5. A status chip appears next to the button: `●` green = ready, `○` grey = placeholder.

### Capability IDs → Elements they unlock

| Capability ID | Unlocks |
|--------------|---------|
| `pcf-parse` | `#btn-viewer-open-pcf`, `#viewer-pcf-input` |
| `scene-renderer` | `[data-view]`, `#btn-fit-all`, `#viewer-canvas` interaction |
| `heatmap` | `#viewer-heatmap` |
| `labels` | `#viewer-labels-toggle` |
| `component-panel` | `#viewer-side-panel` click-to-inspect |
| `theme` | `#viewer-theme` |
| `glb-load` | `#btn-viewer-open-glb`, `#viewer-glb-input` |
| `glb-export` | `#btn-export-glb` |
| `dxf-import` | `#viewer-pcf-input` (extended to .dxf) |
| `dxf-export` | `#btn-export-dxf` |
| `debug-tab` | `#rtab-debug` (debug tab itself) |
| `support-symbols` | (visual feature, no dedicated button) |
| `css2d-labels` | `#viewer-labels-toggle` (already wired by `labels`) |

### Load Mock buttons

Each capability section in the toolbar has a companion **"🔬 Mock"** button:
- `data-cap-mock="<capability-id>"`
- Always enabled (so you can load mock even when capability is placeholder — it will show the placeholder warning + the expected outcome in the debug panel)
- When clicked: loads `mock-data.js` → runs the capability → displays actual vs expected outcome in `#mock-result-panel`

The mock result panel is a fixed overlay in the bottom-right corner of the viewport,
visible only when a mock is running. It shows:

```
┌─ Mock Verification ─────────────────────────────────────────┐
│  Capability: scene-renderer                                  │
│  Status: ✅ PASS  (3/3 assertions)                          │
│  ────────────────────────────────────────────────────────── │
│  ✅  Mesh count: expected 9, got 9                           │
│  ✅  Bounding box min Z: expected 0, got 0                   │
│  ✅  PIPE mesh visible: expected true, got true              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Mock Data Specification

The canonical mock is defined in `js/mock/mock-data.js`. It exports:

```javascript
export const MOCK_PCF_TEXT   // A valid PCF string — 10 components, known exact values
export const MOCK_DXF_TEXT   // A valid DXF string — 6 entities, known exact values
export const MOCK_EXPECTED   // Quantitative expected outcomes
```

### Expected outcomes (`MOCK_EXPECTED`)

```javascript
export const MOCK_EXPECTED = {
  pcf: {
    componentCount:   10,
    byType: {
      PIPE:            3,
      ELBOW:           2,
      TEE:             1,
      FLANGE:          1,
      VALVE:           1,
      SUPPORT:         1,
      'MESSAGE-CIRCLE': 1,
    },
    pipelineRefs:     ['TEST-LINE-A', 'TEST-LINE-B'],
    materials:        ['CS', 'SS'],
    boreMax:          323.85,
    boreMin:          168.27,
    supportKind:      'REST',       // SUPPORT-DIRECTION=DOWN → REST
    elbowHasCp:       true,         // at least one ELBOW has cp defined
    messageCircleText: 'NOTE-1',
    validationErrors:  0,
    validationWarns:   0,
  },
  dxf: {
    componentCount:   6,
    byType: {
      PIPE:            3,
      ELBOW:           1,
      FLANGE:          1,
      'MESSAGE-SQUARE': 1,
    },
  },
  scene: {
    meshCountMin:     8,   // after loadComponents — SUPPORT rendered as symbol (no mesh)
    boundingBoxNonZero: true,
    heatmapOD: {
      distinctColors: 2,   // two bore sizes → two distinct colours
    },
  },
};
```

### Assertion helper
Each Playwright test uses the helper:
```javascript
import { assertMock } from './helpers/assert-mock.js';
// assertMock(actual, expected, label) — logs PASS/FAIL, throws on mismatch
```

---

## 5. How to Implement a Phase — Step-by-Step Protocol

For **every phase**, the AI agent MUST follow these steps in order. Do not skip steps.

### Step A — Read the WI
Open `wi/WI-{filename}.md`. Read it completely before writing any code.
Note: the WI contains exact method signatures, behaviour specification, and test criteria.

### Step B — Implement the file
Replace the placeholder stub with the full implementation. Follow the WI exactly.
Do NOT modify any file outside the target file unless the WI explicitly instructs it.

### Step C — Register the capability
At the end of the implementation, add:
```javascript
import { capabilities } from '../capabilities/capability-registry.js';
capabilities.ready('<capability-id>');
```
(Import path varies by file location — adjust `../` depth accordingly.)

### Step D — Run the mock self-check
The implementation must include an inline self-check function triggered on import:

```javascript
// At the bottom of the file, after all exports:
if (typeof window !== 'undefined' && window.__GLB_PCF_DEV__) {
  import('../../js/mock/mock-data.js').then(({ MOCK_PCF_TEXT, MOCK_EXPECTED }) => {
    selfCheck(MOCK_PCF_TEXT, MOCK_EXPECTED).then(result => {
      if (result.pass) capabilities.ready('<capability-id>');
      else capabilities.fail('<capability-id>', result.failures);
    });
  });
}
```
The `selfCheck` function runs the module's own logic against the mock and returns
`{ pass: boolean, failures: string[] }`.

### Step E — Run Playwright test for this phase
```bash
cd C:\Code3\GLB-PCF-Editor
npx playwright test tests/phase{N}-{name}.test.js --headed
```

The test will:
1. Open the app at `http://localhost:3000`
2. Wait for the capability chip to turn green
3. Click the "🔬 Mock" button for this capability
4. Assert the mock result panel shows PASS
5. Take a full-page screenshot → saved to `tests/snapshots/phase{N}-{name}.png`
6. Assert no console errors

**The phase is ONLY complete when:**
- ✅ All Playwright assertions pass
- ✅ Screenshot saved to `tests/snapshots/`
- ✅ Capability chip is green in the screenshot
- ✅ Mock result panel shows "PASS (N/N assertions)" in the screenshot
- ✅ No red console errors visible

### Step F — Update capability status in `capabilities-status.json`
```json
{ "scene-renderer": "verified", "pcf-parse": "verified", ... }
```
This file is read by the CI pipeline to determine what is safe to ship.

---

## 6. Phase-by-Phase Implementation Plan

### Phase 1 — PCF Parse + Domain Registry
**Goal:** Parse mock PCF into `GenericComponent[]`.

| WI File | Capability ID | Mock Assertion |
|---------|--------------|----------------|
| `WI-piping-parser.md` | `pcf-parse` | `components.length === 10` |
| `WI-piping-domain.md` | `pcf-parse` | `byType.PIPE === 3` |

**Playwright test:** `tests/phase1-pcf-parse.test.js`
```
1. Open app
2. Click 🔬 Mock (pcf-parse section)
3. Assert mock result panel: "✅ PASS (5/5 assertions)"
4. Screenshot: tests/snapshots/phase1-pcf-parse.png
```

**Expected screenshot shows:**
- Mock result panel visible bottom-right
- 5 green checkmarks
- Debug tab: Summary section shows 10 components
- PIPE count: 3, ELBOW: 2, TEE: 1, etc.

---

### Phase 2 — Scene Renderer (basic geometry)
**Goal:** Three.js scene renders GenericComponent[] as basic shapes.

| WI File | Capability ID | Mock Assertion |
|---------|--------------|----------------|
| `WI-scene-renderer.md` | `scene-renderer` | `meshCount >= 8` |

**Playwright test:** `tests/phase2-scene-renderer.test.js`
```
1. Open app
2. Click 🔬 Mock (scene-renderer)
3. Assert: canvas has rendered content (pixel sample non-black)
4. Assert: mock panel shows ✅ PASS
5. Screenshot: tests/snapshots/phase2-scene-renderer.png
```

**Expected screenshot shows:**
- 3D canvas with pipe geometry visible
- ISO-NE isometric view
- Mock result panel: mesh count ≥ 8

---

### Phase 3 — High-Quality Geometry (Drafting Builder)
**Goal:** Elbows are curved tubes, tees are T-shapes, flanges are discs.

| WI File | Capability ID | Mock Assertion |
|---------|--------------|----------------|
| `WI-buildDraftingScene.md` | `scene-renderer` | `elbowIsTube === true` |
| `WI-piping-geometry-builder.md` | `scene-renderer` | (same capability) |

**Playwright test:** `tests/phase3-drafting-geometry.test.js`
```
1. Load mock → check renderer geometry types via page.evaluate()
2. Assert: at least one TubeGeometry in scene (ELBOW)
3. Assert: at least one CylinderGeometry in scene (PIPE)
4. Screenshot: tests/snapshots/phase3-drafting-geometry.png
```

**Expected screenshot shows:**
- Visually distinct elbows (curves), tees (branches), flanges (discs)
- Comparison note: better than Phase 2 screenshot

---

### Phase 4 — Support Symbols
**Goal:** SUPPORT component renders as directional arrow symbol.

| WI File | Capability ID | Mock Assertion |
|---------|--------------|----------------|
| `WI-piping-symbol-library.md` | `support-symbols` | `supportKind === 'REST'` |

**Playwright test:** `tests/phase4-support-symbols.test.js`
```
1. Load mock → assert support symbol visible in canvas
2. page.evaluate: check _symbolGroup children count === 1
3. Assert symbol userData.kind === 'REST' (DIRECTION=DOWN → REST)
4. Screenshot: tests/snapshots/phase4-support-symbols.png
```

**Expected screenshot shows:**
- Green downward arrow visible at support position
- Mock panel: kind=REST confirmed

---

### Phase 5 — Component Info Panel
**Goal:** Click mesh → domain-driven info panel renders in side panel.

| WI File | Capability ID | Mock Assertion |
|---------|--------------|----------------|
| `WI-component-panel.md` | `component-panel` | `panelSectionCount === 3` (Common + Geometry + Process) |
| `WI-piping-info-panel.md` | `component-panel` | `boreValue === '323.85 mm'` |

**Playwright test:** `tests/phase5-component-panel.test.js`
```
1. Load mock → click on a PIPE mesh in the canvas
2. Assert #viewer-side-panel is not empty
3. Assert panel contains text "323.85 mm"
4. Assert panel contains text "TEST-LINE-A"
5. Assert panel has 3 section headings
6. Screenshot: tests/snapshots/phase5-component-panel.png
```

**Expected screenshot shows:**
- Side panel open with "Common / Geometry / Process" sections
- Bore value highlighted

---

### Phase 6 — CSS2D Labels
**Goal:** MESSAGE-CIRCLE renders a floating label; SUPPORT shows name label.

| WI File | Capability ID | Mock Assertion |
|---------|--------------|----------------|
| `WI-piping-geometry-builder.md` (labels) | `css2d-labels` | `labelCount >= 2` |

**Playwright test:** `tests/phase6-css2d-labels.test.js`
```
1. Load mock with labels ON
2. Assert: text "NOTE-1" visible in DOM (CSS2DObject renders as DOM span)
3. Assert: text "SP-001" visible in DOM (support name)
4. Toggle labels OFF → assert text no longer visible
5. Screenshot: tests/snapshots/phase6-css2d-labels.png
```

**Expected screenshot shows:**
- "NOTE-1" floating label at message-circle position
- "SP-001" label near support symbol
- Labels checkbox checked

---

### Phase 7 — Heatmap
**Goal:** Heatmap select recolours meshes by field value.

| WI File | Capability ID | Mock Assertion |
|---------|--------------|----------------|
| `WI-heatmap.md` | `heatmap` | `distinctColorsOD === 2` |

**Playwright test:** `tests/phase7-heatmap.test.js`
```
1. Load mock → select heatmap "By OD"
2. page.evaluate: sample mesh colors → count distinct values
3. Assert: at least 2 distinct colour values (323.85mm vs 168.27mm)
4. Select "No heatmap" → assert colors reset to default grey
5. Screenshot: tests/snapshots/phase7-heatmap.png
```

**Expected screenshot shows:**
- Heatmap dropdown showing "By OD"
- Small-bore pipes noticeably different colour from large-bore pipes
- Mock panel: distinctColors = 2

---

### Phase 8 — Debug Tab
**Goal:** Debug tab shows correct diagnostics after mock load.

| WI File | Capability ID | Mock Assertion |
|---------|--------------|----------------|
| `WI-debug-tab.md` | `debug-tab` | `summaryTotal === 10`, `validationErrors === 0` |

**Playwright test:** `tests/phase8-debug-tab.test.js`
```
1. Load mock → switch to Debug tab
2. Assert: Summary section shows "Components: 10"
3. Assert: PIPE row shows count "3"
4. Assert: Validation section shows "✓ No issues found."
5. Assert: search "ELBOW" → filters to 2 rows
6. Screenshot: tests/snapshots/phase8-debug-tab.png
```

**Expected screenshot shows:**
- Debug tab active
- Summary section with component type table
- Validation section with green "No issues" message

---

### Phase 9 — GLB Export + Reload
**Goal:** Export scene as GLB; reload it; heatmap and click still work.

| WI File | Capability ID | Mock Assertion |
|---------|--------------|----------------|
| `WI-scene-renderer.md` (exportGLB) | `glb-export` | file downloaded |
| `WI-scene-renderer.md` (loadGLB) | `glb-load` | meshCount >= 8 after reload |

**Playwright test:** `tests/phase9-glb-export.test.js`
```
1. Load mock → click Export GLB
2. Assert: download event fires, filename ends with .glb
3. Reload the downloaded GLB
4. Assert: meshes visible again
5. Click a mesh → assert info panel renders
6. Screenshot: tests/snapshots/phase9-glb-export.png
```

---

### Phase 10 — DXF Import + Export
**Goal:** DXF file parses to components; export produces valid DXF text.

| WI File | Capability ID | Mock Assertion |
|---------|--------------|----------------|
| `WI-dxf-importer.md` | `dxf-import` | `dxfComponents.length === 6` |
| `WI-exportToDXF.md` | `dxf-export` | DXF text contains LINE, ARC, CIRCLE entities |

**Playwright test:** `tests/phase10-dxf.test.js`
```
1. Inject MOCK_DXF_TEXT → run parseDxf → assert 6 components
2. Load DXF mock in viewer → assert scene renders
3. Click Export DXF → assert download fires
4. Read downloaded text → assert contains "0\nSECTION"
5. Screenshot: tests/snapshots/phase10-dxf.png
```

---

## 7. Playwright Setup

```bash
npm init -y
npm install -D @playwright/test
npx playwright install chromium
```

Local server (required — `file://` blocks ES module imports):
```bash
npx serve . -p 3000
# Then in another terminal:
npx playwright test
```

`playwright.config.js` is at `tests/playwright.config.js`.

All tests set `window.__GLB_PCF_DEV__ = true` before page load so that self-checks run.

---

## 8. Mandatory Screenshot Convention

Every Playwright test MUST produce a screenshot with this naming:
```
tests/snapshots/phase{N}-{feature-slug}.png
```

The screenshot MUST show ALL of the following simultaneously:
1. The browser chrome (URL bar showing localhost:3000)
2. The app viewport at 1280×800
3. The mock result panel in the bottom-right corner showing **"PASS"**
4. The capability chip showing **green ●** for the tested capability
5. The feature itself actively in use (heatmap visible, panel open, geometry rendered, etc.)

A screenshot that shows "PASS" but the feature is not visually active is **not acceptable**.
A screenshot that shows the feature working but the mock panel is absent is **not acceptable**.

---

## 9. Capability Failure Protocol

If `capabilities.fail(id, reasons)` is called, the UI must:
1. Show a red `✗` chip next to the capability button
2. Log each failure reason to `appLogger` at ERROR level
3. The "🔬 Mock" button for that capability shows the failure reasons in the panel

This prevents silent regressions — if a later phase breaks an earlier capability,
the chip immediately turns red.

---

## 10. Coding Rules

1. **No build tool.** All imports use ES module syntax with exact paths. No Vite, no webpack.
2. **No TypeScript.** Plain JavaScript only. JSDoc for type hints.
3. **No framework in the renderer.** Three.js + vanilla DOM only. React is available in the
   importmap but is reserved for future UI phases (Release 2).
4. **Vendor files in `js/vendor/` are not to be modified** unless a WI explicitly instructs it.
   If a bug is found in a vendor file, document it and fix it in the domain layer.
5. **Import paths must be relative.** Never use bare specifiers except those in the importmap
   (`three`, `three/addons/`, `konva`, etc.).
6. **Every implemented function must handle null/undefined inputs without throwing.** Pipe
   components can have missing ep1/ep2 — never assume presence.
7. **All async functions must have try/catch** that logs to `appLogger` on failure.
8. **Never `console.log` in production paths.** Use `appLogger.info/warn/error` instead.
9. **Pixel-perfect is not the goal.** Correct geometry topology and correct data flow matter.
   Aesthetics are secondary to verifiable correctness.
10. **Capability.ready() is earned, not declared.** Call it only after the inline self-check
    passes. Never call it at the top of a file or unconditionally.

---

## 11. Self-Check Pattern (Template)

Copy this pattern into every implementation file:

```javascript
// ─── Self-check (runs only in dev mode) ───────────────────────────────────────
async function _selfCheck() {
  const { MOCK_PCF_TEXT, MOCK_EXPECTED } = await import('../../js/mock/mock-data.js');
  const failures = [];

  // ── Run the thing ──────────────────────────────────────────────────
  // (replace with actual call to this module's function)
  const result = parsePcf(MOCK_PCF_TEXT, { info:()=>{}, warn:()=>{}, error:()=>{}, count:()=>0 });

  // ── Assert quantitative outcomes ───────────────────────────────────
  if (result.length !== MOCK_EXPECTED.pcf.componentCount)
    failures.push(`componentCount: expected ${MOCK_EXPECTED.pcf.componentCount}, got ${result.length}`);

  const pipes = result.filter(c => c.type === 'PIPE');
  if (pipes.length !== MOCK_EXPECTED.pcf.byType.PIPE)
    failures.push(`PIPE count: expected ${MOCK_EXPECTED.pcf.byType.PIPE}, got ${pipes.length}`);

  // ... more assertions per WI test criteria ...

  return { pass: failures.length === 0, failures };
}

if (typeof window !== 'undefined' && window.__GLB_PCF_DEV__) {
  import('../../js/capabilities/capability-registry.js').then(({ capabilities }) => {
    _selfCheck().then(({ pass, failures }) => {
      if (pass) capabilities.ready('pcf-parse');
      else       capabilities.fail('pcf-parse', failures);
    });
  });
}
```

---

## 12. Adding a New Domain (Future)

To add `domains/interior/`:
1. Create `domains/interior/index.js` with the domain plugin shape (see §2 in plan)
2. Register it in `core/app.js`: `registerDomain(interiorDomain)`
3. Add a domain-select dropdown to the toolbar (not currently in index.html)
4. All existing tests continue to pass — the viewer core is unchanged

**Zero changes to viewer core files** (scene-renderer, heatmap, component-panel, debug-tab)
are required to add a new domain. This is the architectural invariant.

---

## 13. Quick Reference — File Status

Run this to see which files are still placeholders:
```bash
grep -r "PLACEHOLDER" . --include="*.js" -l
```

Run this to see which capabilities are verified:
```bash
cat capabilities-status.json
```
