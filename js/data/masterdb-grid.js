import { REQUIRED_VISIBLE_COLUMNS, OPTIONAL_VISIBLE_COLUMNS } from './masterdb-schema.js';

export function createGridUI(containerId, store) {
  const container = document.getElementById(containerId);
  if (!container) return null;

  container.innerHTML = '';

  const toolbar = document.createElement('div');
  toolbar.className = 'masterdb-grid-toolbar';

  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add Row';
  addBtn.onclick = () => {
    store.addRow();
    renderGrid();
  };

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.onclick = () => {
    store.save();
    renderGrid();
  };

  toolbar.appendChild(addBtn);
  toolbar.appendChild(saveBtn);

  const table = document.createElement('table');
  table.className = 'masterdb-grid-table';

  container.appendChild(toolbar);
  container.appendChild(table);

  const cols = [...REQUIRED_VISIBLE_COLUMNS, ...OPTIONAL_VISIBLE_COLUMNS];

  function renderGrid() {
    table.innerHTML = '';

    // Header
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');

    for (const col of cols) {
      const th = document.createElement('th');
      th.textContent = col;
      trHead.appendChild(th);
    }

    const thActions = document.createElement('th');
    thActions.textContent = 'Actions';
    trHead.appendChild(thActions);

    thead.appendChild(trHead);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');

    const rows = store.getRows();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const tr = document.createElement('tr');

      for (const col of cols) {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = row[col] || '';
        input.onchange = (e) => {
          store.updateRow(i, col, e.target.value);
        };
        td.appendChild(input);
        tr.appendChild(td);
      }

      const tdActions = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.onclick = () => {
        store.deleteRow(i);
        renderGrid();
      };
      tdActions.appendChild(delBtn);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
  }

  renderGrid();

  return {
    render: renderGrid
  };
}
