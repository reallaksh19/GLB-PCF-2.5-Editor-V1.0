import { CommandTypes } from './command-types.js';
import { history } from './history.js';
import * as handlers from './command-handlers.js';

export class CommandExecutor {
  constructor(state, domain) {
    this.state = state;
    this.domain = domain;
  }

  execute(command) {
    // Record history snapshot before mutation
    if (this.state.model && this.state.model.routes) {
      history.push(this.state.model.routes);
    }

    switch (command.type) {
      case CommandTypes.ROUTE_START:
        handlers.startRoute(this.state, command);
        break;
      case CommandTypes.ROUTE_SEGMENT_ADD:
        handlers.addRouteSegment(this.state, command);
        break;
      case CommandTypes.ROUTE_SEGMENT_EDIT:
        handlers.editRouteSegment(this.state, command);
        break;
      case CommandTypes.ROUTE_NODE_MOVE:
        handlers.moveRouteNode(this.state, command);
        break;
      case CommandTypes.ROUTE_SPLIT_SEGMENT:
        handlers.splitRouteSegment(this.state, command);
        break;
      case CommandTypes.ROUTE_DELETE:
        handlers.deleteRoute(this.state, command);
        break;
      case CommandTypes.INSERT_COMPONENT:
        handlers.insertComponent(this.state, command);
        break;
      case CommandTypes.DELETE_COMPONENT:
        handlers.deleteComponent(this.state, command);
        break;
      default:
        console.warn(`Unknown command type: ${command.type}`);
    }

    // Trigger geometry regeneration if needed
    // Assuming domain exposes an update or rebuild method
    // In actual implementation, we might call rebuildDraftingModel here or emit an event
  }

  undo() {
    if (history.canUndo() && this.state.model) {
      const prevState = history.undo(this.state.model.routes);
      this.state.model.routes = prevState;
    }
  }

  redo() {
    if (history.canRedo() && this.state.model) {
      const nextState = history.redo(this.state.model.routes);
      this.state.model.routes = nextState;
    }
  }
}
