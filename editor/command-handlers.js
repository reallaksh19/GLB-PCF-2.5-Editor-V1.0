import { findRoute } from './route-engine.js';

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}

export function appendNodeAndSegment(route, nextNode, segmentData) {
  route.nodes.push(nextNode);
  const segment = {
    id: generateId(),
    from: route.nodes[route.nodes.length - 2].id,
    to: nextNode.id,
    ...segmentData
  };
  route.segments.push(segment);
  return route;
}

export function addRouteSegment(state, command) {
  const { routeId, dx = 0, dy = 0, dz = 0 } = command.payload;
  const route = findRoute(state, routeId);
  if (!route) return;
  const lastNode = route.nodes[route.nodes.length - 1];

  const nextNode = {
    id: generateId(),
    x: lastNode.x + dx,
    y: lastNode.y + dy,
    z: lastNode.z + dz,
  };

  const orientation =
    dz !== 0 && dx === 0 && dy === 0 ? 'VERTICAL' :
    dz === 0 ? 'HORIZONTAL' :
    'SPATIAL';

  return appendNodeAndSegment(route, nextNode, { kind: 'PIPE', orientation });
}

export function startRoute(state, command) {
  const { x = 0, y = 0, z = 0, spec = { size: '6', rating: '150', material: 'CS' } } = command.payload;
  const id = command.payload.routeId || `R-${generateId().substring(0, 5)}`;
  const startNode = { id: `N-${generateId().substring(0, 5)}`, x, y, z };

  const newRoute = {
    id,
    nodes: [startNode],
    segments: [],
    spec
  };

  if (!state.model) state.model = { routes: [] };
  if (!state.model.routes) state.model.routes = [];

  state.model.routes.push(newRoute);
  return newRoute;
}

export function moveRouteNode(state, command) {
  const { routeId, nodeId, x, y, z } = command.payload;
  const route = findRoute(state, routeId);
  if (!route) return;
  const node = route.nodes.find(n => n.id === nodeId);
  if (node) {
    if (x !== undefined) node.x = x;
    if (y !== undefined) node.y = y;
    if (z !== undefined) node.z = z;
  }
}

export function deleteRoute(state, command) {
  const { routeId } = command.payload;
  if (!state.model || !state.model.routes) return;
  state.model.routes = state.model.routes.filter(r => r.id !== routeId);
}

export function splitRouteSegment(state, command) {
  const { routeId, segmentId, splitNode } = command.payload;
  const route = findRoute(state, routeId);
  if (!route) return;

  const segmentIndex = route.segments.findIndex(s => s.id === segmentId);
  if (segmentIndex === -1) return;

  const originalSegment = route.segments[segmentIndex];

  const newNode = {
    id: generateId(),
    ...splitNode
  };
  route.nodes.push(newNode);

  const newSegment1 = {
    ...originalSegment,
    id: generateId(),
    to: newNode.id
  };
  const newSegment2 = {
    ...originalSegment,
    id: generateId(),
    from: newNode.id
  };

  route.segments.splice(segmentIndex, 1, newSegment1, newSegment2);
}

export function editRouteSegment(state, command) {
  const { routeId, segmentId, updates } = command.payload;
  const route = findRoute(state, routeId);
  if (!route) return;

  const segment = route.segments.find(s => s.id === segmentId);
  if (segment) {
    Object.assign(segment, updates);
  }
}

export function insertComponent(state, command) {
  const { routeId, segmentId, componentData } = command.payload;
  // This modifies a segment to become a specific component or inserts a component in the route spec
  const route = findRoute(state, routeId);
  if (!route) return;

  const segment = route.segments.find(s => s.id === segmentId);
  if (segment) {
    segment.kind = componentData.type;
    Object.assign(segment, componentData);
  }
}

export function deleteComponent(state, command) {
  const { routeId, segmentId } = command.payload;
  const route = findRoute(state, routeId);
  if (!route) return;

  const segment = route.segments.find(s => s.id === segmentId);
  if (segment) {
    segment.kind = 'PIPE'; // Revert back to pipe
  }
}
