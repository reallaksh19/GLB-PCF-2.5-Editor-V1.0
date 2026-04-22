import { test, expect } from '@playwright/test';
import { normalizeCoordinates } from '../js/editor/coordinate-normalizer.js';

test.describe('Phase 12 - Coordinate Normalization', () => {
  test('No NaN coordinates emitted and mismatch <= 1mm', () => {
     const out = normalizeCoordinates([{ x: NaN, y: 100, z: NaN }]);
     expect(out[0].x).toBe(0);
     expect(out[0].z).toBe(0);
     expect(out[0].y).toBeCloseTo(100, 1);
  });
});
