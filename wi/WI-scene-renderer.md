# WI — SceneRenderer

## File
`js/renderer/scene-renderer.js`

## Purpose
Domain-agnostic Three.js WebGL + CSS2D isometric scene renderer. Knows nothing about PCF,
piping, or any specific domain. Receives `GenericComponent[]` and a domain plugin; delegates
all geometry and label creation to the domain.

---

## Exports
```javascript
export class SceneRenderer
```

---

## Constructor
```javascript
new SceneRenderer(container: HTMLElement)
```

Sets up:
1. `THREE.WebGLRenderer({ antialias: true, alpha: false })` — append its `domElement` to `container`
2. `CSS2DRenderer` — append its `domElement` to `container` (position absolute, inset 0)
3. `THREE.OrthographicCamera(left, right, top, bottom, near=-10000, far=100000)` — isometric by default
4. `THREE.OrbitControls(camera, css2dRenderer.domElement)` — enable zoom + pan; disable rotate
5. Scene setup: ambient light (#ffffff, 0.8) + directional light at (1,1,1)
6. Internal state:
   - `_scene = new THREE.Scene()`
   - `_meshGroup = new THREE.Group()` — add to scene
   - `_labelGroup = new THREE.Group()` — add to scene
   - `_symbolGroup = new THREE.Group()` — add to scene
   - `_compIndex = new Map()` — compId → GenericComponent
   - `_meshIndex = new Map()` — mesh.uuid → GenericComponent
   - `_highlighted = null` — currently highlighted mesh
   - `_theme = 'NavisDark'`
   - `_animId = null`
7. Start render loop (see `_animate`)

---

## Public Methods

### `loadComponents(components, domain)`
1. Call `clear()` to remove old scene content
2. For each `comp` in `components`:
   a. `domain.buildMesh(comp, this._theme)` → mesh (may be null)
   b. `domain.buildSymbol(comp)` → symbol (may be null)
   c. `domain.buildLabel(comp)` → label CSS2DObject (may be null)
   d. If mesh: `_meshGroup.add(mesh)`, `_meshIndex.set(mesh.uuid, comp)`, `_compIndex.set(comp.id, comp)`
   e. If symbol: `_symbolGroup.add(symbol)`, `_meshIndex.set(symbol.uuid, comp)`
   f. If label: `_labelGroup.add(label)`
3. Call `fitAll()`

### `async loadGLB(url)`
1. `new GLTFLoader().load(url, gltf => { ... })`
2. Call `clear()`
3. Traverse `gltf.scene` — for each mesh with `userData.compId`:
   a. Reconstruct GenericComponent via `componentFromUserData(mesh.userData)` (from `core/component-model.js`)
   b. Register in `_meshIndex` and `_compIndex`
4. Add `gltf.scene` to `_meshGroup`
5. Call `fitAll()`

### `clear()`
1. Dispose all geometries and materials in `_meshGroup`, `_labelGroup`, `_symbolGroup`
2. `_compIndex.clear()`, `_meshIndex.clear()`
3. `_highlighted = null`

### `setHeatmap(field, components)`
1. Import `applyHeatmap` from `../ui/heatmap.js`
2. If `field === 'none'`: call `clearHeatmap(_scene)`
3. Otherwise: `applyHeatmap(_scene, field, components)`

### `setTheme(theme)`
1. `this._theme = theme`
2. Set `_renderer.setClearColor(theme === 'NavisDark' ? 0x0f172a : 0xf7f8fb)`

### `setLabelsVisible(visible)`
`_labelGroup.visible = visible`

### `setView(preset)`
Preset → camera position + quaternion:
- `'iso-ne'`: position (1,1,1) normalized × distance, look at origin
- `'iso-nw'`: (-1,1,1)
- `'iso-se'`: (1,1,-1)
- `'iso-sw'`: (-1,1,-1)
- `'plan'`: (0,1,0) × distance — pure top-down
- `'front'`: (0,0,1) × distance

Distance = `_boundingSphere.radius × 2` (from `fitAll`). After positioning, call `controls.update()`.

### `fitAll()`
1. Compute bounding box of `_meshGroup` using `THREE.Box3().setFromObject(_meshGroup)`
2. Get bounding sphere from box
3. Resize frustum to fit sphere (orthographic: set left/right/top/bottom from sphere radius + aspect)
4. Position camera so sphere fills view
5. `controls.target = sphere.center`; `controls.update()`

### `pick(ndcX, ndcY)`
1. `new THREE.Raycaster().setFromCamera({ x: ndcX, y: ndcY }, _camera)`
2. `raycaster.intersectObjects(_meshGroup.children, true)` — get first hit
3. Walk up hit.object ancestors to find first with `userData.compId`
4. Return `{ comp: _meshIndex.get(hit.object.uuid), mesh: hit.object }` or `null`

### `highlight(mesh)`
1. If `_highlighted` and `_highlighted !== mesh`: restore original color
2. If `mesh`: tint mesh material emissive to `0x223344`; store `_highlighted = mesh`
3. If `mesh === null`: clear highlight

### `async exportGLB()`
1. Import `exportSceneToGLB` from `../glb/exportSceneToGLB.js`
2. Call with `_scene` → download

### `onResize()`
1. Get `container.clientWidth / clientHeight`
2. `_renderer.setSize(w, h)` + `_css2dRenderer.setSize(w, h)`
3. Update camera frustum (maintain aspect)
4. `_camera.updateProjectionMatrix()`

### `dispose()`
1. Cancel animation frame
2. `controls.dispose()`, `_renderer.dispose()`
3. Remove canvas + CSS2D domElement from container

---

## Private `_animate()`
```javascript
_animate() {
  this._animId = requestAnimationFrame(() => this._animate());
  this._controls.update();
  this._renderer.render(this._scene, this._camera);
  this._css2dRenderer.render(this._scene, this._camera);
}
```

---

## Dependencies
```
three
three/addons/controls/OrbitControls.js
three/addons/renderers/CSS2DRenderer.js
three/addons/loaders/GLTFLoader.js
../glb/exportSceneToGLB.js
../ui/heatmap.js
../../core/component-model.js  (componentFromUserData)
```

---

## Test Criteria
1. `new SceneRenderer(container)` — canvas appears in container, no console errors
2. `loadComponents(components, domain)` with piping domain → meshes visible in isometric view
3. `setView('plan')` → top-down view
4. `fitAll()` → all meshes fit in viewport
5. `pick(ndcX, ndcY)` → returns correct GenericComponent on mesh click
6. `setHeatmap('OD', components)` → mesh colours change
7. `setLabelsVisible(false)` → labels disappear
8. `setTheme('DrawLight')` → background becomes light (#f7f8fb)
9. `exportGLB()` → file downloads
10. `onResize()` → no layout distortion after window resize
