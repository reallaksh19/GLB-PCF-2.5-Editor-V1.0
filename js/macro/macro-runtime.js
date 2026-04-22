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
