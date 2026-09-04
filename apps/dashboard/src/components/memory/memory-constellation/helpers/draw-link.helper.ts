import type {
  PreparedLink,
  ProjectedPoint,
} from '../MemoryConstellation.types';
import { computeDropletSamples } from './compute-droplet-samples.helper';
import { drawDroplet } from './draw-droplet.helper';

/** Gray for hierarchy edges (category → ZERO, sub-category → category,
 *  sibling sub-categories) and long-distance (inter-topic) edges. */
const GRAY_LINK_COLOR = '#6b7280';

/** Warning orange for friction (contested) edges — the reflection pass's
 *  open conflict pairs, drawn distinct from the semantic link graph. */
const FRICTION_LINK_COLOR = '#ff9933';

/** Edge kinds drawn as gray lines (hierarchy + long-distance). */
const GRAY_KINDS = new Set(['inter', 'sibling', 'cluster', 'root']);
/** Edge kinds drawn dashed (long-distance + root). */
const DASHED_KINDS = new Set(['inter', 'root']);
/** Edge kinds that carry traveling light droplets. */
const DROPLET_KINDS = new Set(['inter', 'sibling', 'cluster', 'root']);

/**
 * Draw one link edge (projected quadratic curve, opacity by score). Light
 * droplets flow in BOTH directions: A→B in the A-end dot's color, B→A in the
 * B-end dot's color — relations read as two-way traffic with a color per
 * origin.
 */
export function drawLink(
  ctx: CanvasRenderingContext2D,
  link: PreparedLink,
  projected: readonly ProjectedPoint[],
  opacity: number,
  aColor: string,
  bColor: string,
  time: number,
  index: number,
): void {
  const a = projected[link.a];
  const b = projected[link.b];
  const midX = (a.x + b.x) / 2 + (b.y - a.y) * 0.08;
  const midY = (a.y + b.y) / 2 - (b.x - a.x) * 0.08;

  // Weak links: no line at all — just the traveling droplets, so the relation
  // reads as a faint gray pulse between the nodes rather than a solid
  // connection. Undirected by nature: neutral gray in both directions.
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
  let strokeColor = aColor;
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

  // Light droplets on the gray edges: two-way traffic colored by each
  // endpoint's dot, fading in at the origin and out at the destination.
  if (DROPLET_KINDS.has(link.kind)) {
    drawDroplets(
      ctx,
      a,
      b,
      midX,
      midY,
      link,
      opacity,
      aColor,
      bColor,
      time,
      index,
    );
  }
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
  aColor: string,
  bColor: string,
  time: number,
  index: number,
): void {
  for (const sample of computeDropletSamples(
    link,
    time,
    index,
    opacity,
    aColor,
    bColor,
  )) {
    const u = sample.u;
    const mu = 1 - u;
    const x = mu * mu * a.x + 2 * mu * u * midX + u * u * b.x;
    const y = mu * mu * a.y + 2 * mu * u * midY + u * u * b.y;
    drawDroplet(ctx, x, y, sample.alpha, sample.color);
  }
}
