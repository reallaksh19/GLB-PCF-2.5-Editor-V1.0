/**
 * @file data/masterdb-grid.js
 * @description Lightweight DOM-based editable grid for the Master DB.
 */

import { VISIBLE_SCHEMA, VISIBLE_OPTIONAL_COLUMNS } from './masterdb-schema.js';
import { masterDbStore } from './masterdb-store.js';

export function createGridElement() {
  const container = document.createElement('div');
  container.className = 'masterdb-grid-container';
  container.style.overflow = 'auto';
  container.style.maxHeight = '400px';

  const table = document.createElement('table');
  table.className = 'masterdb-grid';
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');

  const allCols = [...VISIBLE_SCHEMA, ...VISIBLE_OPTIONAL_COLUMNS];

  for (const col of allCols) {
    const th = document.createElement('th');
    th.textContent = col;
    th.style.border = '1px solid #ccc';
    th.style.padding = '4px 8px';
    th.style.textAlign = 'left';
    th.style.background = '#f4f4f4';
    th.style.color = '#333';
    trHead.appendChild(th);
  }

  const actionTh = document.createElement('th');
  actionTh.textContent = 'Actions';
  actionTh.style.border = '1px solid #ccc';
  actionTh.style.padding = '4px 8px';
  actionTh.style.background = '#f4f4f4';
  trHead.appendChild(actionTh);

  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  table.appendChild(tbody);
  container.appendChild(table);

  const btnAdd = document.createElement('button');
  btnAdd.textContent = '+ Add Row';
  btnAdd.style.marginTop = '8px';
  btnAdd.addEventListener('click', () => {
    const newRow = { id: crypto.randomUUID(), Component: 'PIPE', Size: '2', Length: '1000', Weight: '10' };
    const currentRows = masterDbStore.state.rows;
    masterDbStore.update({ rows: [...currentRows, newRow], dirty: true });
  });

  container.appendChild(btnAdd);

  function renderRows(state) {
    tbody.innerHTML = '';
    const { rows } = state;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const tr = document.createElement('tr');

      for (const col of allCols) {
        const td = document.createElement('td');
        td.style.border = '1px solid #ccc';
        td.style.padding = '4px';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = row[col] || '';
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';
        input.style.border = 'none';
        input.style.background = 'transparent';

        input.addEventListener('change', (e) => {
            const newRows = [...masterDbStore.state.rows];
            newRows[i] = { ...newRows[i], [col]: e.target.value };
            masterDbStore.update({ rows: newRows, dirty: true });
        });

        td.appendChild(input);
        tr.appendChild(td);
      }

      const tdAction = document.createElement('td');
      tdAction.style.border = '1px solid #ccc';
      tdAction.style.padding = '4px';

      const btnDel = document.createElement('button');
      btnDel.textContent = 'Delete';
      btnDel.addEventListener('click', () => {
          const newRows = [...masterDbStore.state.rows];
          newRows.splice(i, 1);
          masterDbStore.update({ rows: newRows, dirty: true });
      });

      tdAction.appendChild(btnDel);
      tr.appendChild(tdAction);

      tbody.appendChild(tr);
    }
  }

  masterDbStore.subscribe(renderRows);
  renderRows(masterDbStore.state);

  return container;
}
