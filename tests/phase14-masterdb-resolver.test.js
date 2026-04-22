import { test, expect } from '@playwright/test';
import { resolveComponent } from '../data/masterdb-resolver.js';
import { normalizeMasterRow } from '../data/masterdb-normalize.js';

test.describe('Phase 14 - Master DB Resolver', () => {

  const records = [
    normalizeMasterRow({ id: '1', Component: 'VALVE', Subtype: 'GATE', Size: '6', Rating: '150', EndType: 'FLANGED', Length: '292', Weight: '84.5' }),
    normalizeMasterRow({ id: '2', Component: 'VALVE', Subtype: 'GLOBE', Size: '6', Rating: '150', Length: '300', Weight: '90' }),
    normalizeMasterRow({ id: '3', Component: 'PIPE', Size: '6', Length: '1000', Weight: '100' }),
    normalizeMasterRow({ id: '4', Component: 'VALVE', Subtype: 'GATE', Size: '4', Rating: '150', EndType: 'FLANGED', Length: '200', Weight: '40' })
  ];

  test('Exact-match fixture accuracy', async () => {
    const query = { component: 'VALVE', subtype: 'GATE', size: '6', rating: '150', endType: 'FLANGED' };
    const res = resolveComponent(query, records);

    expect(res.ok).toBe(true);
    expect(res.source).toBe('master-db');
    expect(res.resolved.id).toBe('1');
    expect(res.warnings).toEqual([]);
    expect(res.matchKey).toBe('VALVE|GATE|150|6');
  });

  test('Fallback match classification accuracy', async () => {
    const query = { component: 'VALVE', size: '6' }; // Will match both valves, GATE should win randomly or by sort but won't be exact
    const res = resolveComponent(query, records);

    expect(res.ok).toBe(true);
    expect(res.source).toBe('master-db');
    expect(res.warnings).toContain('FALLBACK_MATCH');
    expect(res.alternatives.length).toBeGreaterThan(0);
  });

  test('No-match handling without exception', async () => {
    const query = { component: 'FLANGE', size: '10' };
    const res = resolveComponent(query, records);

    expect(res.ok).toBe(false);
    expect(res.source).toBe('manual');
    expect(res.resolved).toBe(null);
    expect(res.warnings).toContain('NO_MATCH');
  });

  test('Resolver lookup speed', async () => {
    const manyRecords = [];
    for(let i=0; i<5000; i++) {
        manyRecords.push(normalizeMasterRow({ Component: 'VALVE', Size: '6', Length: '100', Weight: '10' }));
    }

    const start = Date.now();
    resolveComponent({ component: 'VALVE', size: '6' }, manyRecords);
    const time = Date.now() - start;

    expect(time).toBeLessThan(50); // Generous buffer, expected to be <= 20ms
  });

});
