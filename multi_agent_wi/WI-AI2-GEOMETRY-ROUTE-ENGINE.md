# WI — AI-2 Geometry and Route Engine

## 1. Mission

Add the editor-grade authoring layer that the current repo lacks:
- route command system,
- coordinate normalization,
- vertical drop/rise authoring,
- canonical route model,
- geometry regeneration from command/model state.

You are the backbone for all later HUD and macro work.

## 2. Why your scope matters

The current app can review geometry, but it is not sufficient for authoring robust rise/drop operations because:
- there is no command-based route system,
- there is no authoritative edit model separate from scene objects,
- coordinate consistency between meshes and overlays needs normalization.

## 3. Files you own

Primary new files:
- `editor/command-types.js`
- `editor/command-handlers.js`
- `editor/command-executor.js`
- `editor/history.js`
- `editor/route-engine.js`
- `editor/coordinate-normalizer.js`
- `editor/route-metrics.js`

Existing files you may update:
- `domains/piping/geometry-builder.js`
- `geometry/pipe-geometry.js`
- `core/state.js` only through orchestrator-approved slice additions

Do not own HUD widgets, resolver database logic, or macro DSL parsing.

## 4. Required target model

You must introduce a canonical in-memory route representation.

### Minimum shape
```js
{
  routes: [
    {
      id: 'R-1',
      nodes: [
        { id: 'N1', x: 0, y: 0, z: 0 },
        { id: 'N2', x: 5000, y: 0, z: 0 },
        { id: 'N3', x: 5000, y: 0, z: 2500 }
      ],
      segments: [
        { id: 'S1', from: 'N1', to: 'N2', kind: 'PIPE' },
        { id: 'S2', from: 'N2', to: 'N3', kind: 'PIPE', orientation: 'VERTICAL' }
      ],
      spec: { size: '6', rating: '150', material: 'CS' }
    }
  ]
}
```

## 5. Core responsibilities

### A. Coordinate normalization
Normalize imported and authored coordinates into one consistent space for:
- mesh generation,
- labels,
- symbols,
- picking,
- future export.

### B. Command-driven editing
All route edits must happen through commands, not ad hoc mesh mutations.

### C. Vertical authoring support
Support:
- rise,
- drop,
- vertical continuation,
- branch from a vertical node,
- correct route metrics for 3D length.

### D. Geometry regeneration
Scene geometry must be derived from canonical route/model state.

## 6. Critical commands to implement

- `ROUTE_START`
- `ROUTE_SEGMENT_ADD`
- `ROUTE_SEGMENT_EDIT`
- `ROUTE_NODE_MOVE`
- `ROUTE_SPLIT_SEGMENT`
- `ROUTE_DELETE`
- `INSERT_COMPONENT`
- `DELETE_COMPONENT`

### Critical snippet — command type registry
```js
export const CommandTypes = Object.freeze({
  ROUTE_START: 'ROUTE_START',
  ROUTE_SEGMENT_ADD: 'ROUTE_SEGMENT_ADD',
  ROUTE_SEGMENT_EDIT: 'ROUTE_SEGMENT_EDIT',
  ROUTE_NODE_MOVE: 'ROUTE_NODE_MOVE',
  ROUTE_SPLIT_SEGMENT: 'ROUTE_SPLIT_SEGMENT',
  ROUTE_DELETE: 'ROUTE_DELETE',
  INSERT_COMPONENT: 'INSERT_COMPONENT',
  DELETE_COMPONENT: 'DELETE_COMPONENT',
});
```

### Critical snippet — segment add with vertical support
```js
function addRouteSegment(state, command) {
  const { routeId, dx = 0, dy = 0, dz = 0 } = command.payload;
  const route = findRoute(state, routeId);
  const lastNode = route.nodes[route.nodes.length - 1];

  const nextNode = {
    id: crypto.randomUUID(),
    x: lastNode.x + dx,
    y: lastNode.y + dy,
    z: lastNode.z + dz,
  };

  const orientation =
    dz !== 0 && dx === 0 && dy === 0 ? 'VERTICAL' :
    dz === 0 ? 'HORIZONTAL' :
    'SPATIAL';

  return appendNodeAndSegment(route, nextNode, { kind: 'PIPE', orientation });
}
```

### Critical snippet — length metrics
```js
export function segmentLength3D(seg, nodeIndex) {
  const a = nodeIndex[seg.from];
  const b = nodeIndex[seg.to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}
```

## 7. Geometry regeneration strategy

Do not directly mutate the scene from UI gestures.
Do:
1. update canonical model through commands,
2. derive component/route geometry,
3. ask renderer/domain builder to rebuild affected slices.

### Critical snippet — derived rebuild
```js
export function rebuildDraftingModel(editorState, domain) {
  const derivedComponents = routeModelToComponents(editorState.model.routes);
  return domain.buildGeometry(derivedComponents, {
    labels: true,
    symbols: true,
    source: 'route-engine',
  });
}
```

## 8. Vertical-axis requirements

You must handle:
- pure vertical segment insertion
- mixed orthogonal + vertical route chains
- branch node created on a vertical riser
- rise/drop reflected in labels and debug metrics
- fit-all camera still includes elevated points

## 9. Quantitative pass tests

### Geometry correctness
- 3D length error per segment vs expected math: **<= 1 mm**
- Vertical segment orientation classification accuracy in fixture set: **100%**
- Route rebuild after node move preserves connectivity in fixture set: **100%**
- Imported + authored coordinate normalization mismatch on shared test points: **<= 1 mm**

### Stability
- 100-command edit replay success rate: **100%**
- Undo/redo parity on 50-command fixture: **100%** if history is included in your branch
- Geometry rebuild after single edit on 200-segment synthetic case: **<= 300 ms**
- No NaN coordinates emitted in route/scene data: **0 allowed**

### Visual/drafting
- Fit-all includes highest-Z node after vertical rise: **100%**
- Labels/symbol anchors align to normalized geometry fixture: **>= 99% cases**
- Branch insertion onto vertical route fixture produces exactly one valid branch node: **100%**

## 10. Suggested tests

- `tests/phase12-route-engine.test.js`
- `tests/phase12-vertical-routing.test.js`
- `tests/phase12-coordinate-normalization.test.js`

## 11. Expected outcome

After your branch merges:
- the app has a true authoring backbone,
- vertical drop/rise is mathematically supported,
- future HUD and macro work can target stable commands instead of unstable scene edits,
- export can later read from canonical route state.

## 12. Handoff requirements for downstream agents

You must expose:
- route selection / active route APIs for HUD
- deterministic command execution interface for macro
- route metrics and normalized coordinates for debug and export
- stable insertion hook for intelligent component placement
