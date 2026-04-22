# WI — DXF Importer

## File
`domains/piping/dxf-importer.js`

## Purpose
Parses a `.dxf` file text into `GenericComponent[]` for the piping domain using the
`dxf-parser` CDN library (available via importmap).

---

## Exports
```javascript
export function parseDxf(text: string, log: AppLogger): GenericComponent[]
```

---

## Implementation

### Library Import
```javascript
import DxfParser from 'dxf-parser';
```
`DxfParser` is available as a default export from `esm.sh/dxf-parser@1.4.1`.

### Top-level structure
```javascript
export function parseDxf(text, log) {
  const parser = new DxfParser();
  let dxf;
  try {
    dxf = parser.parseSync(text);
  } catch (e) {
    log.error('DXF_PARSE_FAIL', { message: String(e.message) });
    return [];
  }

  // Check units
  const insunits = dxf?.header?.['$INSUNITS'];
  if (insunits !== undefined && insunits !== 4) {
    log.warn('DXF_UNIT_WARN', { insunits, note: 'Expected 4 (mm). Coordinates may be wrong.' });
  }

  const entities = dxf?.entities || [];
  log.info('DXF_PARSE_START', { entityCount: entities.length });

  const components = [];
  let idCounter = 0;
  const nextId = () => 'dxf_' + (idCounter++);

  for (const ent of entities) {
    const comp = entityToComponent(ent, nextId, log);
    if (comp) components.push(comp);
  }

  log.info('DXF_PARSE_DONE', { componentCount: components.length });
  return components;
}
```

### `entityToComponent(ent, nextId, log)`

```javascript
function entityToComponent(ent, nextId, log) {
  const layer = ent.layer || '0';
  const color = ent.colorIndex || 7;  // 7 = white/default
  const attrs = {
    'PIPELINE-REFERENCE': layer,
    'MATERIAL': aciToMaterial(color),
  };

  switch (ent.type) {
    case 'LINE': {
      const ep1 = ptMM(ent.vertices[0] || ent.start);
      const ep2 = ptMM(ent.vertices[1] || ent.end);
      if (!ep1 || !ep2) { log.warn('DXF_ENTITY_SKIP', { type:'LINE', reason:'missing vertices' }); return null; }
      return makeComp(nextId(), 'PIPE', ep1, ep1, ep2, null, null, null, attrs);
    }
    case 'LWPOLYLINE': {
      const verts = (ent.vertices || []).map(v => ptMM(v));
      if (verts.length < 2) { log.warn('DXF_ENTITY_SKIP', { type:'LWPOLYLINE', reason:'< 2 vertices' }); return null; }
      return makeComp(nextId(), 'PIPE', verts[0], verts[0], verts[verts.length-1], null, null, null, attrs);
    }
    case 'ARC': {
      const cp   = ptMM(ent.center);
      const r    = (ent.radius || 0);
      const sa   = (ent.startAngle || 0) * Math.PI / 180;
      const ea   = (ent.endAngle  || 0) * Math.PI / 180;
      const ep1  = { x: cp.x + r * Math.cos(sa), y: cp.y, z: cp.z + r * Math.sin(sa) };
      const ep2  = { x: cp.x + r * Math.cos(ea), y: cp.y, z: cp.z + r * Math.sin(ea) };
      return makeComp(nextId(), 'ELBOW', cp, ep1, ep2, cp, null, r * 2, attrs);
    }
    case 'CIRCLE': {
      const centre = ptMM(ent.center);
      return makeComp(nextId(), 'FLANGE', centre, null, null, null, null, (ent.radius || 0) * 2, attrs);
    }
    case 'INSERT': {
      const blockName = (ent.name || '').toUpperCase();
      const type = blockName.includes('VALVE')   ? 'VALVE'
                 : blockName.includes('SUPPORT') ? 'SUPPORT'
                 : blockName.includes('TEE')     ? 'TEE'
                 : 'FITTING';
      const origin = ptMM(ent.position);
      return makeComp(nextId(), type, origin, null, null, null, null, null, attrs);
    }
    case 'TEXT':
    case 'MTEXT': {
      const text = ent.text || ent.string || '';
      const pos  = ptMM(ent.position || ent.insertionPoint);
      const comp = makeComp(nextId(), 'MESSAGE-SQUARE', pos, null, null, null, null, null, attrs);
      comp.metadata.squareText = text;
      comp.metadata.squarePos  = pos;
      return comp;
    }
    case 'POINT': {
      return makeComp(nextId(), 'FITTING', ptMM(ent.position), null, null, null, null, null, attrs);
    }
    default: {
      log.warn('DXF_ENTITY_SKIP', { type: ent.type, reason: 'unsupported entity type' });
      return null;
    }
  }
}
```

### Helpers

```javascript
// Convert DXF vertex/point object to { x, y, z } in mm
function ptMM(pt) {
  if (!pt) return null;
  return { x: pt.x || 0, y: pt.y || 0, z: pt.z || 0 };
}

// ACI colour index → material string
function aciToMaterial(aci) {
  if (aci === 1) return 'CS';   // red  → Carbon Steel
  if (aci === 3) return 'SS';   // green → Stainless Steel
  if (aci === 5) return 'CU';   // blue → Copper
  return 'UNKNOWN';
}

// Build a minimal GenericComponent
function makeComp(id, type, origin, ep1, ep2, cp, bp, bore, attrs) {
  return {
    id,
    type,
    label: type + ' ' + id,
    geometry: { origin: origin || { x:0,y:0,z:0 }, ep1, ep2, cp, bp, bore, size: null },
    attributes: attrs,
    metadata: { source: {}, squareText: null, squarePos: null, circleText: null, circleCoord: null, warnings: [] },
  };
}
```

---

## Dependencies
```
dxf-parser  (importmap → esm.sh/dxf-parser@1.4.1)
```

---

## Test Criteria
1. Parse DXF with LINE entities → PIPE components with correct ep1/ep2
2. Parse DXF with ARC entities → ELBOW components with cp populated
3. Parse DXF with CIRCLE entities → FLANGE components with bore = radius×2
4. Parse DXF with INSERT 'VALVE_DN50' → VALVE component
5. Parse DXF with TEXT entity → MESSAGE-SQUARE component with squareText
6. Unsupported entity type → skipped with DXF_ENTITY_SKIP log warning
7. $INSUNITS ≠ 4 → DXF_UNIT_WARN logged
8. Invalid DXF text → DXF_PARSE_FAIL logged, returns []
9. Layer name maps to `attributes['PIPELINE-REFERENCE']`
