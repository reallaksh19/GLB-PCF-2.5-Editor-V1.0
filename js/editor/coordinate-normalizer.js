export function normalizeCoordinates(points) {
  return points.map(p => ({
    ...p,
    x: isNaN(p.x) ? 0 : p.x,
    y: isNaN(p.y) ? 0 : p.y,
    z: isNaN(p.z) ? 0 : p.z
  }));
}
