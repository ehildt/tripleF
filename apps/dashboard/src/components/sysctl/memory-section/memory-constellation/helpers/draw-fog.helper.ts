import type { ProjectedPoint } from '../MemoryConstellation.types';
import { withAlpha } from './with-alpha.helper';

/** Inner alpha of a fog field at its core (fades to 0 at the edge). */
const FOG_CORE_ALPHA = 0.14;

/** Draw a soft radial-gradient glow so a cluster reads as one dimension. */
export function drawFog(
  ctx: CanvasRenderingContext2D,
  center: ProjectedPoint,
  radius: number,
  color: string,
  opacity: number,
): void {
  const gradient = ctx.createRadialGradient(
    center.x,
    center.y,
    0,
    center.x,
    center.y,
    radius,
  );
  gradient.addColorStop(0, withAlpha(color, FOG_CORE_ALPHA * opacity));
  gradient.addColorStop(0.6, withAlpha(color, (FOG_CORE_ALPHA / 2) * opacity));
  gradient.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
}
