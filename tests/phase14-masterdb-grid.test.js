import { test, expect } from '@playwright/test';
import { initialMasterDbUi, masterDbStore } from '../data/masterdb-store.js';
import { normalizeMasterRow } from '../data/masterdb-normalize.js';
import { importCsvToStore } from '../data/masterdb-import-export.js';

test.describe('Phase 14 - Master DB Grid Data Quality', () => {

  test('Visible row normalizes successfully on valid fixture rows', async () => {
    const row = { id: 'r1', Component: 'VALVE', Subtype: 'GATE', Size: '6', Rating: '150', Length: '292', Weight: '84.5' };
    const record = normalizeMasterRow(row);

    expect(record.component).toBe('VALVE');
    expect(record.subtype).toBe('GATE');
    expect(record.size).toBe('6');
    expect(record.rating).toBe('150');
    expect(record.length).toBe(292);
    expect(record.weight).toBe(84.5);
    expect(record.source).toBe('user-masterdb');
  });

  test('Dirty-state detection after edit', async () => {
    masterDbStore.state = { ...initialMasterDbUi };
    masterDbStore.update({ rows: [{ id: '1', Component: 'PIPE', Size: '2', Length: '1000' }], dirty: true });

    expect(masterDbStore.state.dirty).toBe(true);
    expect(masterDbStore.getRecords().length).toBe(1);
    expect(masterDbStore.getRecords()[0].component).toBe('PIPE');
  });

  test('CSV import of 500 rows without crash', async () => {
    let csv = "Component,Size,Length,Weight\n";
    for(let i=0; i<500; i++) {
        csv += `VALVE,6,292,84.5\n`;
    }

    masterDbStore.state = { ...initialMasterDbUi };
    importCsvToStore(csv);

    expect(masterDbStore.state.rows.length).toBe(500);
    expect(masterDbStore.state.dirty).toBe(true);

    const records = masterDbStore.getRecords();
    expect(records.length).toBe(500);
    expect(records[0].component).toBe('VALVE');
  });

});
