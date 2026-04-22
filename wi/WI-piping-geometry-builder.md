# WI — Piping Geometry Builder

## File
`domains/piping/geometry-builder.js`

## Purpose
Dispatches each `GenericComponent` to the correct drafting mesh builder and CSS2D label
builder. Called by `domain.buildMesh()` and `domain.buildLabel()` in `domains/piping/index.js`.

---

## Exports
```javascript
export function buildMesh(comp: GenericComponent, theme: string): THREE.Object3D | null
export function buildLabel(comp: GenericComponent): CSS2DObject | null
```

---

## `buildMesh` Dispatch Table

```javascript
import {
  buildPipeDraft, buildBendDraft, buildTeeDraft,
  buildFlangeDraft, buildValveDraft, buildGenericDraft
} from '../../js/vendor/buildDraftingScene.js';

const MESH_DISPATCH = {
  'PIPE':                buildPipeDraft,
  'ELBOW':               buildBendDraft,
  'BEND':                buildBendDraft,
  'TEE':                 buildTeeDraft,
  'EQUAL-TEE':           buildTeeDraft,
  'REDUCING-TEE':        buildTeeDraft,
  'OLET':                buildTeeDraft,
  'WELDOLET':            buildTeeDraft,
  'SOCKOLET':            buildTeeDraft,
  'THREADOLET':          buildTeeDraft,
  'FLANGE':              buildFlangeDraft,
  'BLIND-FLANGE':        buildFlangeDraft,
  'VALVE':               buildValveDraft,
  'CHECK-VALVE':         buildValveDraft,
  'CONTROL-VALVE':       buildValveDraft,
  'SAFETY-VALVE':        buildValveDraft,
  'REDUCER':             buildGenericDraft,
  'CONCENTRIC-REDUCER':  buildGenericDraft,
  'ECCENTRIC-REDUCER':   buildGenericDraft,
  'CAP':                 buildGenericDraft,
  'COUPLING':            buildGenericDraft,
  'UNION':               buildGenericDraft,
  'CROSS':               buildGenericDraft,
  'GASKET':              buildGenericDraft,
  'STRAINER':            buildGenericDraft,
  'FILTER':              buildGenericDraft,
  'INSTRUMENT':          buildGenericDraft,
  'SUPPORT':             null,           // handled by buildSymbol
  'MESSAGE-CIRCLE':      null,           // label-only
  'MESSAGE-SQUARE':      null,           // label-only
};

export function buildMesh(comp, theme) {
  const builder = MESH_DISPATCH[comp.type];
  if (builder === undefined) return buildGenericDraft(comp, theme);  // unknown type
  if (builder === null)      return null;                             // intentionally no mesh
  return builder(comp, theme);
}
```

---

## `buildLabel` Dispatch Table

```javascript
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import {
  createMessageCircleLabel,
  createMessageSquareLabel,
  createSupportLabel,
} from '../../geometry/labels.js';

export function buildLabel(comp) {
  switch (comp.type) {
    case 'MESSAGE-CIRCLE':
      return comp.metadata.circleText
        ? createMessageCircleLabel(comp.metadata.circleText, comp.geometry.origin)
        : null;
    case 'MESSAGE-SQUARE':
      return comp.metadata.squareText
        ? createMessageSquareLabel(comp.metadata.squareText, comp.metadata.squarePos || comp.geometry.origin)
        : null;
    case 'SUPPORT': {
      const name = comp.attributes['<SUPPORT_NAME>'] || comp.attributes['SUPPORT_NAME'] || comp.attributes['SUPPORT-NAME'];
      return name ? createSupportLabel(name, comp.geometry.origin) : null;
    }
    default:
      return null;
  }
}
```

---

## Dependencies
```
../../js/vendor/buildDraftingScene.js
../../geometry/labels.js
three/addons/renderers/CSS2DRenderer.js
```

---

## Test Criteria
1. `buildMesh(pipeComp, 'NavisDark')` → returns a non-null THREE.Object3D
2. `buildMesh(supportComp, ...)` → returns null (SUPPORT handled by buildSymbol)
3. `buildMesh(messageCircleComp, ...)` → returns null
4. `buildMesh({ type: 'UNKNOWN_FITTING' }, ...)` → returns buildGenericDraft result (not null, not crash)
5. `buildLabel(messageCircleComp)` → returns CSS2DObject
6. `buildLabel(messageSquareComp)` → returns CSS2DObject
7. `buildLabel(supportComp)` with name attr → returns CSS2DObject
8. `buildLabel(pipeComp)` → returns null
