export function compileMacro(ast) {
  let lastPos = { x: 0, y: 0, z: 0 };

  function compileNode(node) {
    switch (node.type) {
      case 'PipeStart':
        lastPos = { x: node.payload.x, y: node.payload.y, z: node.payload.z };
        return { type: 'ROUTE_START', payload: node.payload };
      case 'LineTo': {
        const dx = node.payload.x - lastPos.x;
        const dy = node.payload.y - lastPos.y;
        const dz = node.payload.z - lastPos.z;
        lastPos = { x: node.payload.x, y: node.payload.y, z: node.payload.z };
        return { type: 'ROUTE_SEGMENT_ADD', payload: { dx, dy, dz } };
      }
      case 'LineBy':
      case 'Rise':
      case 'Drop':
        lastPos.x += node.payload.dx;
        lastPos.y += node.payload.dy;
        lastPos.z += node.payload.dz;
        return { type: 'ROUTE_SEGMENT_ADD', payload: node.payload };
      case 'Insert':
        return { type: 'INSERT_COMPONENT', payload: node.payload };
      case 'MoveNode':
        return { type: 'MOVE_NODE', payload: node.payload };
      case 'DeleteComponent':
        return { type: 'DELETE_COMPONENT', payload: node.payload };
      case 'SetSpec':
        return { type: 'SET_SPEC', payload: node.payload };
      default:
        throw new Error(`Unknown AST node type: ${node.type}`);
    }
  }

  return {
    version: 1,
    commands: ast.body.flatMap(node => compileNode(node)),
  };
}
