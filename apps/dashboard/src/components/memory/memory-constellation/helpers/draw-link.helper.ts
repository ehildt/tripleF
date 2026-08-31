import type {
  PreparedLink,
  ProjectedPoint,
} from '../MemoryConstellation.types';
import { drawDroplet } from './draw-droplet.helper';
import { dropletCount } from './droplet-count.helper';

/** Gray for hierarchy edges (category → ZERO, sub-category → category,
 *  sibling sub-categories) and long-distance (inter-topic) edges. */
const GRAY_LINK_COLOR = '#6b7280';

/** Warning orange for friction (contested) edges — the reflection pass's
 *  open conflict pairs, drawn distinct from the semantic link graph. */
const FRICTION_LINK_COLOR = '#ff9933';

/** Light-droplet base travel speed (cycles per second along a gray edge). */
const DROPLET_SPEED = 0.4;
/** Per-edge phase offset so droplets don't sync across edges. */
const DROPLET_PHASE_STEP = 0.2;
/** Speed spread: each droplet runs at 0.6×–1.4× the base speed. */
const DROPLET_SPEED_SPREAD = 0.8;

/** Edge kinds drawn as gray lines (hierarchy + long-distance). */
const GRAY_KINDS = new Set(['inter', 'sibling', 'cluster', 'root']);
/** Edge kinds drawn dashed (long-distance + root). */
const DASHED_KINDS = new Set(['inter', 'root']);
/** Edge kinds that carry traveling light droplets. */
const DROPLET_KINDS = new Set(['inter', 'sibling', 'cluster', 'root']);

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
  const midX = (a.x + b.x) / 2 + (b.y - a.y) * 0.08;
  const midY = (a.y + b.y) / 2 - (b.x - a.x) * 0.08;

  // Weak links: no line at all — just the traveling droplets, so the relation
  // reads as a faint gray pulse between the nodes rather than a solid
  // connection.
  if (link.weak) {
    drawDroplets(
      ctx,
      a,
      b,
      midX,
      midY,
      link,
      opacity,
      GRAY_LINK_COLOR,
      time,
      index,
    );
    return;
  }

  const isGray = GRAY_KINDS.has(link.kind);
  const isFriction = link.kind === 'friction';
  const isDashed = DASHED_KINDS.has(link.kind);
  // Hierarchy + long-distance edges are gray; intra (leaf → main dot) edges
  // stay in the topic color. Friction edges are warning-orange and dashed
  // — a conflict, not a relationship.
  let dashPattern: number[] = [];
  if (isDashed) {
    dashPattern = [4, 4];
  } else if (isFriction) {
    dashPattern = [6, 4];
  }
  let strokeColor = color;
  if (isFriction) strokeColor = FRICTION_LINK_COLOR;
  else if (isGray) strokeColor = GRAY_LINK_COLOR;
  ctx.strokeStyle = strokeColor;
  ctx.setLineDash(dashPattern);
  ctx.globalAlpha = link.alpha * opacity;
  ctx.lineWidth = isFriction ? 1.5 : 1;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.quadraticCurveTo(midX, midY, b.x, b.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // Light droplets: pulses traveling along the gray edges, colored by the
  // source main dot (the topic/category hub color) and fading in at the
  // source and out at the target.
  if (DROPLET_KINDS.has(link.kind)) {
    drawDroplets(ctx, a, b, midX, midY, link, opacity, color, time, index);
  }
}

/** Deterministic pseudo-random in [0, 1) from a numeric seed. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Traveling light droplets along a (possibly invisible) edge curve. */
function drawDroplets(
  ctx: CanvasRenderingContext2D,
  a: ProjectedPoint,
  b: ProjectedPoint,
  midX: number,
  midY: number,
  link: PreparedLink,
  opacity: number,
  color: string,
  time: number,
  index: number,
): void {
  const count = dropletCount(link.score);
  for (let j = 0; j < count; j++) {
    // Per-droplet constants (deterministic from edge + slot): a unique speed,
    // a random starting position, and a slight brightness variation so the
    // pulses drift naturally instead of marching in lockstep.
    const seed = index * 1009.7 + j * 31.7;
    const speed =
      DROPLET_SPEED *
      (1 -
        DROPLET_SPEED_SPREAD / 2 +
        DROPLET_SPEED_SPREAD * seededRandom(seed));
    const phase = seededRandom(seed + 5.3);
    const brightness = 0.7 + 0.6 * seededRandom(seed + 9.1);
    const t = (time * speed + index * DROPLET_PHASE_STEP + phase) % 1;
    const mt = 1 - t;
    const x = mt * mt * a.x + 2 * mt * t * midX + t * t * b.x;
    const y = mt * mt * a.y + 2 * mt * t * midY + t * t * b.y;
    const pulse = Math.sin(Math.PI * t);
    const alpha =
      pulse * opacity * (0.5 + 0.5 * (link.score ?? 0.5)) * brightness;
    drawDroplet(ctx, x, y, alpha, color);
  }
}
