import { findRoute, appendNodeAndSegment } from './route-engine.js';

export function addRouteSegment(state, command) {
  const { routeId, dx = 0, dy = 0, dz = 0 } = command.payload;
  const route = findRoute(state, routeId);
  if (!route || !route.nodes.length) return state;
  const lastNode = route.nodes[route.nodes.length - 1];
  const nextNode = { id: crypto.randomUUID(), x: lastNode.x + dx, y: lastNode.y + dy, z: lastNode.z + dz };
  const orientation = dz !== 0 && dx === 0 && dy === 0 ? 'VERTICAL' : dz === 0 ? 'HORIZONTAL' : 'SPATIAL';
  appendNodeAndSegment(route, nextNode, { kind: 'PIPE', orientation });
  return state;
}

export function startRoute(state, command) {
  const { routeId, startNode, spec = { size: '6', rating: '150', material: 'CS' } } = command.payload;
  state.model.routes.push({ id: routeId || crypto.randomUUID(), nodes: [startNode], segments: [], spec });
  return state;
}

export function moveRouteNode(state, command) {
  const { routeId, nodeId, newCoords } = command.payload;
  const route = findRoute(state, routeId);
  if (!route) return state;
  const node = route.nodes.find(n => n.id === nodeId);
  if (node) { Object.assign(node, newCoords); }
  return state;
}

export function editRouteSegment(state, command) {
  const route = findRoute(state, command.payload.routeId);
  if (!route) return state;
  const segment = route.segments.find(s => s.id === command.payload.segmentId);
  if (segment) Object.assign(segment, command.payload.newProps);
  return state;
}

export function splitRouteSegment(state, command) {
  const route = findRoute(state, command.payload.routeId);
  if (!route) return state;
  const segmentIndex = route.segments.findIndex(s => s.id === command.payload.segmentId);
  if (segmentIndex !== -1) {
    const oldSegment = route.segments[segmentIndex];
    const newNode = command.payload.newNode;
    route.nodes.push(newNode);
    const newSegment1 = { ...oldSegment, id: crypto.randomUUID(), to: newNode.id };
    const newSegment2 = { ...oldSegment, id: crypto.randomUUID(), from: newNode.id };
    route.segments.splice(segmentIndex, 1, newSegment1, newSegment2);
  }
  return state;
}

export function deleteRoute(state, command) {
  state.model.routes = state.model.routes.filter(r => r.id !== command.payload.routeId);
  return state;
}

export function insertComponent(state, command) {
  const route = findRoute(state, command.payload.routeId);
  if (route) {
    // Add component logic, for example to a spec list
    route.components = route.components || [];
    route.components.push(command.payload.component);
  }
  return state;
}

export function deleteComponent(state, command) {
  const route = findRoute(state, command.payload.routeId);
  if (route && route.components) {
    route.components = route.components.filter(c => c.id !== command.payload.componentId);
  }
  return state;
}
