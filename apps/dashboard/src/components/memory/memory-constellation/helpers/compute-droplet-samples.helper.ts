import type { PreparedLink } from '../MemoryConstellation.types';
import { dropletCount } from './droplet-count.helper';

/** Light-droplet base travel speed (cycles per second along a gray edge). */
const DROPLET_SPEED = 0.4;
/** Per-edge phase offset so droplets don't sync across edges. */
export const DROPLET_PHASE_STEP = 0.2;
/** Speed spread: each droplet runs at 0.6×–1.4× the base speed. */
const DROPLET_SPEED_SPREAD = 0.8;

/** One traveling light droplet on an edge for this frame. */
export interface DropletSample {
  /** Normalized position along the curve from end A (0) to end B (1). */
  u: number;
  /** Final draw opacity (pulse + score + brightness, link opacity included). */
  alpha: number;
  /** Flow direction: forward = A→B, reverse = B→A. */
  forward: boolean;
  /** The droplet's color — the endpoint dot's color it departs from. */
  color: string;
}

/**
 * Compute one edge's droplets for the current frame. Slots alternate
 * direction: half the traffic flows A→B in the A-end's dot color, half flows
 * B→A in the B-end's color — relations between topics read as two-way
 * traffic with a color per origin. Deterministic for a given (link, time,
 * index): the per-droplet constants derive from a seeded pseudo-random.
 */
export function computeDropletSamples(
  link: PreparedLink,
  time: number,
  index: number,
  opacity: number,
  aColor: string,
  bColor: string,
): DropletSample[] {
  const count = dropletCount(link.score);
  const samples: DropletSample[] = [];
  for (let j = 0; j < count; j++) {
    const forward = j % 2 === 0;
    // Per-droplet constants (deterministic from edge + slot): a unique speed,
    // a random starting position along its travel, and a slight brightness
    // variation so the pulses drift naturally instead of marching in
    // lockstep.
    const seed = index * 1009.7 + j * 31.7;
    const speed =
      DROPLET_SPEED *
      (1 -
        DROPLET_SPEED_SPREAD / 2 +
        DROPLET_SPEED_SPREAD * seededRandom(seed));
    const phase = seededRandom(seed + 5.3);
    const brightness = 0.7 + 0.6 * seededRandom(seed + 9.1);
    // Travel progress within one cycle of that droplet's own direction
    // (0 = departure end, 1 = arrival end).
    const travel = (time * speed + index * DROPLET_PHASE_STEP + phase) % 1;
    const pulse = Math.sin(Math.PI * travel);
    samples.push({
      u: forward ? travel : 1 - travel,
      alpha: pulse * opacity * (0.5 + 0.5 * (link.score ?? 0.5)) * brightness,
      forward,
      color: forward ? aColor : bColor,
    });
  }
  return samples;
}

/** Deterministic pseudo-random in [0, 1) from a numeric seed. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
