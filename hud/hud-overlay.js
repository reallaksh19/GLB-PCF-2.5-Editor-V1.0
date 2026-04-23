import { formatProvenance } from './hud-format.js';

export function renderHudOverlay(container, hudState) {
  let overlay = container.querySelector('.hud-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'hud-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '10px';
    overlay.style.left = '10px';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
    overlay.style.color = 'white';
    overlay.style.padding = '10px';
    overlay.style.borderRadius = '5px';
    overlay.style.fontFamily = 'monospace';
    overlay.style.zIndex = '1000';
    overlay.style.pointerEvents = 'none';
    container.appendChild(overlay);
  }

  let html = `<div>Mode: <span id="hud-mode">${hudState.mode}</span></div>`;

  if (hudState.mode === 'line-draw') {
    html += `<div>Axis: <span id="hud-axis">${hudState.axisLock || 'None'}</span></div>`;
    html += `<div>Length: <span id="hud-length">${hudState.draft?.lengthMm || '0'}</span> mm</div>`;
    if (hudState.lastLengthMm) {
      html += `<div>Last Length: <span id="hud-last-length">${hudState.lastLengthMm}</span> mm</div>`;
    }
  } else if (hudState.mode === 'insert') {
    html += `<div>Preview: <span id="hud-preview">${hudState.preview ? hudState.preview.component : 'None'}</span></div>`;
    html += `<div>Source: <span id="hud-provenance">${formatProvenance(hudState.provenance)}</span></div>`;
  }

  if (hudState.errors && hudState.errors.length > 0) {
    html += `<div style="color: red;" id="hud-errors">${hudState.errors.join(', ')}</div>`;
  }

  overlay.innerHTML = html;
}
