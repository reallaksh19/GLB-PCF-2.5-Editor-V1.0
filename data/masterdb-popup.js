/**
 * @file data/masterdb-popup.js
 * @description Shell for opening/closing the master DB grid UI.
 */

import { masterDbStore } from './masterdb-store.js';
import { createGridElement } from './masterdb-grid.js';

let popupEl = null;

export function openMasterDbPopup() {
  if (popupEl) {
    popupEl.style.display = 'block';
    masterDbStore.update({ open: true });
    return;
  }

  popupEl = document.createElement('div');
  popupEl.id = 'masterdb-popup';
  popupEl.style.position = 'fixed';
  popupEl.style.top = '10%';
  popupEl.style.left = '10%';
  popupEl.style.width = '80%';
  popupEl.style.height = '80%';
  popupEl.style.backgroundColor = 'var(--panel-bg, #ffffff)';
  popupEl.style.color = 'var(--text, #000000)';
  popupEl.style.border = '1px solid var(--border, #ccc)';
  popupEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  popupEl.style.zIndex = '9999';
  popupEl.style.display = 'flex';
  popupEl.style.flexDirection = 'column';

  const header = document.createElement('div');
  header.style.padding = '10px';
  header.style.borderBottom = '1px solid var(--border, #ccc)';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';

  const title = document.createElement('h3');
  title.textContent = 'Master DB';
  title.style.margin = '0';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', closeMasterDbPopup);

  header.appendChild(title);
  header.appendChild(closeBtn);
  popupEl.appendChild(header);

  const gridContainer = createGridElement();
  gridContainer.style.flex = '1';
  gridContainer.style.padding = '10px';
  popupEl.appendChild(gridContainer);

  document.body.appendChild(popupEl);
  masterDbStore.update({ open: true });
}

export function closeMasterDbPopup() {
  if (!popupEl) return;

  if (masterDbStore.state.dirty) {
    const confirmClose = confirm('You have unsaved changes. Are you sure you want to close?');
    if (!confirmClose) return;
  }

  popupEl.style.display = 'none';
  masterDbStore.update({ open: false });
}
