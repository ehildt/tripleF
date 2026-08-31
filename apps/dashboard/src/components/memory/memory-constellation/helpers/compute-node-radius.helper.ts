/** Base radius for a leaf dot (before the main-dot 50% boost). */
const LEAF_BASE_R = 4;
/** Extra radius per link (capped). */
const LINK_RADIUS = 0.3;
/** Maximum link-driven radius. */
const LINK_RADIUS_CAP = 4;
/** Root dot base radius. */
const ROOT_BASE_R = 9;
/** Main-dot size boost over leaves. */
const MAIN_DOT_SCALE = 1.5;

/**
 * Screen-space radius of a node dot: leaf dots grow with their edge degree,
 * main dots (hubs, category dots, root) are 50% larger, and the root has a
 * fixed base. Scaled by the projection depth and clamped zoom.
 */
export function computeNodeRadius(
  linkCount: number,
  isHub: boolean,
  isTopic: boolean,
  isRoot: boolean,
  scale: number,
  zoom: number,
): number {
  let baseR = LEAF_BASE_R + Math.min(linkCount * LINK_RADIUS, LINK_RADIUS_CAP);
  if (isRoot) baseR = ROOT_BASE_R;
  if (isHub || isTopic || isRoot) baseR *= MAIN_DOT_SCALE;
  return Math.max(2, baseR * scale * Math.min(zoom, 4));
}
