import type {
  PreparedLink,
  ProjectedPoint,
} from '../MemoryConstellation.types';
import { drawDroplet } from './draw-droplet.helper';

/** Gray for hierarchy edges (category → ZERO, sub-category → category,
 *  sibling sub-categories) and long-distance (inter-cluster) edges. */
const GRAY_LINK_COLOR = '#6b7280';

/** Light-droplet travel speed (cycles per second along a gray edge). */
const DROPLET_SPEED = 0.4;
/** Phase offset per edge index so droplets don't sync. */
const DROPLET_PHASE_STEP = 0.2;
/** Number of light droplets traveling along each gray edge. */
const DROPLET_COUNT = 3;
/** Suggested (topical) edges render droplets at this fraction of the pulse alpha. */
const SUGGESTED_DROPLET_FACTOR = 0.6;

/** Edge kinds drawn as gray lines (hierarchy + long-distance). */
const GRAY_KINDS = new Set(['inter', 'sibling', 'community', 'root']);
/** Edge kinds drawn dashed (long-distance + root). */
const DASHED_KINDS = new Set(['inter', 'root']);
/** Edge kinds that carry traveling light droplets. */
const DROPLET_KINDS = new Set(['inter', 'sibling', 'community', 'root']);

/** Draw one link edge (projected quadratic curve, opacity by score). */
export function drawLink(
  ctx: CanvasRenderingContext2D,
  link: PreparedLink,
  projected: readonly ProjectedPoint[],
  opacity: number,
  color: string,
  time: number,
  index: number,
): void {
  const a = projected[link.a];
  const b = projected[link.b];
  const isGray = GRAY_KINDS.has(link.kind);
  const isDashed = DASHED_KINDS.has(link.kind);
  // Hierarchy + long-distance edges are gray; intra (leaf → main dot) edges
  // stay in the cluster color. Suggested edges use a finer dash.
  let dashPattern: number[] = [];
  if (isDashed) {
    dashPattern = link.suggested ? [2, 4] : [4, 4];
  }
  ctx.strokeStyle = isGray ? GRAY_LINK_COLOR : color;
  ctx.setLineDash(dashPattern);
  ctx.globalAlpha = link.alpha * opacity;
  ctx.lineWidth = 1;
  const midX = (a.x + b.x) / 2 + (b.y - a.y) * 0.08;
  const midY = (a.y + b.y) / 2 - (b.x - a.x) * 0.08;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.quadraticCurveTo(midX, midY, b.x, b.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // Light droplets: pulses traveling along the gray edges, colored by the
  // source main dot (the cluster/category hub color) and fading in at the
  // source and out at the target.
  if (DROPLET_KINDS.has(link.kind)) {
    for (let j = 0; j < DROPLET_COUNT; j++) {
      const t =
        (time * DROPLET_SPEED +
          index * DROPLET_PHASE_STEP +
          j / DROPLET_COUNT) %
        1;
      const mt = 1 - t;
      const x = mt * mt * a.x + 2 * mt * t * midX + t * t * b.x;
      const y = mt * mt * a.y + 2 * mt * t * midY + t * t * b.y;
      const pulse = Math.sin(Math.PI * t);
      const alpha =
        pulse *
        opacity *
        (0.5 + 0.5 * (link.score ?? 0.5)) *
        (link.suggested ? SUGGESTED_DROPLET_FACTOR : 1);
      drawDroplet(ctx, x, y, alpha, color);
    }
  }
}
