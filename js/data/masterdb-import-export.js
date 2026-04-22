import { REQUIRED_VISIBLE_COLUMNS, OPTIONAL_VISIBLE_COLUMNS } from './masterdb-schema.js';

function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return [];

  // A simple regex approach to handle comma-separated values that might be enclosed in quotes
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]).map(v => v.trim());
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    rows.push(row);
  }

  return rows;
}

function exportCSV(rows) {
  if (rows.length === 0) return '';

  const headers = [...REQUIRED_VISIBLE_COLUMNS, ...OPTIONAL_VISIBLE_COLUMNS];
  let csv = headers.join(',') + '\n';

  for (const row of rows) {
    const values = headers.map(h => {
      let val = row[h] !== undefined ? row[h] : '';
      // Escape commas if present in the value
      if (typeof val === 'string' && val.includes(',')) {
        val = `"${val}"`;
      }
      return val;
    });
    csv += values.join(',') + '\n';
  }

  return csv;
}

export function importFromCSV(store, csvText) {
  const rows = parseCSV(csvText);
  // Verify required columns
  if (rows.length > 0) {
    const firstRow = rows[0];
    const missingCols = REQUIRED_VISIBLE_COLUMNS.filter(col => !(col in firstRow));
    if (missingCols.length > 0) {
      throw new Error(`CSV is missing required columns: ${missingCols.join(', ')}`);
    }
  }

  store.setRows(rows);
  store.save();
}

export function exportToCSV(store) {
  return exportCSV(store.getRows());
}
