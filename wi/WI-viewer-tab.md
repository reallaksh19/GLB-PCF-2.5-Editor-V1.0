# WI — Viewer Tab

## File
`js/tabs/viewer-tab.js`

## Purpose
Initialises the 2.5D viewer tab. Creates the SceneRenderer, wires the toolbar, handles
canvas click-to-inspect, and emits events to synchronise with the debug tab.

---

## Exports
```javascript
export function initViewerTab(): void
```

---

## Implementation

### Step 1 — Create renderer
```javascript
import { SceneRenderer } from '../renderer/scene-renderer.js';
const container = document.getElementById('viewer-canvas');
const renderer  = new SceneRenderer(container);
```

### Step 2 — State
```javascript
let _components = [];
const getComponents = () => _components;
const getDomain     = () => getActiveDomain();
```

### Step 3 — Init toolbar
```javascript
import { initToolbar } from '../ui/toolbar.js';
initToolbar(renderer, getComponents, getDomain);
```
The toolbar wires all file-open, view, heatmap, export buttons.
After `initToolbar` returns, the toolbar handles its own events internally.

### Step 4 — Store components from toolbar
The toolbar emits `'model-loaded'` on the event-bus after every successful parse.
Subscribe here:
```javascript
import { subscribe } from '../../core/event-bus.js';
subscribe('model-loaded', ({ components }) => { _components = components; });
```

### Step 5 — Canvas click → pick → info panel
```javascript
container.addEventListener('click', e => {
  const rect   = container.getBoundingClientRect();
  const ndcX   = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  const ndcY   = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  const hit    = renderer.pick(ndcX, ndcY);
  const panel  = document.getElementById('viewer-side-panel');
  if (hit) {
    const domain   = getActiveDomain();
    const sections = domain.getInfoPanelSections(hit.comp);
    renderPanel(sections, panel);
    renderer.highlight(hit.mesh);
  } else {
    clearPanel(panel);
    renderer.highlight(null);
  }
});
```

### Step 6 — ResizeObserver
```javascript
new ResizeObserver(() => renderer.onResize()).observe(container);
```

---

## Dependencies
```
../renderer/scene-renderer.js
../ui/toolbar.js
../ui/component-panel.js      (renderPanel, clearPanel)
../../core/domain-registry.js (getActiveDomain)
../../core/event-bus.js       (subscribe)
../../js/debug/logger.js      (appLogger)
```

---

## Test Criteria
1. `initViewerTab()` runs without errors on page load
2. Canvas is visible in the viewer tab panel
3. Open PCF → `_components` populated, debug tab receives `model-loaded` event
4. Click a mesh → side panel renders component sections
5. Click empty space → side panel shows "Click a component to inspect"
6. Resize window → renderer updates without distortion
