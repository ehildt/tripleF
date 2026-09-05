import type { ProjectedPoint } from '../MemoryConstellation.types';
import { computeNodeRadius } from './compute-node-radius.helper';
import { drawIcon } from './draw-icon.helper';
import { heatColor } from './heat-color.helper';
import { lightenColor } from './lighten-color.helper';
import { withAlpha } from './with-alpha.helper';

/** Neutral gray for the multi-leaf ring indicator. */
const RING_COLOR = '#94a3b8';
/** Black pulse ring for memory-rot (superseded) and friction dots. */
const PULSE_COLOR = '#000000';
/** Gap (px) between the dot edge and the first ring. */
export const RING_GAP = 3;
/** Gap (px) between the two rings. */
export const RING_SPACING = 2;

/** Everything drawNode needs to paint one dot. */
export interface DrawNodeParams {
  /** Index into the projected point list. */
  index: number;
  projected: readonly ProjectedPoint[];
  /** Current camera zoom. */
  zoom: number;
  /** Pointer hovers this dot. */
  isHovered: boolean;
  /** The dot is its topic's main dot. */
  isHub: boolean;
  /** Edge degree of this dot (drives size + glow). */
  linkCount: number;
  /** Highest edge degree in the scene (normalizes the heat). */
  maxLinkCount: number;
  /** Cluster color of the dot. */
  color: string;
  /** Scene time (s) — drives the hub halo pulse. */
  time: number;
  /** The dot is a collapsed-topic category dot. */
  isTopic: boolean;
  /** The dot is the ZERO root anchor. */
  isRoot: boolean;
  /** Members folded into a collapsed category dot (0 = not a category dot). */
  memberCount: number;
  /** Opacity multiplier (zoom focus + transitions). */
  opacity: number;
  /** The dot is contested (open friction) — pulses black. */
  isFriction: boolean;
  /** The dot is stale (superseded by a reflection winner) — pulses black. */
  isSuperseded: boolean;
  /** Curated taxonomy icon name — macro-node dots render it in place of the opaque fill. */
  icon?: string;
}

/** Draw one node dot (topic-colored, sized by depth + link count). */
export function drawNode(
  ctx: CanvasRenderingContext2D,
  params: DrawNodeParams,
): void {
  const {
    index,
    projected,
    zoom,
    isHovered,
    isHub,
    linkCount,
    maxLinkCount,
    color,
    time,
    isTopic,
    isRoot,
    memberCount,
    opacity,
    isFriction,
    isSuperseded,
    icon,
  } = params;
  const p = projected[index];
  const heat = heatColor(Math.sqrt(linkCount / maxLinkCount));
  const r = computeNodeRadius(linkCount, isHub, isTopic, isRoot, p.scale, zoom);
  // Leaf dots render a shade lighter than their hub so the main dot stands out.
  const dotColor = isHub || isTopic ? color : lightenColor(color, 0.35);
  const isMultiLeaf = isTopic && memberCount > 1;

  // The ZERO root anchor fades from its center outward — an interpolated
  // color with no hard edge, so it reads as the scene's origin rather than
  // a solid dot.
  if (isRoot) {
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    gradient.addColorStop(0, withAlpha(color, 1));
    gradient.addColorStop(1, withAlpha(color, 0));
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.globalAlpha = (isHovered ? 1 : 0.75) * opacity;
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }

  // Hub glow: a soft radial halo that fades out from the dot edge — the
  // group's main dot radiates without a hard edge.
  if (isHub || isTopic) {
    const pulse = 1 + 0.2 * Math.sin(time * 1.5);
    const haloR = r * 2.5 * pulse;
    const gradient = ctx.createRadialGradient(p.x, p.y, r, p.x, p.y, haloR);
    gradient.addColorStop(0, withAlpha(color, 0.2));
    gradient.addColorStop(1, withAlpha(color, 0));
    ctx.beginPath();
    ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.globalAlpha = opacity;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fillStyle = dotColor;
  ctx.globalAlpha = (isHovered ? 1 : 0.75) * opacity;
  ctx.fill();
  if (isTopic) {
    ctx.strokeStyle = dotColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.9 * opacity;
    ctx.stroke();
  }
  // Icon overlay: macro-nodes with a curated icon render it in place of the
  // opaque dot (the halo above stays alive underneath — animations intact).
  if (icon) {
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = withAlpha('#0b0f19', 0.85 * opacity);
    ctx.fill();
    drawIcon(ctx, icon, p.x, p.y, r * 1.7, lightenColor(color, 0.55), opacity);
  }
  // Multi-leaf indicator: two slim grayed rings with a small gap between
  // them — a collapsed category dot holding more than one member.
  if (isMultiLeaf) {
    ctx.strokeStyle = RING_COLOR;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6 * opacity;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r + RING_GAP, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x, p.y, r + RING_GAP + RING_SPACING, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Memory rot (superseded) + friction: a black pulse ring that expands and
  // fades — a warning that this dot is stale or contested.
  if (isFriction || isSuperseded) {
    const pulse = (time * 0.8) % 1;
    const ringR = r + 2 + pulse * r * 2.2;
    ctx.strokeStyle = withAlpha(PULSE_COLOR, (1 - pulse) * 0.7);
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Heat shadow: a soft glow for hovered/hub dots.
  if (isHovered || isHub) {
    ctx.shadowColor = heat;
    ctx.shadowBlur = isHub ? 16 : 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}
