# WI — Heatmap

## File
`js/ui/heatmap.js`

## Purpose
Domain-agnostic heatmap colouring. Traverses a Three.js scene and applies colour per mesh
based on `mesh.userData` fields. Does not know about PCF or any specific domain.

---

## Exports
```javascript
export function applyHeatmap(scene, field, components): void
export function clearHeatmap(scene): void
export function buildHeatmapRange(components, field): { min: number, max: number }
```

---

## Behaviour

### `buildHeatmapRange(components, field)`
1. Extract `comp.attributes[field]` for every component where the value is numeric
2. Return `{ min: Math.min(...values), max: Math.max(...values) }`
3. If no numeric values found: return `{ min: 0, max: 1 }`

### `applyHeatmap(scene, field, components)`
1. Build a lookup Map: `compId → comp` from `components` array
2. Build range via `buildHeatmapRange(components, field)`
3. Special field handling:
   - `'OD'` or `'bore'`: use `comp.geometry.bore` (numeric mm)
   - `'material'`: discrete colouring — CS=#4a7fa5, SS=#7bc67e, CU=#d4a017, default=#888
   - Others: read `comp.attributes[field]` as float, normalise to 0–1 with range
4. Traverse `scene` using `scene.traverse(obj => { if (!obj.isMesh) return; ... })`
5. Get `comp` from `_compIndex` using `obj.userData.compId`
6. If no comp found: skip
7. Compute colour:
   - Numeric fields: `heatMapColor(normalised)` from `geometry/pipe-geometry.js`
     (blue=cold 0.0 → green → red=hot 1.0)
   - Material field: discrete colour string above
8. Apply: `obj.material.color.set(colour)`; ensure `obj.material.needsUpdate = true`

### `clearHeatmap(scene)`
Restore default material colour for all meshes:
- `NavisDark` default: `0xb8c4d2`
- `DrawLight` default: `0x2d3748`
- Apply `0xb8c4d2` as safe default (scene-renderer will re-apply theme if needed)

---

## Source patterns to reuse
- `heatMapColor(t)` is already implemented in `geometry/pipe-geometry.js` (import it)
- `colorForMaterial(matStr)` is already implemented in `geometry/pipe-geometry.js`

---

## Dependencies
```
geometry/pipe-geometry.js  (heatMapColor, colorForMaterial)
```

---

## Test Criteria
1. `applyHeatmap(scene, 'OD', components)` — small bore pipes blue, large bore pipes red
2. `applyHeatmap(scene, 'material', components)` — CS pipes one colour, SS another
3. `clearHeatmap(scene)` — all pipes revert to default grey
4. `buildHeatmapRange([...], 'T1')` — returns correct min/max from attributes
