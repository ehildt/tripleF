import type {
  ConstellationPosition,
  ProjectedPoint,
} from '../MemoryConstellation.types';

/** Yaw (around Y) then pitch (around X), then perspective projection. */
export function projectPoint(
  p: ConstellationPosition,
  yaw: number,
  pitch: number,
  fov: number,
  cx: number,
  cy: number,
  zoom: number,
): ProjectedPoint {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = p.x * cosY + p.z * sinY;
  const z1 = -p.x * sinY + p.z * cosY;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const y1 = p.y * cosP - z1 * sinP;
  const z2 = p.y * sinP + z1 * cosP;
  const scale = fov / (fov + z2);
  return { x: cx + x1 * scale * zoom, y: cy + y1 * scale * zoom, scale };
}
