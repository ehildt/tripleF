import type {
  ConstellationNode,
  ConstellationPosition,
  DotTransition,
  OrbitCenter,
  ProjectedPoint,
} from '../MemoryConstellation.types';
import { interpolateTransitionPosition } from './interpolate-transition-position.helper';
import { orbitPosition } from './orbit-position.helper';
import { orbitScaleFor } from './orbit-scale.helper';
import { projectPoint } from './project-point.helper';

/** Leaf orbit speed (rad/s — ~0.15 ≈ one revolution per ~42s). */
const ORBIT_SPEED = 0.15;

/** Project one constellation node into 2D pixel space. */
export function mapNodeToProjected(
  node: ConstellationNode,
  positions: Map<string, ConstellationPosition>,
  transitions: Map<string, DotTransition>,
  orbitCenters: Map<string, OrbitCenter>,
  nowMs: number,
  time: number,
  viewCx: number,
  viewCy: number,
  yaw: number,
  pitch: number,
  fov: number,
  zoom: number,
): ProjectedPoint {
  const pos = positions.get(node.id);
  if (!pos) return { x: viewCx, y: viewCy, scale: 1 };
  const transition = transitions.get(node.id);
  const animated = interpolateTransitionPosition(transition, pos, nowMs);
  // Leaves slowly orbit their main dot (hubs and synthetic dots stay put).
  const orbit = orbitCenters.get(node.id);
  const world = orbit
    ? orbitPosition(
        animated,
        orbit.center,
        time * ORBIT_SPEED + orbit.phase,
        orbitScaleFor(transition, nowMs),
      )
    : animated;
  return projectPoint(world, yaw, pitch, fov, viewCx, viewCy, zoom);
}
