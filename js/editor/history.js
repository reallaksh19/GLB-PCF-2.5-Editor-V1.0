export function pushHistory(state) {
  if (!state.history) state.history = { past: [], future: [] };
  state.history.past.push(JSON.parse(JSON.stringify(state.model)));
  state.history.future = [];
  return state;
}
export function undo(state) {
  if (!state.history || !state.history.past.length) return state;
  state.history.future.push(JSON.parse(JSON.stringify(state.model)));
  state.model = state.history.past.pop();
  return state;
}
export function redo(state) {
  if (!state.history || !state.history.future.length) return state;
  state.history.past.push(JSON.parse(JSON.stringify(state.model)));
  state.model = state.history.future.pop();
  return state;
}
