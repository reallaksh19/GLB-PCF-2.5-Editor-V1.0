import { CommandTypes } from './command-types.js';
import * as handlers from './command-handlers.js';
import { pushHistory } from './history.js';

export function executeCommand(state, command) {
  if (!state.model) state.model = { routes: [] };
  pushHistory(state);
  switch (command.type) {
    case CommandTypes.ROUTE_START: handlers.startRoute(state, command); break;
    case CommandTypes.ROUTE_SEGMENT_ADD: handlers.addRouteSegment(state, command); break;
    case CommandTypes.ROUTE_NODE_MOVE: handlers.moveRouteNode(state, command); break;
    case CommandTypes.ROUTE_SEGMENT_EDIT: handlers.editRouteSegment(state, command); break;
    case CommandTypes.ROUTE_SPLIT_SEGMENT: handlers.splitRouteSegment(state, command); break;
    case CommandTypes.ROUTE_DELETE: handlers.deleteRoute(state, command); break;
    case CommandTypes.INSERT_COMPONENT: handlers.insertComponent(state, command); break;
    case CommandTypes.DELETE_COMPONENT: handlers.deleteComponent(state, command); break;
  }
  return state;
}
