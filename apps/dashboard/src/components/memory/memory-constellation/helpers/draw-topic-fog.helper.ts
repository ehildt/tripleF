import type { TopicFog } from '../MemoryConstellation.types';
import { drawFog } from './draw-fog.helper';
import { projectPoint } from './project-point.helper';

/** Draw every topic's fog field behind the links/dots. */
export function drawTopicFog(
  ctx: CanvasRenderingContext2D,
  topicFog: readonly TopicFog[],
  yaw: number,
  pitch: number,
  fov: number,
  cx: number,
  cy: number,
  zoom: number,
  topicOpacity: ReadonlyMap<string, number>,
): void {
  for (const fog of topicFog) {
    const center = projectPoint(fog.center, yaw, pitch, fov, cx, cy, zoom);
    const radius = Math.max(24, fog.radius * center.scale * zoom);
    drawFog(ctx, center, radius, fog.color, topicOpacity.get(fog.key) ?? 1);
  }
}
