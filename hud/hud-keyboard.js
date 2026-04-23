import { commitLineFromHud } from './hud-line-draw.js';

export function handleHudKeyboardEvent(event, hudState, editor) {
  if (event.key === 'Escape') {
    // Esc cancels current draft
    if (typeof hudState.cancelDraft === 'function') {
      hudState.cancelDraft();
    }
  } else if (event.key === 'Enter') {
    // Enter commits current draft
    if (hudState.mode === 'line-draw') {
      commitLineFromHud(hudState, editor);
    }
  }
}
