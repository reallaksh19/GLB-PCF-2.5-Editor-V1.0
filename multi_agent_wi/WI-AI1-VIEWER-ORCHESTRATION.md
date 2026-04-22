# WI — AI-1 Viewer and Orchestration

## 1. Mission

Finish the current app shell so the existing parser + renderer + side panel + debug tab are actually wired end to end.

This is the first implementation branch that must merge after the orchestrator freezes contracts.

## 2. Why your scope is first

The repository already contains strong lower-level building blocks, but the user-facing shell is incomplete because:
- `js/tabs/viewer-tab.js` is a placeholder,
- `js/ui/toolbar.js` is a placeholder,
- `js/tabs/debug-tab.js` is a placeholder.

Without this shell, later agents would build advanced features on top of unstable boot/runtime flows.

## 3. Files you own

Primary:
- `js/tabs/viewer-tab.js`
- `js/ui/toolbar.js`
- `js/tabs/debug-tab.js`

Secondary, only if needed for full flow:
- `js/ui/component-panel.js`
- `core/app.js` for integration hooks approved by orchestrator

Do not implement route engine, HUD internals, Master DB, or macro compiler logic.

## 4. Functional goals

### A. Viewer lifecycle
- instantiate `SceneRenderer`
- support PCF and DXF load through active domain
- support GLB load path already present in renderer
- update status indicator during operations
- preserve global access for tests where needed

### B. Toolbar wiring
- file open buttons
- view preset buttons
- fit all
- heatmap selection
- label visibility toggle
- theme select
- export GLB and DXF actions

### C. Click-to-inspect
- pick component from scene
- fetch info panel sections from active domain
- render side panel
- highlight selected object

### D. Debug tab
- subscribe to `model-loaded`
- render summary, parse log, components table, validation panel
- support copy/export/refresh controls

### E. Capability gating
- mark capabilities ready only after real wiring succeeds

## 5. Hard constraints

- Do not rewrite the whole app shell
- Do not add a bundler/framework
- Keep static-hosting compatibility
- Keep DOM IDs compatible with current `index.html`
- Do not make the debug tab domain-specific
- Every async operation must update status visibly

## 6. Suggested implementation outline

### 6.1 `initViewerTab`
Implement:
1. locate DOM nodes
2. create renderer
3. wire toolbar
4. wire file input listeners
5. load components through active domain
6. emit `model-loaded`
7. wire click/pick/highlight
8. observe resize
9. expose renderer for Playwright

### Critical snippet — model load flow
```js
async function loadTextModel(text, sourceName) {
  const domain = getActiveDomain();
  setStatus('active', `Loading ${sourceName}...`);

  const components = domain.parse(text, appLogger);
  _components = Array.isArray(components) ? components : [];

  _sceneRenderer.loadComponents(_components, domain);

  emit('model-loaded', {
    components: _components,
    domain,
    sourceName,
    loadedAt: Date.now(),
  });

  setStatus('idle', `${_components.length} components loaded`);
}
```

### 6.2 `toolbar.js`
Implement small focused wire functions, not one monolith.

### Critical snippet — safe toolbar binding
```js
function bindClick(id, handler) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('click', async (ev) => {
    try {
      await handler(ev);
    } catch (err) {
      appLogger.error('TOOLBAR_ACTION_FAILED', {
        id,
        message: String(err?.message || err),
      });
    }
  });
}
```

### 6.3 `debug-tab.js`
Design the tab as a renderer over a cached last model payload.

### Critical snippet — debug cache
```js
const debugState = {
  components: [],
  domain: null,
  lastLoadMeta: null,
};

subscribe('model-loaded', payload => {
  debugState.components = payload.components || [];
  debugState.domain = payload.domain || null;
  debugState.lastLoadMeta = payload;
  renderActiveDebugSection();
});
```

### 6.4 Component table search
```js
function filterComponents(rows, term) {
  const q = String(term || '').trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(row =>
    [row.id, row.type, row.origin, row.pipelineRef]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(q))
  );
}
```

## 7. Expected deliverables

1. Fully working viewer tab
2. Fully wired toolbar
3. Fully working debug tab
4. Clear logger events for load/open/error states
5. New or updated tests for:
   - import flow
   - click-to-inspect
   - debug refresh/copy/export basics

## 8. Debug visibility you must add

The debug tab must surface at minimum:
- component count by type
- active domain name
- parse/import source info
- validation errors/warnings count
- last 100 logger lines or a paged slice
- component list with searchable filter

## 9. Quantitative pass tests

### Functional
- PCF import success rate on canonical mock: **100%**
- DXF import success rate on canonical mock: **100%**
- GLB load button path triggers renderer load without uncaught error: **100%**
- Click-to-inspect selects a component and updates side panel: **100%**

### Debug tab
- Summary, log, components, validation sections render without exception: **100%**
- Copy JSON returns non-empty payload for loaded model: **100%**
- Export log downloads non-empty text when logs exist: **100%**

### Performance / stability
- Mock PCF load to first visible scene update: **<= 1200 ms**
- Debug tab refresh on mock dataset: **<= 250 ms**
- Boot-time console errors introduced by your branch: **0**
- Status-dot stale/error state after successful import: **0 occurrences**

## 10. Suggested new tests

- `tests/phase11-viewer-shell.test.js`
  - imports PCF
  - checks status text
  - checks component table non-empty
  - clicks scene/canvas surrogate if pick path available
- `tests/phase11-debug-tab.test.js`
  - switches sections
  - searches components
  - copies json
  - exports log

## 11. Handoff notes for downstream agents

You must expose stable hooks for:
- AI-2 route command integration into viewer lifecycle
- AI-3 HUD overlay mount point
- AI-4 debug visibility for resolver results
- AI-5 command history export visibility

Do not hardcode future HUD or macro behavior here. Only provide clean hooks.


## 3A. Merge-governance rules you must follow

### Contract dependency
Do not start deep implementation until the orchestrator freezes:
- event names for viewer load / pick / selection / debug refresh,
- app-shell integration hooks,
- debug payload schema,
- capability-gating flags.

Your PR must declare the contract revision consumed.

### Protected file ownership
You are the primary owner for these high-conflict files during your wave:
- `js/tabs/viewer-tab.js`
- `js/ui/toolbar.js`
- `js/tabs/debug-tab.js`

No other agent may edit them without an orchestrator-approved ownership window.
You must also avoid broad rewrites in `core/app.js`; ask the orchestrator for any required cross-cutting change.

### No blanket conflict resolution
If a conflict occurs in viewer/toolbar/debug files, you must perform a semantic/manual merge and document:
- what behavior existed before,
- what behavior is preserved,
- what changed.

## 7A. Critical markers for your branch

Before you mark your branch ready, verify all of these remain true:
- model load still emits `model-loaded`
- toolbar buttons still invoke real handlers, not placeholders
- pick/highlight still updates side panel
- debug tab still renders active runtime data instead of stubs
- status indicator transitions `active -> idle` correctly on success
- capability gates do not expose dead UI paths

## 9A. Required evidence artifacts

Attach these to your handoff:
1. touched-file list
2. before/after behavior note for each owned file
3. pass log for viewer-shell and debug tests
4. smoke evidence for:
   - PCF load
   - DXF load
   - toolbar interaction
   - pick/highlight
   - debug tab refresh
5. explicit statement that no placeholder panels remain in active shell paths
