import * as THREE from "three";
export function routeModelToComponents(routes) {
  const components = [];

  routes.forEach(route => {
    const nodeIndex = route.nodes.reduce((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {});

    route.segments.forEach(seg => {
      const fromNode = nodeIndex[seg.from];
      const toNode = nodeIndex[seg.to];

      const comp = {
        id: seg.id,
        type: seg.kind || 'PIPE',
        geometry: {
          ep1: { x: fromNode.x, y: fromNode.y, z: fromNode.z },
          ep2: { x: toNode.x, y: toNode.y, z: toNode.z },
          bore: route.spec ? parseFloat(route.spec.size) * 25.4 : 100 // Approximation if size exists
        },
        attributes: {
          routeId: route.id,
          orientation: seg.orientation || 'SPATIAL',
          ...route.spec
        }
      };

      components.push(comp);
    });
  });

  return components;
}

export function rebuildDraftingModel(editorState, domain) {
  if (!editorState || !editorState.model || !editorState.model.routes) {
    return new THREE.Group();
  }
  const derivedComponents = routeModelToComponents(editorState.model.routes);
  return domain.buildGeometry(derivedComponents, {
    labels: true,
    symbols: true,
    source: 'route-engine',
  });
}

export function findRoute(state, routeId) {
  return state.model.routes.find(r => r.id === routeId);
}
