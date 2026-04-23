import { SceneRenderer } from '../renderer/scene-renderer.js';
import { initToolbar } from '../ui/toolbar.js';

let _sceneRenderer = null;

function _exposeSceneRenderer(renderer) {
  if (typeof window !== 'undefined') window._sceneRenderer = renderer;
}

export function initViewerTab() {
  const container = document.getElementById('viewer-canvas');
  _sceneRenderer = container ? new SceneRenderer(container) : null;
  _exposeSceneRenderer(_sceneRenderer);

  if (_sceneRenderer) {
      initToolbar(_sceneRenderer, () => {
         return _sceneRenderer._compIndex ? Array.from(_sceneRenderer._compIndex.values()) : [];
      }, () => null);
  }
}
