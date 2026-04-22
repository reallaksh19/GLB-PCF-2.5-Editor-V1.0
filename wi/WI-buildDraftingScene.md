# WI — buildDraftingScene

## File
`js/vendor/buildDraftingScene.js`

## Purpose
High-quality Three.js geometry builders for each piping component type. Each function takes
a `GenericComponent` and a theme string and returns a `THREE.Object3D` (or null).

---

## Exports
```javascript
export function buildPipeDraft(comp, theme): THREE.Object3D
export function buildBendDraft(comp, theme): THREE.Object3D
export function buildTeeDraft(comp, theme):  THREE.Object3D
export function buildFlangeDraft(comp, theme): THREE.Object3D
export function buildValveDraft(comp, theme): THREE.Object3D
export function buildGenericDraft(comp, theme): THREE.Object3D
export function setUserData(mesh, comp): void
```

---

## Shared Helpers

### `setUserData(mesh, comp)`
```javascript
mesh.userData = {
  compId:  comp.id,
  pcfType: comp.type,
  bore:    comp.geometry.bore,
  ep1str:  comp.geometry.ep1 ? JSON.stringify(comp.geometry.ep1) : null,
  ep2str:  comp.geometry.ep2 ? JSON.stringify(comp.geometry.ep2) : null,
  ...comp.attributes,
};
```
Apply to every mesh/group returned by any builder.

### Theme colours
```javascript
const COLORS = {
  NavisDark: { pipe: 0xb8c4d2, flange: 0x8899aa, valve: 0x6699aa, generic: 0x9aabb8 },
  DrawLight:  { pipe: 0x2d3748, flange: 0x1a2535, valve: 0x334455, generic: 0x3d4f62 },
};
function themeColor(theme, key) { return (COLORS[theme] || COLORS.NavisDark)[key]; }
```

### Coordinate utilities
```javascript
function toVec3(pt) { return new THREE.Vector3(pt.x, pt.y, pt.z); }
function minBore(bore) { return Math.max(bore || 25, 8); }  // minimum 8 mm radius pipe
```

---

## `buildPipeDraft(comp, theme)`
```
ep1, ep2 must be defined; fallback: return buildGenericDraft if missing.

1. ep1V = toVec3(comp.geometry.ep1)
   ep2V = toVec3(comp.geometry.ep2)
2. dir = ep2V.clone().sub(ep1V)
   len = dir.length()
   if len < 0.001: return null (zero-length pipe)
3. radius = minBore(comp.geometry.bore) / 2
4. geo = new THREE.CylinderGeometry(radius, radius, len, 16, 1)
5. mat = new THREE.MeshStandardMaterial({ color: themeColor(theme, 'pipe') })
6. mesh = new THREE.Mesh(geo, mat)
7. Position: mesh.position.copy(ep1V).addScaledVector(dir.normalize(), len / 2)
   Orient: use quaternion from (0,1,0) to dir.normalize()
     const axis = new THREE.Vector3(0,1,0).cross(dir.clone().normalize()).normalize()
     const angle = Math.acos(new THREE.Vector3(0,1,0).dot(dir.clone().normalize()))
     mesh.quaternion.setFromAxisAngle(axis, angle)
     (handle degenerate case where dir is parallel to Y-axis)
8. setUserData(mesh, comp)
9. return mesh
```

### Orientation pattern (reuse for all cylinder builders)
```javascript
function orientCylinder(mesh, from, to) {
  const dir = to.clone().sub(from).normalize();
  const yAxis = new THREE.Vector3(0, 1, 0);
  if (Math.abs(dir.dot(yAxis)) > 0.9999) {
    mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), dir.y < 0 ? Math.PI : 0);
  } else {
    const axis  = new THREE.Vector3().crossVectors(yAxis, dir).normalize();
    const angle = Math.acos(yAxis.dot(dir));
    mesh.quaternion.setFromAxisAngle(axis, angle);
  }
}
```

---

## `buildBendDraft(comp, theme)`
```
ep1, ep2, cp must be defined; if cp missing: return buildPipeDraft(comp, theme).

1. ep1V = toVec3(comp.geometry.ep1)
   ep2V = toVec3(comp.geometry.ep2)
   cpV  = toVec3(comp.geometry.cp)
2. Create THREE.QuadraticBezierCurve3(ep1V, cpV, ep2V)
3. tubeSegments = 24, radialSegments = 12
4. radius = minBore(comp.geometry.bore) / 2
5. geo = new THREE.TubeGeometry(curve, tubeSegments, radius, radialSegments, false)
6. mat = new THREE.MeshStandardMaterial({ color: themeColor(theme, 'pipe') })
7. mesh = new THREE.Mesh(geo, mat)
8. setUserData(mesh, comp)
9. return mesh
```

---

## `buildTeeDraft(comp, theme)`
```
ep1, ep2 = run endpoints. bp = branch endpoint (may be null).
If ep1 or ep2 missing: return buildGenericDraft.

1. Create group = new THREE.Group()
2. Run cylinder: ep1V → ep2V  (use buildPipeDraft logic, add to group)
3. Branch: if comp.geometry.bp defined:
     midV = ep1V.clone().add(ep2V).multiplyScalar(0.5)
     branch cylinder: midV → bpV
     add to group
4. setUserData(group, comp)  (also setUserData on each child mesh)
5. return group
```

---

## `buildFlangeDraft(comp, theme)`
```
origin = comp.geometry.origin. bore = comp.geometry.bore.

1. OD = minBore(bore) * 1.8
   thickness = minBore(bore) * 0.2
2. geo1 = new THREE.CylinderGeometry(OD/2, OD/2, thickness, 24)
3. mat  = new THREE.MeshStandardMaterial({ color: themeColor(theme, 'flange') })
4. m1   = new THREE.Mesh(geo1, mat)
5. m2   = m1.clone()
6. m1.position.set(0, thickness/2, 0)
   m2.position.set(0, -thickness/2, 0)
7. group = new THREE.Group(); group.add(m1, m2)
8. group.position.copy(toVec3(comp.geometry.origin))
9. setUserData(group, comp)
10. return group
```

---

## `buildValveDraft(comp, theme)`
```
origin = midpoint of ep1→ep2 if both defined, otherwise comp.geometry.origin.

1. r = minBore(comp.geometry.bore) / 2 * 1.5
2. geo = new THREE.SphereGeometry(r, 12, 8)
3. mat = new THREE.MeshStandardMaterial({ color: themeColor(theme, 'valve') })
4. sphere = new THREE.Mesh(geo, mat)
5. sphere.position.copy(origin or midpoint)
6. setUserData(sphere, comp)
7. return sphere
```

---

## `buildGenericDraft(comp, theme)`
```
Small cube at comp.geometry.origin.

1. s = 50  (50mm cube)
2. geo = new THREE.BoxGeometry(s, s, s)
3. mat = new THREE.MeshStandardMaterial({ color: themeColor(theme, 'generic') })
4. mesh = new THREE.Mesh(geo, mat)
5. mesh.position.copy(toVec3(comp.geometry.origin))
6. setUserData(mesh, comp)
7. return mesh
```

---

## Dependencies
```
three
```

---

## Test Criteria
1. `buildPipeDraft(pipeComp, 'NavisDark')` → cylinder visible between ep1 and ep2
2. `buildBendDraft(bendComp, 'NavisDark')` → curved tube following ep1→cp→ep2
3. `buildBendDraft(bendCompNoCp, ...)` → falls back to straight cylinder (no crash)
4. `buildTeeDraft(teeComp, ...)` → T-shape with run + branch cylinder
5. `buildFlangeDraft(flangeComp, ...)` → two flat discs at origin
6. `buildValveDraft(valveComp, ...)` → sphere at midpoint
7. All meshes: `mesh.userData.compId === comp.id`
8. Zero-length pipe (ep1 === ep2) → returns null (no NaN errors)
