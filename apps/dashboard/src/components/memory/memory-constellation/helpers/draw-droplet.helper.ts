import { withAlpha } from './with-alpha.helper';

/** Droplet core radius (screen px). */
const DROPLET_RADIUS = 0.8;
/** Droplet glow radius (screen px). */
const DROPLET_GLOW_RADIUS = 0.8;
/** Droplet color when no main-dot color is supplied. */
const DEFAULT_DROPLET_COLOR = '#ffffff';

/** Draw a soft glowing light droplet at a point on a gray edge. */
export function drawDroplet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  alpha: number,
  color: string = DEFAULT_DROPLET_COLOR,
): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, DROPLET_GLOW_RADIUS);
  gradient.addColorStop(0, withAlpha(color, alpha));
  gradient.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, DROPLET_GLOW_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = withAlpha(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, DROPLET_RADIUS, 0, Math.PI * 2);
  ctx.fill();
}
