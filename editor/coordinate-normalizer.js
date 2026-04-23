import * as THREE from 'three';

/**
 * Scale coordinates from mm to scene units.
 * PCF/CAESAR: X = East, Y = North (horizontal), Z = Up (elevation).
 * Viewer axes (requested): X = North, Y = Up, Z = East.
 * So: threeX = caesarY, threeY = caesarZ, threeZ = caesarX
 */
export const SCALE = 1 / 1000;

export function toThree(pos) {
  if (!pos) return new THREE.Vector3(0, 0, 0);
  return new THREE.Vector3(
    pos.y * SCALE,
    pos.z * SCALE,
    pos.x * SCALE
  );
}

export function fromThree(vec3) {
  if (!vec3) return { x: 0, y: 0, z: 0 };
  return {
    x: vec3.z / SCALE,
    y: vec3.x / SCALE,
    z: vec3.y / SCALE
  };
}
