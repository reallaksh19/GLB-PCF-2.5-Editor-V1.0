# WI — Toolbar

## File
`js/ui/toolbar.js`

## Purpose
Wires all viewer toolbar HTML elements to renderer actions and file-open workflows.
Called once during viewer tab init.

---

## Exports
```javascript
export function initToolbar(
  renderer:      SceneRenderer,
  getComponents: () => GenericComponent[],
  getDomain:     () => DomainPlugin
): void
```

---

## Element Wiring Specification

### File Open — PCF/DXF
```
#btn-viewer-open-pcf  click → #viewer-pcf-input.click()
#viewer-pcf-input     change → (file selected)
  1. Set status "Parsing…"
  2. file.text() → text string
  3. domain = getDomain()
  4. components = domain.parse(text, file.name, appLogger)
  5. renderer.loadComponents(components, domain)
  6. emit event-bus 'model-loaded' { components, domain, fileName: file.name }
  7. Set status "{components.length} components loaded"
  8. Store components for getComponents()
```

### File Open — GLB
```
#btn-viewer-open-glb  click → #viewer-glb-input.click()
#viewer-glb-input     change → (file selected)
  1. Set status "Loading GLB…"
  2. URL.createObjectURL(file) → url
  3. await renderer.loadGLB(url)
  4. URL.revokeObjectURL(url)
  5. Set status "GLB loaded"
```

### View Presets
```
[data-view]  click → renderer.setView(button.dataset.view)
  Presets: 'iso-ne' | 'iso-nw' | 'iso-se' | 'iso-sw' | 'plan' | 'front'
```

### Fit All
```
#btn-fit-all  click → renderer.fitAll()
```

### Heatmap
```
#viewer-heatmap  change → renderer.setHeatmap(select.value, getComponents())
  'none' → clearHeatmap
  others → applyHeatmap(field)
```

### Labels Toggle
```
#viewer-labels-toggle  change → renderer.setLabelsVisible(checkbox.checked)
```

### Theme Select
```
#viewer-theme  change → renderer.setTheme(select.value)
```

### Export GLB
```
#btn-export-glb  click → renderer.exportGLB()
```

### Export DXF
```
#btn-export-dxf  click → exportToDXF(getComponents())
  import from '../../js/glb/exportToDXF.js'
```

---

## Status Updates
- `#viewer-status` span: inline status text in toolbar
- `#status-text` span: status bar text at bottom
- `#status-dot` div: class `idle` (default) / `active` (during load) / `error` (on failure)

Pattern:
```javascript
function setStatus(msg, state = 'idle') {
  document.getElementById('viewer-status').textContent = msg;
  document.getElementById('status-text').textContent = msg;
  const dot = document.getElementById('status-dot');
  dot.className = 'status-dot ' + state;
}
```

Error handling: wrap all async operations in try/catch → `setStatus('Error: ' + err.message, 'error')`

---

## Dependencies
```
../renderer/scene-renderer.js   (SceneRenderer — passed in as renderer param)
../../core/event-bus.js         (emit)
../../js/glb/exportToDXF.js     (exportToDXF)
../../js/debug/logger.js        (appLogger)
```

---

## Test Criteria
1. Click "Open" button → file picker opens
2. Select `.pcf` file → components load, status shows count
3. Select `.dxf` file → routed to DXF parser, components load
4. Select `.glb` file → renderer.loadGLB called, GLB visible
5. ISO-NE button → camera snaps to NE isometric
6. PLAN button → top-down view
7. Heatmap select "By OD" → mesh colours change
8. Heatmap select "No heatmap" → colours reset
9. Labels checkbox uncheck → labels disappear
10. Theme select "DrawLight" → background becomes light
11. Export GLB button → file downloads
12. Export DXF button → .dxf file downloads
