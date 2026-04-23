import { exportToDXF } from '../glb/exportToDXF.js';
import { appLogger } from '../debug/logger.js';

function bindClick(id, handler) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('click', async (ev) => {
    try {
      await handler(ev);
    } catch (err) {
      appLogger.error('TOOLBAR_ACTION_FAILED', {
        id,
        message: String(err?.message || err),
      });
    }
  });
}

function bindChange(id, handler) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', async (ev) => {
    try {
      await handler(ev);
    } catch (err) {
      appLogger.error('TOOLBAR_ACTION_FAILED', {
        id,
        message: String(err?.message || err),
      });
    }
  });
}

export function initToolbar(renderer, getComponents, getDomain) {
  // File Open Buttons (Triggering hidden inputs)
  bindClick('btn-viewer-open-pcf', () => {
    document.getElementById('viewer-pcf-input')?.click();
  });

  bindClick('btn-viewer-open-glb', () => {
    document.getElementById('viewer-glb-input')?.click();
  });

  // File Inputs
  bindChange('viewer-pcf-input', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const text = await file.text();
    // Use the loadTextModel exposed on window by viewer-tab
    if (window.loadTextModel) {
      await window.loadTextModel(text, file.name);
    }
    ev.target.value = ''; // Reset
  });

  bindChange('viewer-glb-input', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const objectURL = URL.createObjectURL(file);
    if (window.loadGLBModel) {
      await window.loadGLBModel(objectURL, file.name);
    }
    ev.target.value = ''; // Reset
  });

  // View presets
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const preset = btn.getAttribute('data-view');
      try {
        if (renderer && renderer.setView) {
          renderer.setView(preset);
        }
      } catch (err) {
        appLogger.error('TOOLBAR_ACTION_FAILED', {
          id: `view-${preset}`,
          message: String(err?.message || err),
        });
      }
    });
  });

  // Fit All
  bindClick('btn-fit-all', () => {
    if (renderer && renderer.fitAll) {
      renderer.fitAll();
    }
  });

  // Heatmap
  bindChange('viewer-heatmap', (ev) => {
    if (renderer && renderer.setHeatmap) {
      renderer.setHeatmap(ev.target.value);
    }
  });

  // Labels Toggle
  bindChange('viewer-labels-toggle', (ev) => {
    if (renderer && renderer.setLabelsVisible) {
      renderer.setLabelsVisible(ev.target.checked);
    }
  });

  // Theme Select
  bindChange('viewer-theme', (ev) => {
    if (renderer && renderer.setTheme) {
      renderer.setTheme(ev.target.value);
    }
  });

  // Exports
  bindClick('btn-export-glb', async () => {
    if (renderer && renderer.exportGLB) {
      await renderer.exportGLB();
    }
  });

  bindClick('btn-export-dxf', () => {
    const components = getComponents();
    if (components && components.length > 0) {
      exportToDXF(components);
    } else {
      appLogger.warn('EXPORT_DXF_FAILED', { message: 'No components to export' });
    }
  });
}
