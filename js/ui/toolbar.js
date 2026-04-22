/**
 * @file js/ui/toolbar.js
 * @description Viewer toolbar event wiring — file inputs, view presets, heatmap,
 *              labels toggle, theme select, export buttons.
 * @status PLACEHOLDER — implement per wi/WI-toolbar.md
 *
 * Exports:
 *   function initToolbar(renderer, getComponents, getDomain): void
 *
 * Constructor parameters:
 *   renderer      SceneRenderer instance
 *   getComponents () => GenericComponent[]   — current loaded components
 *   getDomain     () => DomainPlugin          — active domain
 *
 * Wires these HTML elements (all exist in index.html):
 *   #btn-viewer-open-pcf   + #viewer-pcf-input  → parse PCF/DXF → renderer.loadComponents
 *   #btn-viewer-open-glb   + #viewer-glb-input  → renderer.loadGLB
 *   [data-view]            → renderer.setView(preset)
 *   #btn-fit-all           → renderer.fitAll()
 *   #viewer-heatmap        → renderer.setHeatmap(field)
 *   #viewer-labels-toggle  → renderer.setLabelsVisible(bool)
 *   #viewer-theme          → renderer.setTheme(theme)
 *   #btn-export-glb        → renderer.exportGLB()
 *   #btn-export-dxf        → exportToDXF(components) → download
 *   #viewer-status         → status text updates
 *
 * Dependencies:
 *   ../renderer/scene-renderer.js  (SceneRenderer)
 *   ../../core/domain-registry.js  (getActiveDomain)
 *   ../../js/glb/exportToDXF.js
 *   ../../js/debug/logger.js       (appLogger)
 */

import { openMasterDbPopup } from '../data/masterdb-popup.js';

// TODO: implement — see wi/WI-toolbar.md
export function initToolbar(_renderer, _getComponents, _getDomain) {
  console.warn('[toolbar] Not yet implemented. See wi/WI-toolbar.md');

  const btnMasterDb = document.getElementById('btn-viewer-open-masterdb');
  if (btnMasterDb && window.masterDBStore) {
    btnMasterDb.addEventListener('click', () => {
      openMasterDbPopup(window.masterDBStore);
    });
  }
}
