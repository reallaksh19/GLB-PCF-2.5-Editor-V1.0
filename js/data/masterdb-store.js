import { INITIAL_RECORD } from './masterdb-schema.js';
import { normalizeMasterRow, unnormalizeMasterRecord } from './masterdb-normalize.js';

export const initialMasterDbUi = {
  open: false,
  rows: [],
  dirty: false,
  selectedCell: null,
  filterText: '',
  sort: { key: 'Component', dir: 'asc' },
};

export class MasterDBStore {
  constructor() {
    this.state = { ...initialMasterDbUi };
    this.records = []; // Internal normalized records
  }

  open() {
    this.state.open = true;
  }

  close() {
    this.state.open = false;
    this.state.dirty = false;
  }

  isDirty() {
    return this.state.dirty;
  }

  getRows() {
    return this.state.rows;
  }

  setRows(rows) {
    this.state.rows = rows;
    this.state.dirty = true;
    this._normalizeAll();
  }

  addRow() {
    this.state.rows.push({ ...INITIAL_RECORD, id: crypto.randomUUID() });
    this.state.dirty = true;
  }

  updateRow(index, col, value) {
    if (this.state.rows[index]) {
      this.state.rows[index][col] = value;
      this.state.dirty = true;
    }
  }

  deleteRow(index) {
    if (this.state.rows[index]) {
      this.state.rows.splice(index, 1);
      this.state.dirty = true;
    }
  }

  save() {
    this._normalizeAll();
    this.state.dirty = false;
    // In a real app, we might also dispatch an action to the core store here
  }

  _normalizeAll() {
    this.records = this.state.rows.map(normalizeMasterRow);
  }

  getRecords() {
    return this.records;
  }

  loadRecords(records) {
    this.records = records;
    this.state.rows = records.map(unnormalizeMasterRecord);
    this.state.dirty = false;
  }
}
