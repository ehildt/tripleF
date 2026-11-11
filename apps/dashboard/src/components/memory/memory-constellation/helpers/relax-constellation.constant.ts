import type { ConstellationEdge } from '../MemoryConstellation.types';

/** Static simulation ticks (no animation — run to a settled layout). */
export const RELAX_TICKS = 200;
/** Reduced tick budget for large scenes (5000 dots still settle, faster). */
export const RELAX_TICKS_LARGE = 60;
/** Node count above which the reduced tick budget applies. */
export const LARGE_SCENE_NODE_COUNT = 2000;

/** Intra-topic (leaf → hub) target distance — leaves orbit their main dot. */
const INTRA_DISTANCE = 40;
/** Cluster (hub → cluster hub) distance — wider than intra so category
 *  hubs sit outside their member topics' spherical blobs. */
const CLUSTER_DISTANCE = 140;
/** Community (hub → community hub) distance — between intra and cluster:
 *  the mid-tier dot settles inside the cluster halo, outside the topic blob. */
const COMMUNITY_DISTANCE = 110;

/** Fixed target distances; scored inter/sibling edges use cosine mapping. */
export const STRUCTURAL_LINK_DISTANCE: Record<
  Exclude<ConstellationEdge['kind'], 'inter' | 'sibling'>,
  number
> = {
  intra: INTRA_DISTANCE,
  cluster: CLUSTER_DISTANCE,
  community: COMMUNITY_DISTANCE,
  root: CLUSTER_DISTANCE,
};

/** Repulsion strength (negative = repel). */
export const CHARGE_STRENGTH = -30;
/** Collision radius (dot size) to prevent overlap. */
export const COLLIDE_RADIUS = 8;
