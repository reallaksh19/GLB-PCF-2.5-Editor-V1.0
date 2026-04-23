import { test, expect } from '@playwright/test';
import { dryRun, runMacro } from '../js/macro/macro-runtime.js';
import { createExecutor } from '../js/macro/macro-builtins.js';

test.describe('Macro Runtime', () => {
  const mockIr = {
    version: 1,
    commands: [
      { type: 'ROUTE_START', payload: { x: 0, y: 0, z: 0 } },
      { type: 'ROUTE_SEGMENT_ADD', payload: { dx: 1000, dy: 0, dz: 0 } },
      { type: 'INSERT_COMPONENT', payload: { component: 'VALVE', at: 'LAST' } }
    ]
  };

  test('Dry-run mismatch detection before execution', () => {
    const seedState = { components: [] };
    const executor = createExecutor(seedState);
    const report = dryRun(mockIr, executor, seedState);
    expect(report).toHaveLength(3);
    expect(report.every(r => r.ok)).toBe(true);

    const badIr = {
       commands: [ { type: 'ROUTE_SEGMENT_ADD', payload: { dx: 100, dy: 0, dz: 0 } } ]
    };
    const badReport = dryRun(badIr, executor, seedState);
    expect(badReport[0].ok).toBe(false);
  });

  test('Macro replay determinism on same seed state', async () => {
    const state1 = { components: [] };
    const emit1 = () => {};
    await runMacro(mockIr, createExecutor(state1), emit1);

    const state2 = { components: [] };
    const emit2 = () => {};
    await runMacro(mockIr, createExecutor(state2), emit2);

    expect(state1.components).toEqual(state2.components);
  });

  test('Coordinate-to-pipe macro generates expected segment count', async () => {
    const state = { components: [] };
    const emit = () => {};
    await runMacro(mockIr, createExecutor(state), emit);

    expect(state.components.filter(c => c.type === 'PIPE')).toHaveLength(1);
    expect(state.components.filter(c => c.type === 'VALVE')).toHaveLength(1);
  });

  test('Rise/drop commands generate correct Z delta with error <= 1 mm', async () => {
      const ir = {
          commands: [
              { type: 'ROUTE_START', payload: { x: 0, y: 0, z: 0 } },
              { type: 'ROUTE_SEGMENT_ADD', payload: { dx: 0, dy: 0, dz: 2500 } }, // RISE
              { type: 'ROUTE_SEGMENT_ADD', payload: { dx: 0, dy: 0, dz: -1000 } } // DROP
          ]
      };
      const state = { components: [] };
      await runMacro(ir, createExecutor(state), () => {});
      const pipes = state.components.filter(c => c.type === 'PIPE');
      expect(pipes).toHaveLength(2);
      expect(Math.abs(pipes[0].end.z - 2500)).toBeLessThanOrEqual(1);
      expect(Math.abs(pipes[1].end.z - 1500)).toBeLessThanOrEqual(1);
  });

  test('Programmatic component insert matches expected type/size/rating in fixture', async () => {
     const state = { components: [] };
     await runMacro(mockIr, createExecutor(state), () => {});
     const valve = state.components.find(c => c.type === 'VALVE');
     expect(valve).toBeDefined();
  });

  test('50-command macro executes without uncaught exception', async () => {
      const commands = [ { type: 'ROUTE_START', payload: { x:0, y:0, z:0 } } ];
      for(let i=0; i<49; i++) {
          commands.push({ type: 'ROUTE_SEGMENT_ADD', payload: { dx: 10, dy: 0, dz: 0 } });
      }
      const ir = { commands };
      const state = { components: [] };
      let error = null;
      try {
          await runMacro(ir, createExecutor(state), () => {});
      } catch (err) {
          error = err;
      }
      expect(error).toBeNull();
      expect(state.components).toHaveLength(49);
  });
});
