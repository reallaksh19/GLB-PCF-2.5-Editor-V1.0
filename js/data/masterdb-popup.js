import { createGridUI } from './masterdb-grid.js';

export function openMasterDbPopup(store) {
  // Check if already open
  let popup = document.getElementById('masterdb-popup');

  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'masterdb-popup';
    popup.style.position = 'fixed';
    popup.style.top = '10%';
    popup.style.left = '10%';
    popup.style.width = '80%';
    popup.style.height = '80%';
    popup.style.backgroundColor = '#fff';
    popup.style.border = '1px solid #ccc';
    popup.style.zIndex = '9999';
    popup.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';

    const header = document.createElement('div');
    header.style.padding = '10px';
    header.style.borderBottom = '1px solid #ccc';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';

    const title = document.createElement('h3');
    title.textContent = 'Master DB';
    title.style.margin = '0';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => {
      if (store.isDirty()) {
        if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
          return;
        }
      }
      popup.style.display = 'none';
      store.close();
    };

    header.appendChild(title);
    header.appendChild(closeBtn);

    const content = document.createElement('div');
    content.id = 'masterdb-popup-content';
    content.style.flex = '1';
    content.style.overflow = 'auto';
    content.style.padding = '10px';

    popup.appendChild(header);
    popup.appendChild(content);

    document.body.appendChild(popup);
  } else {
    popup.style.display = 'flex';
  }

  store.open();
  const gridUI = createGridUI('masterdb-popup-content', store);

  return popup;
}
