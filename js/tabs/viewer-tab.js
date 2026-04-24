import { SceneRenderer }       from '../renderer/scene-renderer.js';
import { initToolbar }         from '../ui/toolbar.js';
import { renderPanel, clearPanel } from '../ui/component-panel.js';
import { getActiveDomain }     from '../../core/domain-registry.js';
import { emit }                from '../../core/event-bus.js';
import { appLogger }           from '../debug/logger.js';
import { initMacroTerminal }   from '../../macro/macro-terminal.js';

let _renderer    = null;
let _components  = [];
let _resizeObs   = null;

export function initViewerTab() {
  const container  = document.getElementById('viewer-canvas');
  const sidePanel  = document.getElementById('viewer-side-panel');
  const statusText = document.getElementById('viewer-status');
  const statusDot  = document.getElementById('status-dot');

  if (!container) return;

  try {
    _renderer = new SceneRenderer(container);
    if (typeof window !== 'undefined') window._sceneRenderer = _renderer;
  } catch (err) {
    container.innerHTML = `<div style="padding:24px;color:#ef4444">
      ⚠️ WebGL not available: ${err.message}</div>`;
    return;
  }

  // Toolbar wiring
  initToolbar(_renderer, () => _components, getActiveDomain);
  initMacroTerminal(_renderer, () => _components, getActiveDomain);

  // Canvas click → pick → inspect
  container.addEventListener('click', (e) => {
    const rect = container.getBoundingClientRect();
    const ndcX =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
    const ndcY = -((e.clientY - rect.top)   / rect.height) * 2 + 1;
    const hit  = _renderer.pick(ndcX, ndcY);
    if (hit) {
      const domain   = getActiveDomain();
      const sections = domain?.getInfoPanelSections(hit.comp) ?? [];
      renderPanel(sections, sidePanel);
      _renderer.highlight(hit.mesh);
    } else {
      clearPanel(sidePanel);
      _renderer.highlight(null);
    }
  });

  // ResizeObserver
  _resizeObs = new ResizeObserver(() => _renderer.onResize());
  _resizeObs.observe(container);

  // PCF/DXF file open
  const pcfInput = document.getElementById('viewer-pcf-input');
  const btnPcf   = document.getElementById('btn-viewer-open-pcf');
  btnPcf?.addEventListener('click', () => pcfInput?.click());
  pcfInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    _setStatus('active', `Loading ${file.name}…`);
    try {
      const text   = await file.text();
      const domain = getActiveDomain();
      _components  = domain.parse(text, file.name, appLogger);
      _renderer.loadComponents(_components, domain);
      emit('model-loaded', { components: _components, domain });
      _setStatus('idle', `Loaded ${_components.length} components`);
    } catch (err) {
      _setStatus('error', `Error: ${err.message}`);
      appLogger.error('FILE_LOAD_FAIL', { message: err.message });
    }
    e.target.value = '';
  });

  // GLB file open
  const glbInput = document.getElementById('viewer-glb-input');
  const btnGlb   = document.getElementById('btn-viewer-open-glb');
  btnGlb?.addEventListener('click', () => glbInput?.click());
  glbInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    _setStatus('active', `Loading GLB…`);
    try {
      const url = URL.createObjectURL(file);
      await _renderer.loadGLB(url);
      URL.revokeObjectURL(url);
      _setStatus('idle', 'GLB loaded');
    } catch (err) {
      _setStatus('error', `GLB error: ${err.message}`);
    }
    e.target.value = '';
  });

  function _setStatus(state, msg) {
    if (statusText) statusText.textContent = msg;
    if (statusDot) {
      statusDot.className = `status-dot ${state}`;
    }
  }
}
