export function createExecutor(model, options = {}) {
  return function executor() {
    let state, cmd, isDryRun;

    // Handle overloaded call signature matching WI snippets
    // dryRun passes: (state, cmd, { dryRun: true })
    // runMacro passes: (command)
    if (arguments.length >= 2) {
        state = arguments[0];
        cmd = arguments[1];
        isDryRun = arguments[2]?.dryRun || false;
    } else {
        state = model;
        cmd = arguments[0];
        isDryRun = false;
    }

    if (!state.components) {
        state.components = [];
    }

    switch (cmd.type) {
      case 'ROUTE_START':
        state._lastNode = { ...cmd.payload };
        break;
      case 'ROUTE_SEGMENT_ADD':
        if (!state._lastNode) throw new Error('No active route to add segment to');
        state.components.push({
            type: 'PIPE',
            start: { ...state._lastNode },
            end: {
               x: state._lastNode.x + cmd.payload.dx,
               y: state._lastNode.y + cmd.payload.dy,
               z: state._lastNode.z + cmd.payload.dz,
            }
        });
        state._lastNode = {
            x: state._lastNode.x + cmd.payload.dx,
            y: state._lastNode.y + cmd.payload.dy,
            z: state._lastNode.z + cmd.payload.dz,
        };
        break;
      case 'INSERT_COMPONENT':
        if (cmd.payload.at === 'LAST' && state._lastNode) {
            state.components.push({
               type: cmd.payload.component,
               subtype: cmd.payload.subtype,
               position: { ...state._lastNode },
               size: cmd.payload.size,
               rating: cmd.payload.rating
            });
        }
        break;
      default:
        break;
    }
  };
}
