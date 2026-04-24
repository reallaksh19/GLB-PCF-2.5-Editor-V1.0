// js/ui/toolbar.js
import { exportToDXF } from '../../js/glb/exportToDXF.js';
import { appLogger }   from '../debug/logger.js';

export function initToolbar(renderer, getComponents, getDomain) {
  // View preset buttons
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => renderer.setView(btn.dataset.view));
  });

  // Fit All
  document.getElementById('btn-fit-all')
    ?.addEventListener('click', () => renderer.fitAll());

  // Heatmap
  document.getElementById('viewer-heatmap')
    ?.addEventListener('change', (e) => {
      renderer.setHeatmap(e.target.value, getComponents());
    });

  // Labels toggle
  document.getElementById('viewer-labels-toggle')
    ?.addEventListener('change', (e) => renderer.setLabelsVisible(e.target.checked));

  // Theme
  document.getElementById('viewer-theme')
    ?.addEventListener('change', (e) => renderer.setTheme(e.target.value));

  // GLB export
  document.getElementById('btn-export-glb')
    ?.addEventListener('click', () => renderer.exportGLB());

  // DXF export
  document.getElementById('btn-export-dxf')
    ?.addEventListener('click', () => {
      const comps = getComponents();
      if (comps.length === 0) {
        appLogger.warn('DXF_EXPORT_EMPTY', {});
        return;
      }
      exportToDXF(comps);
    });
}
