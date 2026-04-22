/**
 * @file data/masterdb-store.js
 * @description State and store management for the Master DB grid.
 */

import { normalizeMasterRow } from './masterdb-normalize.js';

export const initialMasterDbUi = {
  open: false,
  rows: [],          // User-facing un-normalized rows
  internalRecords: [], // Normalized lookup records
  dirty: false,
  selectedCell: null,
  filterText: '',
  sort: { key: 'Component', dir: 'asc' },
};

// Extremely simple pub-sub for store if needed, or just let UI manage it locally
export class MasterDbStore {
  constructor() {
    this.state = { ...initialMasterDbUi };
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  update(patch) {
    this.state = { ...this.state, ...patch };

    // Auto-sync internal records if rows changed
    if (patch.rows) {
        this.state.internalRecords = this.state.rows.map(normalizeMasterRow);
    }

    this.emit();
  }

  getRecords() {
    return this.state.internalRecords;
  }
}

export const masterDbStore = new MasterDbStore();
