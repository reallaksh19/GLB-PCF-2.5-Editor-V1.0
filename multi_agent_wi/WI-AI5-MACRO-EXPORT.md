# WI — AI-5 Macro and Export

## 1. Mission

Create the macro system requested by the user, inspired by AutoLISP-style productivity but safer and more structured for this app.

Also harden export flows so macro-authored and HUD-authored data can be emitted from the canonical model.

## 2. Critical design principle

Do not build a macro system that directly manipulates the scene or DOM.
Macros must compile to the same command IR used by the editor and HUD.

That gives:
- deterministic replay,
- dry-run validation,
- undo/redo compatibility,
- export compatibility,
- better debug traceability.

## 3. Files you own

New:
- `macro/macro-tokenize.js`
- `macro/macro-parse.js`
- `macro/macro-compile.js`
- `macro/macro-runtime.js`
- `macro/macro-builtins.js`
- `macro/macro-errors.js`
- `macro/macro-editor.js`

Existing:
- `js/glb/exportToDXF.js`
- optional export bridge files approved by orchestrator
- `.pcfx` scaffold docs or module stubs if included in this scope

## 4. Required use cases

### A. Coordinate-to-pipe translation
When coordinate info and line sizes are supplied, macro can create pipe runs.

### B. Programmatic component insertion
Macro can insert:
- pipe,
- elbow/bend,
- tee/branch,
- reducer,
- flange,
- valve,
- support,
using robust syntax.

### C. Programmatic modification
Macro can:
- move node,
- split segment,
- change route spec,
- replace component,
- delete component.

### D. Export
Macro-created models must export via the same canonical model path as interactive edits.

## 5. Two-layer syntax you must implement

### Layer 1 — human-friendly DSL
Example:
```txt
PIPE START 0,0,0 SIZE 6 RATING 150 SPEC CS150
LINE TO 5000,0,0
RISE 0,0,2500
INSERT VALVE TYPE GATE SIZE 6 RATING 150 AT LAST
INSERT FLANGE TYPE WN SIZE 6 RATING 150 AT LAST
```

### Layer 2 — compiled IR
```js
{
  version: 1,
  commands: [
    { type: 'ROUTE_START', payload: { x: 0, y: 0, z: 0, size: '6', rating: '150', spec: 'CS150' } },
    { type: 'ROUTE_SEGMENT_ADD', payload: { dx: 5000, dy: 0, dz: 0 } },
    { type: 'ROUTE_SEGMENT_ADD', payload: { dx: 0, dy: 0, dz: 2500 } },
    { type: 'INSERT_COMPONENT', payload: { component: 'VALVE', subtype: 'GATE', size: '6', rating: '150', at: 'LAST' } }
  ]
}
```

## 6. Syntax families to support

At minimum:
- `PIPE START`
- `LINE TO`
- `LINE BY`
- `RISE`
- `DROP`
- `INSERT VALVE`
- `INSERT FLANGE`
- `INSERT ELBOW`
- `INSERT TEE`
- `INSERT REDUCER`
- `MOVE NODE`
- `DELETE COMPONENT`
- `SET SPEC`

## 7. Critical snippets

### 7.1 Compile to IR, not direct execution
```js
export function compileMacro(ast) {
  return {
    version: 1,
    commands: ast.body.flatMap(node => compileNode(node)),
  };
}
```

### 7.2 Dry run support
```js
export function dryRun(ir, executor, seedState) {
  const state = structuredClone(seedState);
  const report = [];

  for (const cmd of ir.commands) {
    try {
      executor(state, cmd, { dryRun: true });
      report.push({ ok: true, type: cmd.type });
    } catch (err) {
      report.push({ ok: false, type: cmd.type, message: String(err?.message || err) });
      break;
    }
  }
  return report;
}
```

### 7.3 Runtime execution with trace
```js
export async function runMacro(ir, executor, emit) {
  const startedAt = performance.now();

  for (let i = 0; i < ir.commands.length; i++) {
    const command = ir.commands[i];
    executor(command);
    emit('debug:trace', {
      scope: 'macro',
      event: 'COMMAND_EXECUTED',
      index: i,
      commandType: command.type,
      ok: true,
    });
  }

  emit('debug:trace', {
    scope: 'macro',
    event: 'MACRO_COMPLETE',
    ok: true,
    durationMs: performance.now() - startedAt,
    count: ir.commands.length,
  });
}
```

### 7.4 Export bridge principle
```js
export function exportCanonicalModel(model, format) {
  switch (format) {
    case 'DXF': return exportToDXF(modelToExportComponents(model));
    case 'PCFX': return exportToPcfx(model);
    default: throw new Error(`Unsupported export format: ${format}`);
  }
}
```

## 8. Export requirements

### DXF
Must consume canonical model, not stale scene-only objects.

### `.pcfx`
If full implementation is not feasible in this phase, provide:
- schema stub,
- serialization contract,
- import/export interface,
- testable placeholder serializer using canonical model.

## 9. Safety rules

- No `eval`
- No direct JS execution from user macro text
- Tokenize and parse explicitly
- Report line/column on macro errors
- Support dry-run before commit
- Macro cancel must not leave partial corrupted state

## 10. Quantitative pass tests

### Compiler/runtime
- Valid macro fixture compile success: **100%**
- Invalid syntax fixture error localization accuracy (line-level): **100%**
- Dry-run mismatch detection before execution: **100%**
- Macro replay determinism on same seed state: **100%**

### Editing outcomes
- Coordinate-to-pipe macro generates expected segment count: **100%**
- Rise/drop commands generate correct Z delta with error **<= 1 mm**
- Programmatic component insert matches expected type/size/rating in fixture: **100%**
- 50-command macro executes without uncaught exception: **100%**

### Export
- DXF export from macro-authored model returns non-empty output: **100%**
- Exported model component count parity vs canonical model fixture: **100%**
- `.pcfx` stub serializer roundtrip on fixture preserves top-level counts: **100%** if included
- Export after macro + HUD mixed workflow completes without crash: **100%**

## 11. Suggested tests

- `tests/phase15-macro-compile.test.js`
- `tests/phase15-macro-runtime.test.js`
- `tests/phase15-export-bridge.test.js`

## 12. Expected outcome

After your branch merges:
- the app can generate and edit piping content programmatically,
- macros become a productivity layer rather than a risky side channel,
- export is aligned with canonical model state,
- future automation can target a stable DSL + IR.

## 13. Handoff notes for orchestrator

Provide:
- macro grammar summary
- supported statements list
- known unsupported edge cases
- final export compatibility notes


## 3A. Merge-governance rules you must follow

### Contract dependency
Do not finalize macro runtime until the orchestrator freezes:
- command IR contract
- executor API
- export input contract from canonical model
- macro debug trace schema

### Protected file handling
You do not own shell or protected core files.
Keep edits outside your owned macro/export modules unless an orchestrator-approved bridge is required.

### No bypass rule
Macros must not:
- manipulate scene/DOM directly,
- mutate canonical state directly,
- call export from transient scene state.

All macro actions compile to IR and execute through the same dispatcher/executor path as interactive edits.

## 7A. Critical markers for your branch

Before handoff, verify:
- macro compile output matches frozen IR contract
- dry-run detects invalid syntax/commands without mutating state
- execute path produces normal history records
- coordinate-to-pipe macros create canonical routes, not only visuals
- export reads canonical model after macro execution
- macro editor surface is gated off if not fully ready

## 9A. Required evidence artifacts

Attach:
1. touched-file list
2. macro IR contract revision used
3. pass log for macro/export tests
4. smoke evidence for:
   - parse/compile simple macro
   - dry-run invalid macro
   - execute route-building macro
   - insert valve/flange macro
   - export after macro execution
5. explicit statement that macro runtime does not bypass dispatcher or export canonical-state contract
