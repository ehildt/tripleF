import type { ClusterFog } from '../MemoryConstellation.types';
import { drawFog } from './draw-fog.helper';
import { projectPoint } from './project-point.helper';

/** Draw every cluster's fog field behind the links/dots. */
export function drawClusterFog(
  ctx: CanvasRenderingContext2D,
  clusterFog: readonly ClusterFog[],
  yaw: number,
  pitch: number,
  fov: number,
  cx: number,
  cy: number,
  zoom: number,
  clusterOpacity: ReadonlyMap<string, number>,
): void {
  for (const fog of clusterFog) {
    const center = projectPoint(fog.center, yaw, pitch, fov, cx, cy, zoom);
    const radius = Math.max(24, fog.radius * center.scale * zoom);
    drawFog(ctx, center, radius, fog.color, clusterOpacity.get(fog.key) ?? 1);
  }
}
