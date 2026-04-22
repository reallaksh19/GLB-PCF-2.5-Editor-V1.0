import { tokenizeMacro } from './macro-tokenize.js';
import { parseMacro } from './macro-parse.js';
import { compileMacro } from './macro-compile.js';
import { runMacro, dryRun } from './macro-runtime.js';
import { createExecutor } from './macro-builtins.js';

export async function executeMacroText(text, model, emit) {
  try {
    const tokens = tokenizeMacro(text);
    const ast = parseMacro(tokens);
    const ir = compileMacro(ast);

    const executor = createExecutor(model);

    // Dry run
    const report = dryRun(ir, executor, model);
    const hasError = report.some(r => !r.ok);

    if (hasError) {
      throw new Error('Macro dry run failed: ' + report.find(r => !r.ok).message);
    }

    // Actual run
    await runMacro(ir, executor, emit);

    return { ok: true, ir };
  } catch (err) {
    emit('debug:trace', {
       scope: 'macro',
       event: 'MACRO_ERROR',
       message: err.message
    });
    return { ok: false, error: err };
  }
}
