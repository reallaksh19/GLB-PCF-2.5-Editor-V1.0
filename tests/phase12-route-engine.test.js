import { test, expect } from '@playwright/test';
import { segmentLength3D } from '../js/editor/route-metrics.js';
import { executeCommand } from '../js/editor/command-executor.js';

test.describe('Phase 12 - Route Engine', () => {
  test('3D length error vs expected math is <= 1mm', () => {
    const seg = { from: 'n1', to: 'n2' };
    const nodeIndex = { n1: {x:0,y:0,z:0}, n2: {x:3000,y:4000,z:0} };
    expect(segmentLength3D(seg, nodeIndex)).toBeCloseTo(5000, 1);
  });
  test('100-command replay success rate is 100%', () => {
    let state = { model: { routes: [] } };
    executeCommand(state, { type: 'ROUTE_START', payload: { routeId: 'R1', startNode: {id:'N0',x:0,y:0,z:0} } });
    for(let i=1; i<=100; i++) {
      executeCommand(state, { type: 'ROUTE_SEGMENT_ADD', payload: { routeId: 'R1', dx: 100, dy: 0, dz: 0 } });
    }
    expect(state.model.routes[0].segments.length).toBe(100);
  });
});
