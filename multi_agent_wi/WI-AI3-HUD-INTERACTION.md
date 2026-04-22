# WI — AI-3 HUD and Interaction

## 1. Mission

Create the HUD system that becomes a product differentiator:
- line drawing assist,
- editable last-length box,
- Enter-to-commit drafting,
- intelligent insertion overlays for valve/flange/fittings,
- keyboard-centric drafting flow.

Your HUD must operate on top of the route engine, not bypass it.

## 2. Scope boundaries

You own interaction and overlay orchestration.
You do not own:
- geometric truth,
- command semantics,
- master DB internals,
- macro compiler internals.

You consume those systems.

## 3. Files you own

New:
- `hud/hud-orchestrator.js`
- `hud/hud-state.js`
- `hud/hud-overlay.js`
- `hud/hud-line-draw.js`
- `hud/hud-component-insert.js`
- `hud/hud-keyboard.js`
- `hud/hud-format.js`

Existing:
- minimal touchpoints in `js/tabs/viewer-tab.js` or `index.html` only if approved by orchestrator

## 4. Required HUD behaviors

### A. During line draw
When the user starts from a point and moves the cursor:
- show current axis and dynamic distance
- show previous segment length
- allow length field edit
- pressing Enter commits exactly that length via route command
- allow axis lock / orthogonal lock
- show Z mode if rise/drop is active

### B. During valve/flange insertion
If size/rating/spec are known or inferable:
- HUD must show type dropdown
- length field
- weight field
- provenance label (resolved/manual/default)
- all values editable before commit

### C. During fitting insertion
For bend/tee/reducer:
- show insertion context
- show branch/main size if applicable
- show derived length/center-to-face if available
- let user override with warning if override departs from DB

### D. During macro execution
HUD should optionally show:
- running command count
- current command preview
- errors/warnings summary
- cancel / dry-run / confirm

## 5. Product differentiators you must include

Beyond minimum request, add:
- smart axis badge (`X`, `Y`, `Z`, `Ortho`, `Rise`, `Drop`)
- provenance color chip (`DB`, `Manual`, `Fallback`)
- last command summary
- pending component preview mini-card
- invalid-input inline reasons
- keyboard shortcut hint row
- optional “repeat last insert” flow
- command preview before commit
- branch context badge (`INLINE`, `BRANCH`, `RISER`)

## 6. Critical implementation principle

HUD must be a thin view/controller over command and intelligence layers.

Do **not**:
- directly create meshes,
- directly mutate components,
- directly calculate canonical dimensions if resolver can do it.

Do:
- collect user intent,
- resolve via APIs,
- emit commands,
- reflect debug/provenance.

## 7. Core snippets

### 7.1 HUD state
```js
export const initialHudState = {
  mode: 'idle',
  axisLock: null,
  draft: null,
  lastLengthMm: null,
  insertContext: null,
  preview: null,
  provenance: null,
  errors: [],
};
```

### 7.2 Enter-to-draw flow
```js
function commitLineFromHud(hud, editor) {
  const len = Number(hud.draft?.lengthMm);
  if (!Number.isFinite(len) || len <= 0) {
    return setHudError('Length must be > 0');
  }

  const delta = axisLockedDelta(hud.axisLock, len, hud.draft?.sign || 1);

  return executeCommand(editor, createCommand('ROUTE_SEGMENT_ADD', {
    routeId: hud.draft.routeId,
    dx: delta.dx,
    dy: delta.dy,
    dz: delta.dz,
  }, { source: 'hud-enter' }));
}
```

### 7.3 Intelligent insert preview
```js
async function refreshInsertPreview(ctx, resolver) {
  const res = await resolver.resolveComponent({
    component: ctx.component,
    subtype: ctx.subtype,
    size: ctx.size,
    rating: ctx.rating,
    schedule: ctx.schedule,
  });

  return {
    preview: res?.resolved || null,
    provenance: res?.source || 'manual',
    alternatives: res?.alternatives || [],
  };
}
```

### 7.4 Provenance label format
```js
export function formatProvenance(source) {
  switch (source) {
    case 'master-db': return 'DB';
    case 'manual': return 'Manual';
    case 'fallback': return 'Fallback';
    default: return 'Unknown';
  }
}
```

## 8. UX constraints

- HUD must never block the canvas irrecoverably
- Esc cancels current draft
- Enter commits current draft
- Tab cycles editable fields
- invalid state must be visible before commit
- numeric inputs must support engineering units display without corrupting canonical mm storage
- HUD must remain usable in dark and light theme

## 9. Quantitative pass tests

### Draw assist
- Enter-to-draw creates requested segment length with error **<= 1 mm**
- Last-length display updates after commit in **100%** of fixture scenarios
- Axis-locked draw produces non-axis drift: **0 mm**
- Esc cancel leaves canonical model unchanged in **100%** of cancel tests

### Interaction quality
- HUD reaction to pointer move on mock scene: **<= 50 ms median update latency**
- Keypress-to-command dispatch on Enter: **<= 100 ms p95**
- Invalid length commit prevention accuracy: **100%**
- Repeat-last-insert carries prior values correctly: **>= 95%** of fixture runs

### Intelligent insert
- Resolved valve/flange preview appears when lookup available: **100%**
- Editable overrides persist to committed command: **100%**
- Provenance chip matches actual source: **100%**
- Missing lookup state falls back gracefully without crash: **100%**

## 10. Suggested tests

- `tests/phase13-hud-line-draw.test.js`
- `tests/phase13-hud-insert.test.js`
- `tests/phase13-hud-keyboard.test.js`

## 11. Expected outcome

After your branch merges:
- the app feels like an assisted drafting system instead of only a viewer,
- users can draw by numeric intent rather than mouse approximation,
- intelligent component insertion is visible and auditable,
- HUD becomes a core differentiator for EP2-style workflows.

## 12. Handoff requirements for downstream agents

Expose:
- clear resolver API consumption points for AI-4
- stable command payload format for AI-5 macro playback
- debug traces for every HUD commit/cancel/error


## 3A. Merge-governance rules you must follow

### Contract dependency
Do not implement final HUD behavior until these are frozen:
- route command API
- HUD contract/state schema
- resolver query/response shape
- debug trace schema for HUD events

### Protected file handling
You do not own shell or state-core protected files. Avoid edits to:
- `js/tabs/viewer-tab.js`
- `js/ui/toolbar.js`
- `js/tabs/debug-tab.js`
- `core/app.js`
- `core/state.js`
except through orchestrator-approved adapter points.

### Dispatcher-only rule
HUD must not directly:
- create meshes,
- mutate canonical model,
- patch export state.

HUD may only collect intent, request resolution, preview safely, and dispatch commands.

## 6A. Critical markers for your branch

Before handoff, verify:
- last-length field reflects real previous committed segment length
- Enter key commits through dispatcher
- cancel/escape clears draft state cleanly
- intelligent insert overlay shows source/provenance for resolved values
- editable values remain user-overridable before commit
- HUD debug trace remains visible in debug/logger surfaces
- hidden/inactive HUD modes do not leak stub UI into active routes

## 9A. Required evidence artifacts

Attach:
1. touched-file list
2. HUD state contract revision used
3. pass log for HUD scenarios
4. smoke evidence for:
   - line draw with typed length
   - Enter-to-commit
   - rise/drop assist
   - valve insert overlay
   - flange insert overlay
   - cancel/error handling
5. explicit statement that HUD does not directly mutate scene or canonical model
