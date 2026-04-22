/**
 * @file data/masterdb-import-export.js
 * @description Import and export functionality for the Master DB grid.
 */

import { masterDbStore } from './masterdb-store.js';
import { VISIBLE_SCHEMA, VISIBLE_OPTIONAL_COLUMNS } from './masterdb-schema.js';

const ALL_COLS = [...VISIBLE_SCHEMA, ...VISIBLE_OPTIONAL_COLUMNS];

function parseCSVLine(line) {
  const result = [];
  let currentStr = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(currentStr.trim());
      currentStr = '';
    } else {
      currentStr += char;
    }
  }
  result.push(currentStr.trim());
  return result;
}

export function importCsvToStore(csvText) {
  if (!csvText) return;

  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return;

  const headers = parseCSVLine(lines[0]);
  const newRows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = { id: crypto.randomUUID() };
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (ALL_COLS.includes(header)) {
        row[header] = values[j] || '';
      }
    }
    newRows.push(row);
  }

  masterDbStore.update({ rows: newRows, dirty: true });
}

export function exportStoreToCsv() {
  const { rows } = masterDbStore.state;
  if (rows.length === 0) return '';

  const headerRow = ALL_COLS.join(',');
  const lines = [headerRow];

  for (const row of rows) {
    const lineVals = ALL_COLS.map(col => {
      let val = row[col] || '';
      val = String(val);
      if (val.includes(',') || val.includes('"')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    lines.push(lineVals.join(','));
  }

  return lines.join('\n');
}
