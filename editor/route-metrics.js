export function segmentLength3D(seg, nodeIndex) {
  const a = nodeIndex[seg.from];
  const b = nodeIndex[seg.to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
