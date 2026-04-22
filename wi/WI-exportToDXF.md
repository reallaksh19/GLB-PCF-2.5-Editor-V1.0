# WI — exportToDXF

## File
`js/glb/exportToDXF.js`

## Purpose
Domain-agnostic DXF R12 text exporter. Converts `GenericComponent[]` to a plain ASCII DXF
string and triggers a browser file download. No CDN library required.

---

## Exports
```javascript
export function exportToDXF(components: GenericComponent[], fileName?: string): void
```
`fileName` defaults to `'export.dxf'`.

---

## DXF R12 Generation

### File structure
```
SECTION / HEADER
  $ACADVER = AC1009
  $INSUNITS = 4  (mm)
ENDSEC
SECTION / TABLES
  TABLE / LAYER
    one LAYER entry per unique PIPELINE-REFERENCE value + layer '0' + layer 'MISC'
  ENDTAB
ENDTBL
ENDSEC
SECTION / BLOCKS
  (empty — required for R12 validity)
ENDSEC
SECTION / ENTITIES
  ... one or more entities per component (see mapping)
ENDSEC
EOF
```

### DXF group code helpers
```javascript
function grp(code, value) { return `${code}\n${value}\n`; }
function pt3d(x, y, z)    { return grp(10, x.toFixed(6)) + grp(20, y.toFixed(6)) + grp(30, z.toFixed(6)); }
function pt3dEnd(x, y, z) { return grp(11, x.toFixed(6)) + grp(21, y.toFixed(6)) + grp(31, z.toFixed(6)); }
```

### Layer collection
```javascript
const layers = new Set(['0', 'MISC']);
components.forEach(c => {
  const lr = c.attributes?.['PIPELINE-REFERENCE'];
  if (lr) layers.add(lr);
});
```

### Entity mapping per `comp.type`

**PIPE** (requires ep1 + ep2):
```
0\nLINE\n
8\n{layer}\n
{pt3d(ep1.x, ep1.y, ep1.z)}
{pt3dEnd(ep2.x, ep2.y, ep2.z)}
```

**ELBOW/BEND** (with cp: ARC; without: LINE fallback):
```
// ARC:
0\nARC\n8\n{layer}\n
{pt3d(cp.x, cp.y, cp.z)}   ← centre
40\n{radius.toFixed(6)}\n   ← bore/2
50\n{startAngleDeg.toFixed(6)}\n
51\n{endAngleDeg.toFixed(6)}\n

// Compute angles:
startAngle = Math.atan2(ep1.z - cp.z, ep1.x - cp.x) * 180/Math.PI
endAngle   = Math.atan2(ep2.z - cp.z, ep2.x - cp.x) * 180/Math.PI
radius     = comp.geometry.bore / 2 (or distance from cp to ep1)
```

**FLANGE/BLIND-FLANGE**:
```
0\nCIRCLE\n8\n{layer}\n
{pt3d(origin.x, origin.y, origin.z)}
40\n{(bore * 0.9).toFixed(6)}\n
```

**VALVE** (INSERT with VALVE block):
```
0\nINSERT\n2\nVALVE\n8\n{layer}\n
{pt3d(origin.x, origin.y, origin.z)}
41\n1.0\n42\n1.0\n50\n0.0\n
```
Pre-define a VALVE block in the BLOCKS section as a simple 2-line cross: (+r,0) to (-r,0) and (0,+r) to (0,-r) where r=50mm.

**TEE** (two LINEs):
```
LINE: ep1 → ep2  (run)
LINE: midpoint(ep1,ep2) → bp  (branch, if bp exists)
```

**SUPPORT**:
```
0\nPOINT\n8\nSUPPORTS\n{pt3d(origin)}\n
0\nTEXT\n8\nSUPPORTS\n
{pt3d(origin.x, origin.y + 50, origin.z)}
40\n25.0\n
1\n{supportName}\n
```
Where `supportName = comp.attributes['<SUPPORT_NAME>'] || 'SUPPORT'`.

**MESSAGE-SQUARE**:
```
0\nMTEXT\n8\nANNOTATION\n
{pt3d(squarePos or origin)}
40\n25.0\n
1\n{squareText}\n
```

**MESSAGE-CIRCLE**:
```
0\nCIRCLE\n8\nANNOTATION\n{pt3d(origin)}\n40\n50.0\n
0\nTEXT\n8\nANNOTATION\n{pt3d(origin)}\n40\n20.0\n1\n{circleText}\n
```

**Others** (unknown types):
```
0\nPOINT\n8\nMISC\n{pt3d(origin)}\n
```

---

## Download Trigger
```javascript
const blob = new Blob([dxfText], { type: 'text/plain' });
const url  = URL.createObjectURL(blob);
const a    = Object.assign(document.createElement('a'), { href: url, download: fileName });
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
```

---

## Full Function Skeleton
```javascript
export function exportToDXF(components, fileName = 'export.dxf') {
  const lines = [];
  const w = (...parts) => lines.push(...parts);  // write helper

  // Collect layers
  const layers = new Set(['0', 'MISC', 'SUPPORTS', 'ANNOTATION']);
  components.forEach(c => { const lr = c.attributes?.['PIPELINE-REFERENCE']; if (lr) layers.add(lr); });

  // HEADER
  w('0','SECTION','2','HEADER');
  w('9','$ACADVER','1','AC1009');
  w('9','$INSUNITS','70','4');
  w('0','ENDSEC');

  // TABLES
  w('0','SECTION','2','TABLES','0','TABLE','2','LAYER','70', String(layers.size));
  layers.forEach(name => { w('0','LAYER','2',name,'70','0','62','7','6','CONTINUOUS'); });
  w('0','ENDTAB','0','ENDSEC');

  // BLOCKS (VALVE block)
  w('0','SECTION','2','BLOCKS');
  w('0','BLOCK','8','0','2','VALVE','70','0');
  w('0','LINE','8','0', '10','-50','20','0','30','0', '11','50','21','0','31','0');
  w('0','LINE','8','0', '10','0','20','-50','30','0', '11','0','21','50','31','0');
  w('0','ENDBLK','0','ENDSEC');

  // ENTITIES
  w('0','SECTION','2','ENTITIES');
  components.forEach(comp => writeEntity(comp, lines));
  w('0','ENDSEC');
  w('0','EOF');

  const dxfText = lines.join('\n');
  const blob    = new Blob([dxfText], { type: 'text/plain' });
  const url     = URL.createObjectURL(blob);
  const a       = Object.assign(document.createElement('a'), { href: url, download: fileName });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

---

## Dependencies
```
(none — pure text generation)
```

---

## Test Criteria
1. `exportToDXF([...pipeComps], 'test.dxf')` → file downloads
2. DXF text opens in AutoCAD/FreeCAD/LibreCAD without errors
3. PIPE components → LINE entities with correct start/end coordinates
4. ELBOW components with cp → ARC entities
5. FLANGE components → CIRCLE entities
6. VALVE components → INSERT entities referencing VALVE block
7. SUPPORT components → POINT + TEXT entities on SUPPORTS layer
8. Layer table contains all unique PIPELINE-REFERENCE values
9. Empty components array → valid minimal DXF (no entities, no crash)
