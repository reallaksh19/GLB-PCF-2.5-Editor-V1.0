/**
 * @file js/tabs/viewer-tab.js
 * @description Initialises the 2.5D viewer tab: creates SceneRenderer, wires toolbar,
 *              handles file open, click-to-inspect, and bridges renderer ↔ debug tab
 *              via event-bus.
 * @status PLACEHOLDER — implement per wi/WI-viewer-tab.md
 *
 * Exports:
 *   function initViewerTab(): void
 *
 * Responsibilities:
 *   1. Instantiate SceneRenderer(document.getElementById('viewer-canvas'))
 *   2. Call initToolbar(renderer, () => _components, getActiveDomain)
 *   3. Handle PCF/DXF file open:
 *        - Read file text
 *        - domain.parse(text, appLogger) → GenericComponent[]
 *        - renderer.loadComponents(components, domain)
 *        - emit event-bus 'model-loaded' { components, domain }
 *   4. Handle GLB file open:
 *        - renderer.loadGLB(objectURL)
 *   5. Canvas click → renderer.pick(ndcX, ndcY)
 *        → domain.getInfoPanelSections(comp)
 *        → renderPanel(sections, sidePanel)
 *        → renderer.highlight(mesh)
 *   6. ResizeObserver on #viewer-canvas → renderer.onResize()
 *   7. Update #viewer-status and #status-text during async operations
 *   8. Update #status-dot class: idle / active / error
 *
 * Dependencies:
 *   ../renderer/scene-renderer.js
 *   ../ui/toolbar.js
 *   ../ui/component-panel.js
 *   ../../core/domain-registry.js  (getActiveDomain)
 *   ../../core/event-bus.js        (emit)
 *   ../../js/debug/logger.js       (appLogger)
 */

import { SceneRenderer } from '../renderer/scene-renderer.js';
import { initToolbar } from '../ui/toolbar.js';

let _sceneRenderer = null;

function _exposeSceneRenderer(renderer) {
  if (typeof window !== 'undefined') window._sceneRenderer = renderer;
}

// TODO: implement — see wi/WI-viewer-tab.md
export function initViewerTab() {
  const container = document.getElementById('viewer-canvas');
  _sceneRenderer = container ? new SceneRenderer(container) : null;
  _exposeSceneRenderer(_sceneRenderer);

  // Call initToolbar to wire up any ready buttons, e.g., the Master DB button
  initToolbar(_sceneRenderer, () => [], null);

  console.warn('[viewer-tab] Not yet implemented. See wi/WI-viewer-tab.md');
}
