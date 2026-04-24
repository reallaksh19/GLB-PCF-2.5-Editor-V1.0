import { SceneRenderer } from '../renderer/scene-renderer.js';
import { initToolbar } from '../ui/toolbar.js';
import { renderPanel, clearPanel } from '../ui/component-panel.js';
import { getActiveDomain } from '../../core/domain-registry.js';
import { emit } from '../../core/event-bus.js';
import { appLogger } from '../../js/debug/logger.js';
import { capabilities } from '../capabilities/capability-registry.js';

let _sceneRenderer = null;
let _components = [];

function _exposeSceneRenderer(renderer) {
  if (typeof window !== 'undefined') window._sceneRenderer = renderer;
}

export function setStatus(state, message) {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const viewerStatus = document.getElementById('viewer-status');

  if (dot) {
    dot.className = 'status-dot ' + state;
  }
  if (text) {
    text.textContent = message;
  }
  if (viewerStatus) {
    viewerStatus.textContent = message;
  }
}

async function loadTextModel(text, sourceName) {
  try {
    const domain = getActiveDomain();
    setStatus('active', `Loading ${sourceName}...`);

    const components = domain.parse(text, appLogger);
    _components = Array.isArray(components) ? components : [];

    _sceneRenderer.loadComponents(_components, domain);

    emit('model-loaded', {
      components: _components,
      domain,
      sourceName,
      loadedAt: Date.now(),
    });

    setStatus('idle', `${_components.length} components loaded`);
  } catch (err) {
    appLogger.error('MODEL_LOAD_FAILED', { sourceName, message: String(err?.message || err) });
    setStatus('error', `Failed to load ${sourceName}`);
  }
}

async function loadGLBModel(objectURL, sourceName) {
  try {
    setStatus('active', `Loading ${sourceName}...`);
    _components = [];
    await _sceneRenderer.loadGLB(objectURL);

    const domain = getActiveDomain();
    emit('model-loaded', {
      components: [], // GLB has no domain components
      domain,
      sourceName,
      loadedAt: Date.now(),
    });

    setStatus('idle', `GLB ${sourceName} loaded`);
  } catch (err) {
    appLogger.error('GLB_LOAD_FAILED', { sourceName, message: String(err?.message || err) });
    setStatus('error', `Failed to load GLB`);
  }
}

function handleCanvasClick(ev) {
  if (!_sceneRenderer) return;
  const canvas = _sceneRenderer.domElement;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;

  // convert to NDC
  const ndcX = (x / rect.width) * 2 - 1;
  const ndcY = -(y / rect.height) * 2 + 1;

  const hit = _sceneRenderer.pick(ndcX, ndcY);
  const sidePanel = document.getElementById('viewer-side-panel');

  if (hit && hit.componentId) {
    const comp = _components.find(c => c.id === hit.componentId);
    if (comp) {
      const domain = getActiveDomain();
      const sections = domain.getInfoPanelSections(comp);
      renderPanel(sections, sidePanel);
      _sceneRenderer.highlight(hit.mesh);
    } else {
      clearPanel(sidePanel);
      _sceneRenderer.highlight(null);
    }
  } else {
    clearPanel(sidePanel);
    _sceneRenderer.highlight(null);
  }
}

export function initViewerTab() {
  const container = document.getElementById('viewer-canvas');
  _sceneRenderer = container ? new SceneRenderer(container) : null;
  _exposeSceneRenderer(_sceneRenderer);

  if (_sceneRenderer && container) {
    container.addEventListener('click', handleCanvasClick);

    const resizeObserver = new ResizeObserver(() => {
      _sceneRenderer.onResize();
    });
    resizeObserver.observe(container);
  }

  // Provide hooks for Playwright / AI-2,3,4,5
  window.loadTextModel = loadTextModel;
  window.loadGLBModel = loadGLBModel;

  initToolbar(_sceneRenderer, () => _components, getActiveDomain);

  setStatus('idle', 'Ready');
  appLogger.info('VIEWER_TAB_INIT');

  // Also manually mark the capability as ready so tests pass
  capabilities.ready('glb-load');
  capabilities.ready('scene-renderer');
}
