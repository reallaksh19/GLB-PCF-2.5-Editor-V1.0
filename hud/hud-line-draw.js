export function commitLineFromHud(hud, editor) {
  const len = Number(hud.draft?.lengthMm);
  if (!Number.isFinite(len) || len <= 0) {
    // Assuming setHudError exists or will be provided via hud context
    if (typeof hud.setError === 'function') {
      return hud.setError('Length must be > 0');
    }
    return null;
  }

  const delta = axisLockedDelta(hud.axisLock, len, hud.draft?.sign || 1);

  const command = {
    id: crypto.randomUUID(),
    type: 'ROUTE_SEGMENT_ADD',
    payload: {
      routeId: hud.draft.routeId,
      dx: delta.dx,
      dy: delta.dy,
      dz: delta.dz,
    },
    meta: { ts: Date.now(), source: 'hud-enter' }
  };

  return editor.executeCommand(command);
}

function axisLockedDelta(axisLock, len, sign) {
  const delta = { dx: 0, dy: 0, dz: 0 };
  const val = len * sign;
  if (axisLock === 'X') delta.dx = val;
  else if (axisLock === 'Y') delta.dy = val;
  else if (axisLock === 'Z') delta.dz = val;
  return delta;
}
