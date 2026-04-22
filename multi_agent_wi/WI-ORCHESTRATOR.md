# WI — Orchestrator

## 1. Role

You are the integration owner for the GLB-PCF-Editor multi-agent program.

Your job is not to implement every feature directly. Your job is to:
- freeze contracts,
- assign file ownership,
- validate boundaries,
- merge in the correct order,
- prevent duplicate business logic,
- run the full acceptance matrix,
- produce the final consolidated patch + handoff notes.

## 2. Current source-grounded status

The repo already contains:
- working infrastructure around domain registration, logging, capability gating, and phase-style tests,
- strong lower-level modules for geometry helpers, labels, symbols, and mock data,
- placeholder orchestration in:
  - `js/tabs/viewer-tab.js`
  - `js/ui/toolbar.js`
  - `js/tabs/debug-tab.js`

The requested new scope (HUD, intelligent data, Master DB, macro system, vertical drop/rise authoring) is **not** in source today and must be added as a new editor layer.

## 3. Your owned files

You may create or modify:
- `wi/` handoff artifacts
- `core/app.js`
- `core/state.js`
- `core/event-bus.js` only for non-breaking additive extensions
- shared interface/contract files introduced for integration
- final integration tests under `tests/`
- final release notes / migration docs

You must **not** become the primary implementer for:
- route geometry internals,
- HUD behavior internals,
- resolver internals,
- macro compiler internals,
unless a target agent failed and the project would otherwise stall.

## 4. Mandatory responsibilities

### A. Freeze interface contracts before deep implementation
You must create or approve these contracts before agents start merging:
- `editor/command-types.js`
- `editor/route-contract.js`
- `hud/hud-contract.js`
- `data/masterdb-contract.js`
- `macro/macro-ir-contract.js`

### B. Freeze file ownership
You must publish a single ownership map and reject violations.

### C. Gate merges by dependency order
You must not allow HUD work to merge before route commands are stable.
You must not allow macro execution to merge before command IR is stable.
You must not allow intelligent insertion to merge before Master DB lookup contract is stable.

### D. Maintain one canonical source of truth
For every component insertion and edit, the single source of truth must be:
1. canonical component model in memory,
2. command history / edit log,
3. derived scene representation.

Never let the scene become the source of truth.

## 5. File ownership map to enforce

### AI-1 — Viewer and orchestration
Owns:
- `js/tabs/viewer-tab.js`
- `js/ui/toolbar.js`
- `js/tabs/debug-tab.js`
- `js/ui/component-panel.js` (only if required for integration)
- light-touch capability wiring

### AI-2 — Geometry and route engine
Owns:
- new `editor/` modules
- `domains/piping/geometry-builder.js`
- `geometry/pipe-geometry.js` only if required for new route behaviors
- coordinate normalization helpers
- vertical/drop/rise authoring logic

### AI-3 — HUD and interaction
Owns:
- new `hud/` modules
- keyboard/mouse authoring flows
- overlay panels for line draw and intelligent insert

### AI-4 — Master DB and intelligence
Owns:
- new `data/` modules
- resolver logic
- editable grid / master popup
- intelligent component property lookup

### AI-5 — Macro and export
Owns:
- new `macro/` modules
- `js/glb/exportToDXF.js`
- `.pcfx` planning scaffold
- command IR execution bridge

### Orchestrator
Owns:
- contract files
- state stitching
- integration tests
- final acceptance and release note

## 6. Branch / PR model

Required branch names:
- `feat/ai1-viewer-orchestration`
- `feat/ai2-route-engine`
- `feat/ai3-hud`
- `feat/ai4-masterdb`
- `feat/ai5-macro-export`
- `feat/orch-integration`

Every agent branch must include:
- scope statement,
- touched files list,
- known risks,
- explicit statement of contracts consumed and emitted.

## 7. Integration sequence

### Stage 0 — contract baseline
Merge only:
- shared contracts
- store slices
- app shell integration points
- event names
- debug model schema

### Stage 1 — current shell becomes fully wired
Merge AI-1 first.
Reason: the repo already has parser and renderer building blocks, but orchestration is incomplete.

### Stage 2 — route authoring + normalization
Merge AI-2 after AI-1.
Reason: vertical drafting depends on consistent coordinates and stable renderer lifecycle.

### Stage 3 — HUD
Merge AI-3 after AI-2.
Reason: HUD must operate over real commands, not guess scene mutations.

### Stage 4 — Master DB + resolver
Merge AI-4 after AI-2 and preferably after AI-3’s overlay shell exists.
Reason: intelligent insert forms must bind to actual lookup results.

### Stage 5 — macro + export
Merge AI-5 last among implementation agents.
Reason: macro should compile to the finalized command IR and export the stabilized canonical model.

## 8. Critical contracts you must enforce

### 8.1 Command envelope
```js
export function createCommand(type, payload, meta = {}) {
  return {
    id: crypto.randomUUID(),
    type,
    payload,
    meta: {
      ts: Date.now(),
      source: meta.source || 'ui',
      ...meta,
    },
  };
}
```

### 8.2 Reducer-style execution boundary
```js
export function executeCommand(store, command) {
  const handler = commandHandlers[command.type];
  if (!handler) throw new Error(`Unknown command: ${command.type}`);
  const patch = handler(store.getState(), command);
  store.applyPatch(patch, command);
  return patch;
}
```

### 8.3 Debug event contract
```js
emit('debug:trace', {
  scope: 'hud',
  event: 'LINE_COMMIT',
  ok: true,
  commandType: 'ROUTE_SEGMENT_ADD',
  details: { lengthMm: 2400, axis: 'X' }
});
```

### 8.4 Resolver result contract
```js
{
  ok: true,
  source: 'master-db',
  matchKey: 'VALVE|GATE|150|6',
  resolved: {
    component: 'VALVE',
    subtype: 'GATE',
    size: '6',
    rating: '150',
    length: 292,
    weight: 84.5,
    unit: 'mm_kg'
  },
  alternatives: []
}
```

### 8.5 Macro IR contract
```js
{
  version: 1,
  commands: [
    { type: 'ROUTE_START', payload: { x: 0, y: 0, z: 0, spec: 'CS150' } },
    { type: 'ROUTE_SEGMENT_ADD', payload: { dx: 5000, dy: 0, dz: 0 } },
    { type: 'INSERT_COMPONENT', payload: { component: 'VALVE', rating: '150', size: '6' } }
  ]
}
```

## 9. Required orchestration code snippets

### 9.1 Shared store slice registration
```js
export const initialEditorState = {
  model: { components: [], routes: [] },
  selection: { ids: [] },
  hud: { mode: 'idle', draft: null },
  intelligence: { lastResolution: null },
  macro: { lastRun: null },
  diagnostics: { traces: [], metrics: {} },
};
```

### 9.2 Merge guard
```js
export function assertOwnedFiles(changedFiles, owner, ownershipMap) {
  const violations = changedFiles.filter(f => {
    const allowed = ownershipMap[owner] || [];
    return !allowed.some(prefix => f.startsWith(prefix));
  });
  if (violations.length) {
    throw new Error(`Ownership violation by ${owner}: ${violations.join(', ')}`);
  }
}
```

### 9.3 Acceptance gate runner
```js
export async function runAcceptance({ unit, playwright, integration }) {
  if (!unit.ok) throw new Error('Unit suite failed');
  if (!playwright.ok) throw new Error('Playwright suite failed');
  if (!integration.ok) throw new Error('Integration suite failed');
  return { ok: true };
}
```

## 10. Expected outcome

At completion:
- the current viewer shell is fully operational,
- vertical route authoring exists,
- HUD supports line draw and intelligent component insertion,
- Master DB resolves component dimensions/weights,
- macro DSL compiles to command IR and executes safely,
- export paths are fed from the canonical model,
- all new flows are visible in the debug surface,
- final implementation can be handed over as one coherent product instead of five disconnected patches.

## 11. Quantitative pass tests

### Contract / merge discipline
- Ownership violations allowed in final merge: **0**
- Unresolved duplicate logic blocks across agents: **0**
- Cross-agent contract breaking changes after freeze: **0**

### Integration quality
- Full repo tests passing: **100%**
- New agent-owned tests passing: **100%**
- Boot console errors: **0**
- Unhandled rejections during end-to-end flows: **0**

### Product-level integration
- Mock PCF import → viewer render → debug summary path: **passes in 1 click path**
- Draw horizontal segment then vertical rise then insert valve via HUD: **1 end-to-end scenario passes**
- Run macro that creates pipe + valve + elbow and export model: **1 end-to-end scenario passes**
- Debug tab must show:
  - command history count,
  - last resolver match,
  - macro run summary,
  - validation summary

## 12. Final handoff artifact required from you

You must deliver:
1. final merge report,
2. final ownership compliance report,
3. final known issues list,
4. final acceptance checklist,
5. recommended next-phase backlog.


## 6A. Non-negotiable merge governance

### Freeze contracts before parallel work
You must not permit parallel feature development until these are tagged and published:
- `editor/command-types.js`
- `editor/command-handlers.js` public handler signatures
- `editor/history.js` record schema
- `editor/route-contract.js`
- `hud/hud-contract.js`
- `data/masterdb-contract.js`
- `macro/macro-ir-contract.js`

Every agent PR must state the exact contract revision it consumes.

### Protected high-conflict files
The following files are merge-sensitive and may only be edited in single-owner windows:
- `js/tabs/viewer-tab.js`
- `js/ui/toolbar.js`
- `js/tabs/debug-tab.js`
- `core/app.js`
- `core/state.js`

Rules:
- no concurrent edits across agent branches unless the orchestrator explicitly opens a timed ownership window,
- no blanket `git checkout --ours/--theirs` on these files,
- all conflicts require semantic/manual reconciliation notes.

### Integration branch and merge waves
All merges must land first in `feat/orch-integration`, never directly in main.

Required sequence:
1. Wave 0 — contract freeze + state shell + debug schema
2. Wave 1 — AI-1 shell/orchestration
3. Wave 2 — AI-2 route engine + normalization
4. Wave 3 — AI-3 HUD
5. Wave 4 — AI-4 Master DB + resolver
6. Wave 5 — AI-5 macro + export
7. Wave 6 — hardening, regression, parity audit, release note

You must stop the wave if a previous wave has unresolved behavior regressions.

## 6B. Required CI gates

### Compile gates
- static import resolution: **100%**
- test suite pass: **100%**
- boot console errors: **0**
- unhandled promise rejections: **0**

### Behavior gates
You must add scenario checks for at minimum:
- viewer load and toolbar response
- pick/highlight to side-panel update
- route command dispatch updates canonical model
- vertical rise/drop authoring produces correct 3D metrics
- HUD last-length capture and Enter-to-commit
- intelligent insert displays resolver provenance and editable values
- macro dry-run then execute produces same command history shape as UI path
- DXF/GLB export runs from canonical model with no uncaught error

A PR that passes compile but fails any behavior gate is rejected.

### Contract-violation checks
You must add review and test guards for these anti-patterns:
- UI directly mutating canonical model without dispatcher
- HUD creating meshes directly
- export reading transient scene state instead of canonical model
- macro runtime bypassing command executor
- resolver returning silent fallback without provenance/warning fields

## 6C. Pre-merge evidence required from every agent

Every merge request must include these artifacts:
1. touched-file manifest
2. list of protected files touched, if any
3. pass/fail log excerpt
4. smoke evidence screenshots or equivalent test output
5. critical-marker checklist
6. known limitation list
7. contract revision consumed and emitted

Reject the merge if any artifact is missing.

## 6D. Critical-marker checklist before approval

You must review these markers before each merge:
- canonical model remains source of truth
- command history records every mutating action
- debug trace still renders command/result provenance
- vertical route segments preserve `dz` semantics
- HUD Enter key still commits through dispatcher
- resolver result still includes `ok/source/matchKey/resolved/alternatives`
- export path still consumes canonical state
- no placeholder/stub panels remain in active UI routes

## 6E. Final behavior parity audit before main

Before merging `feat/orch-integration` into main, produce a parity audit matrix with columns:
- feature area
- expected behavior
- runtime evidence
- pass/fail
- gap owner
- disposition

Minimum rows:
- file import shell
- scene pick/highlight
- side-panel component details
- debug tab visibility
- route authoring
- vertical rise/drop
- HUD line mode
- HUD intelligent insert
- master DB popup and grid edit
- resolver provenance and fallback
- macro compile/dry-run/execute
- export DXF/GLB from canonical model

No open `fail` row may remain at merge time unless it is explicitly deferred in release notes and removed from active UI by capability gating.
