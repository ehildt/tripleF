import type { TaxonomyIconNode } from './taxonomy-icon-nodes.helper';
import { TAXONOMY_ICON_NODES } from './taxonomy-icon-nodes.helper';

/** Lucide icons live in a 24×24 viewBox. */
const LUCIDE_BOX = 24;

/** One combined Path2D per icon name (24-box coordinates), built lazily. */
const iconPathCache = new Map<string, Path2D>();

/**
 * Draw a taxonomy icon centered on a macro-node dot: translate to the dot
 * center, scale the 24-box into the target size, stroke in the node color.
 * The icon replaces the solid fill (the halo/rings render beneath it) —
 * physics, radius, and hit-testing are untouched. Unknown names no-op (the
 * caller falls back to the plain dot when the helper reports failure).
 * Returns true when the icon was drawn.
 */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  iconName: string,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number,
): boolean {
  const path = iconPath(iconName);
  if (!path) return false;
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  const k = size / LUCIDE_BOX;
  ctx.scale(k, k);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = opacity;
  ctx.stroke(path);
  ctx.restore();
  return true;
}

/** Combined cached Path2D of one icon (undefined for unknown names). */
function iconPath(name: string): Path2D | undefined {
  const cached = iconPathCache.get(name);
  if (cached) return cached;
  const tuples = TAXONOMY_ICON_NODES[name];
  if (!tuples) return undefined;
  const path = buildIconPath(tuples);
  iconPathCache.set(name, path);
  return path;
}

/** Merge one icon's tuples into a single Path2D (all subpaths stroke-only). */
function buildIconPath(tuples: readonly TaxonomyIconNode[]): Path2D {
  const path = new Path2D();
  for (const [tag, attrs] of tuples) {
    appendTuple(path, tag, attrs);
  }
  return path;
}

/** Append one Lucide tuple's geometry to the path. */
function appendTuple(
  path: Path2D,
  tag: string,
  attrs: Record<string, string | number>,
): void {
  const num = (key: string): number => Number(attrs[key] ?? 0);
  switch (tag) {
    case 'path':
      if (attrs.d) path.addPath(new Path2D(String(attrs.d)));
      break;
    case 'circle':
      path.arc(num('cx'), num('cy'), num('r'), 0, Math.PI * 2);
      break;
    case 'ellipse':
      path.ellipse(
        num('cx'),
        num('cy'),
        num('rx'),
        num('ry'),
        0,
        0,
        Math.PI * 2,
      );
      break;
    case 'rect':
      // Lucide uses plain rect or rx-rounded corners — the round corner is
      // cosmetic, a square corner degrades by pixels at constellation scale.
      path.rect(num('x'), num('y'), num('width'), num('height'));
      break;
    case 'line':
      path.moveTo(num('x1'), num('y1'));
      path.lineTo(num('x2'), num('y2'));
      break;
    case 'polygon':
    case 'polyline':
      appendPoints(path, String(attrs.points ?? ''), tag === 'polygon');
      break;
  }
}

/** Append a points-list ("x,y x,y …") as an open or closed polyline. */
function appendPoints(path: Path2D, points: string, close: boolean): void {
  const coords = points
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number))
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (coords.length === 0) return;
  path.moveTo(coords[0][0], coords[0][1]);
  for (const [x, y] of coords.slice(1)) path.lineTo(x, y);
  if (close) path.closePath();
}
