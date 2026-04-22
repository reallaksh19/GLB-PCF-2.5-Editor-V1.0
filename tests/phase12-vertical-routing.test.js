import { test, expect } from '@playwright/test';
import { addRouteSegment } from '../js/editor/command-handlers.js';

test.describe('Phase 12 - Vertical Routing', () => {
  test('Vertical classification is exactly VERTICAL', () => {
     let state = { model: { routes: [{ id: 'R-1', nodes: [{id: 'N1', x:0, y:0, z:0}], segments: [] }] } };
     addRouteSegment(state, { payload: { routeId: 'R-1', dx: 0, dy: 0, dz: 1000 } });
     expect(state.model.routes[0].segments[0].orientation).toBe('VERTICAL');
  });
});
