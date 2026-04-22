import { test, expect } from '@playwright/test';
import { tokenizeMacro } from '../js/macro/macro-tokenize.js';
import { parseMacro } from '../js/macro/macro-parse.js';
import { compileMacro } from '../js/macro/macro-compile.js';

test.describe('Macro Compile', () => {
  test('Valid macro fixture compile success', () => {
    const text = `PIPE START 0,0,0 SIZE 6 RATING 150 SPEC CS150
LINE TO 5000,0,0
RISE 0,0,2500
INSERT VALVE TYPE GATE SIZE 6 RATING 150 AT LAST
INSERT FLANGE TYPE WN SIZE 6 RATING 150 AT LAST`;

    const tokens = tokenizeMacro(text);
    const ast = parseMacro(tokens);
    const ir = compileMacro(ast);

    expect(ir.version).toBe(1);
    expect(ir.commands).toHaveLength(5);
    expect(ir.commands[0].type).toBe('ROUTE_START');
    expect(ir.commands[1].type).toBe('ROUTE_SEGMENT_ADD');
    expect(ir.commands[2].type).toBe('ROUTE_SEGMENT_ADD');
    expect(ir.commands[3].type).toBe('INSERT_COMPONENT');
    expect(ir.commands[4].type).toBe('INSERT_COMPONENT');
  });

  test('Invalid syntax fixture error localization accuracy', () => {
    // Provide a mock document object before parsing because of imports potentially triggering browser-specific code.
    // parseMacro and MacroError don't rely on it, but let's mock it to be safe in node test env
    if (typeof global !== 'undefined' && typeof document === 'undefined') {
        global.document = {
            readyState: 'complete',
            querySelectorAll: () => [],
            addEventListener: () => {}
        };
    }

    const text = `PIPE START 0,0,0 SIZE 6
UNKNOWN CMD`;
    const tokens = tokenizeMacro(text);
    let err;
    try {
      parseMacro(tokens);
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.line).toBe(2);
    expect(err.name).toBe('MacroError');
  });
});
