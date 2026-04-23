import { test, expect } from '@playwright/test';

if (typeof global !== 'undefined' && typeof document === 'undefined') {
    global.document = {
        readyState: 'complete',
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener: () => {},
        createElement: () => ({
            href: '',
            download: '',
            click: () => {},
            parentNode: { removeChild: () => {} }
        }),
        body: { appendChild: () => {} }
    };
    global.Blob = class Blob {
        constructor(content) { }
    };
    global.URL = {
        createObjectURL: () => 'blob:url',
        revokeObjectURL: () => {}
    };
}

import { exportCanonicalModel } from '../js/macro/export-bridge.js';

test.describe('Export Bridge', () => {
  const modelFixture = {
    components: [
      { type: 'PIPE', geometry: { ep1: { x:0, y:0, z:0 }, ep2: { x:1000, y:0, z:0 } } },
      { type: 'VALVE', subtype: 'GATE', position: { x:1000, y:0, z:0 } }
    ]
  };

  test('DXF export from macro-authored model returns non-empty output', () => {
    let dxfOutput = null;
    global.Blob = class Blob {
        constructor(content) {
            dxfOutput = content[0];
        }
    };
    exportCanonicalModel(modelFixture, 'DXF');

    expect(typeof dxfOutput).toBe('string');
    expect(dxfOutput.length).toBeGreaterThan(0);
    expect(dxfOutput).toContain('SECTION');
  });

  test('.pcfx stub serializer roundtrip on fixture preserves top-level counts', () => {
    const pcfxOutput = exportCanonicalModel(modelFixture, 'PCFX');
    expect(typeof pcfxOutput).toBe('string');

    const parsed = JSON.parse(pcfxOutput);
    expect(parsed.version).toBe('1.0');
    expect(parsed.counts.components).toBe(2);
    expect(parsed.data).toHaveLength(2);
  });

  test('Export after macro + HUD mixed workflow completes without crash', () => {
    let crash = false;
    try {
        exportCanonicalModel(modelFixture, 'DXF');
        exportCanonicalModel(modelFixture, 'PCFX');
    } catch(e) {
        crash = true;
    }
    expect(crash).toBe(false);
  });

  test('Exported model component count parity vs canonical model fixture', () => {
      const pcfxOutput = exportCanonicalModel(modelFixture, 'PCFX');
      const parsed = JSON.parse(pcfxOutput);
      expect(parsed.counts.components).toBe(modelFixture.components.length);
  });
});
