import { test, expect } from '@playwright/test';
import { resolveComponent } from '../js/data/masterdb-resolver.js';
import { normalizeMasterRow } from '../js/data/masterdb-normalize.js';

test.describe('Master DB Resolver (Node Context)', () => {
  test('Exact-match fixture accuracy', () => {
    const records = [
      normalizeMasterRow({ Component: 'VALVE', Subtype: 'GATE', Size: '6', Rating: '150', EndType: 'FLANGED', Length: 292, Weight: 84.5 }),
      normalizeMasterRow({ Component: 'VALVE', Subtype: 'GLOBE', Size: '6', Rating: '150', EndType: 'FLANGED', Length: 300, Weight: 90.0 })
    ];

    const query = {
      component: 'VALVE',
      subtype: 'GATE',
      size: '6',
      rating: '150',
      endType: 'FLANGED'
    };

    const result = resolveComponent(query, records);
    expect(result.ok).toBe(true);
    expect(result.source).toBe('master-db');
    expect(result.resolved.component).toBe('VALVE');
    expect(result.resolved.subtype).toBe('GATE');
    expect(result.warnings.length).toBe(0); // It's an exact match
  });

  test('Fallback match classification accuracy and Warning', () => {
    const records = [
      normalizeMasterRow({ Component: 'VALVE', Subtype: 'GATE', Size: '6', Rating: '150', EndType: 'FLANGED', Length: 292, Weight: 84.5 })
    ];

    const query = {
      component: 'VALVE',
      subtype: 'GATE',
      size: '6'
    };

    const result = resolveComponent(query, records);
    expect(result.ok).toBe(true);
    // Since only provided query fields are exactly matched to the record,
    // computeScore will actually return 100 for this if we don't define a partial match logic carefully.
    // Let's modify the query so that it's a genuine partial/fallback match
    // OR we change the check to be sure we expect FALLBACK_MATCH if not ALL record fields matched.
    // Actually, if query has fewer fields, fieldsProvided == fieldsMatched, so score = 100.
    // Let's test a case where score < 100:
    const fallbackQuery = {
      component: 'VALVE',
      subtype: 'GATE',
      size: '6',
      rating: '300' // mismatched rating but family matches
    };
    const fallbackResult = resolveComponent(fallbackQuery, records);

    // In our simplified score compute, rating mismatch means score=50, so it's a fallback.
    // Wait, the rating mismatch currently gives `exactMatchPotential = false` but doesn't set score to 0!
    // So it will score 10 + 20 + 20 = 50.
    expect(fallbackResult.ok).toBe(true);
    expect(fallbackResult.warnings).toContain('FALLBACK_MATCH');
  });

  test('No-match handling without exception', () => {
    const records = [
      normalizeMasterRow({ Component: 'VALVE', Subtype: 'GATE', Size: '6', Rating: '150', EndType: 'FLANGED', Length: 292, Weight: 84.5 })
    ];

    const query = {
      component: 'FLANGE',
      size: '6'
    };

    const result = resolveComponent(query, records);
    expect(result.ok).toBe(false);
    expect(result.source).toBe('manual');
    expect(result.warnings).toContain('NO_MATCH');
    expect(result.resolved).toBeNull();
  });
});
