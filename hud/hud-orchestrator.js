import { initialHudState } from './hud-state.js';
import { handleHudKeyboardEvent } from './hud-keyboard.js';
import { renderHudOverlay } from './hud-overlay.js';

export function initHudOrchestrator(editor, container) {
  const state = { ...initialHudState };

  // Attach keyboard event listener
  document.addEventListener('keydown', (e) => handleHudKeyboardEvent(e, state, editor));

  // Initial render
  renderHudOverlay(container, state);

  return {
    getState: () => state,
    updateState: (newState) => {
      Object.assign(state, newState);
      renderHudOverlay(container, state);
    }
  };
}
