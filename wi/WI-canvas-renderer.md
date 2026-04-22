# WI — CanvasRenderer (Release 3)

## File
`js/renderer/canvas-renderer.js`

## Purpose
Konva-based 2D plan view renderer (top-down X-Y projection). Renders pipes as stroked
paths, elbows as arcs, flanges as rectangles. Synchronized selection with SceneRenderer.
This module is planned for Release 3 — do not implement until SceneRenderer (Release 1) is complete.

---

## Exports
```javascript
export class CanvasRenderer
```

---

## Constructor
```javascript
new CanvasRenderer(container: HTMLElement)
```
1. Create `new Konva.Stage({ container, width, height })`
2. Create two layers: `_bgLayer` (grid), `_compLayer` (components)
3. Store `_stage`, `_bgLayer`, `_compLayer`

---

## Public Methods

### `loadComponents(components, domain)`
1. `_compLayer.destroyChildren()`
2. For each component in `components`:
   - Project `ep1`, `ep2` from 3D (X,Y,Z) to 2D canvas (X,Z) — ignore Y (up-axis)
   - Draw geometry based on `comp.type`:
     - `PIPE`: `Konva.Line` from projected ep1 to ep2, stroke weight proportional to bore
     - `ELBOW`: `Konva.Arc` using cp projected to 2D
     - `FLANGE`: `Konva.Rect` at origin
     - `VALVE`: `Konva.Diamond` (rotated Rect) at midpoint
     - `SUPPORT`: `Konva.RegularPolygon` (triangle) at origin
     - others: `Konva.Circle` at origin
   - Attach shape metadata: `shape.setAttr('compId', comp.id)`
   - Add click handler → emit `'comp-selected'` on event-bus
3. `_compLayer.batchDraw()`

### `setHeatmap(field)`
Recolour all shapes based on `comp.attributes[field]` using a discrete colour scale.

### `syncSelection(compId)`
1. Reset all shapes to default stroke
2. Find shape with `compId` attribute → highlight with `stroke('#f59e0b')`, `strokeWidth(2)`

### `dispose()`
`_stage.destroy()`

---

## Dependencies
```
konva
../../core/event-bus.js  (emit)
```

---

## Test Criteria (Release 3)
1. `loadComponents(components, domain)` → 2D pipe lines visible in canvas
2. Click pipe in 2D canvas → `SceneRenderer.highlight()` called
3. Click mesh in 3D → `CanvasRenderer.syncSelection()` highlights same pipe in 2D
4. `setHeatmap('OD')` → 2D pipe colours change to match 3D heatmap
