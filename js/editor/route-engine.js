export function findRoute(state, routeId) {
  return state.model.routes.find(r => r.id === routeId);
}

export function appendNodeAndSegment(route, nextNode, segmentData) {
  route.nodes.push(nextNode);
  if (route.nodes.length > 1) {
    const prev = route.nodes[route.nodes.length - 2];
    route.segments.push({
      id: crypto.randomUUID(),
      from: prev.id,
      to: nextNode.id,
      ...segmentData
    });
  }
  return route;
}

export function routeModelToComponents(routes) {
  return routes.flatMap(route => route.segments.map(seg => {
    const ep1 = route.nodes.find(n => n.id === seg.from);
    const ep2 = route.nodes.find(n => n.id === seg.to);
    return { type: 'PIPE', geometry: { ep1, ep2, origin: ep1 } };
  }));
}
