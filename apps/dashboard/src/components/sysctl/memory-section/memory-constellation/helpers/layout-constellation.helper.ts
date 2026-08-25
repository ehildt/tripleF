import type {
  ConstellationCluster,
  ConstellationNode,
  ConstellationPosition,
} from '../MemoryConstellation.types';
import { hashNodeId } from './hash-node-id.helper';

export interface ConstellationLayout {
  /** World position of every node id (3D). */
  positions: Map<string, ConstellationPosition>;
  /** World position of every cluster centroid (3D). */
  centroids: Map<string, ConstellationPosition>;
}

/** Vertical spacing between cluster centroids (z axis). */
const CLUSTER_Z_SPACING = 70;

/**
 * Deterministic 3D layout: cluster centroids sit on a ring in the x-y plane
 * and are spread along the z axis, and each cluster's members scatter in a
 * disk around their centroid with a small z jitter (seeded by the node id
 * hash). No force simulation, no projection — the meaning lives in the
 * clusters and links, not the coordinates.
 */
export function layoutConstellation(
  nodes: readonly ConstellationNode[],
  clusters: readonly ConstellationCluster[],
): ConstellationLayout {
  const positions = new Map<string, ConstellationPosition>();
  const centroids = new Map<string, ConstellationPosition>();
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const clusterRingRadius = Math.sqrt(Math.max(nodes.length, 1)) * 60;

  // Clusters containing an anchored node (e.g. the cognition profile hub)
  // sit at the origin — the source the other clusters orbit around.
  const anchoredClusterKeys = new Set(
    clusters
      .filter((cluster) =>
        cluster.memberIds.some((id) => nodeById.get(id)?.anchorToOrigin),
      )
      .map((cluster) => cluster.key),
  );

  clusters.forEach((cluster, clusterIndex) => {
    const isAnchored = anchoredClusterKeys.has(cluster.key);
    const angle = (clusterIndex / Math.max(clusters.length, 1)) * Math.PI * 2;
    const centroid = isAnchored
      ? { x: 0, y: 0, z: 0 }
      : {
          x: Math.cos(angle) * clusterRingRadius,
          y: Math.sin(angle) * clusterRingRadius,
          z: (clusterIndex - (clusters.length - 1) / 2) * CLUSTER_Z_SPACING,
        };
    centroids.set(cluster.key, centroid);

    const blobRadius = 22 + Math.sqrt(cluster.memberIds.length) * 18;
    cluster.memberIds.forEach((memberId, memberIndex) => {
      const node = nodeById.get(memberId);
      if (!node) return;
      // Anchored nodes sit exactly at the origin (the scene center).
      if (node.anchorToOrigin) {
        positions.set(memberId, { x: 0, y: 0, z: 0 });
        return;
      }
      const seed = hashNodeId(memberId);
      const memberAngle =
        (memberIndex / Math.max(cluster.memberIds.length, 1)) * Math.PI * 2 +
        ((seed % 100) / 100) * 0.6;
      const radius =
        blobRadius * (0.25 + 0.75 * ((Math.abs(seed) % 1000) / 1000));
      positions.set(memberId, {
        x: centroid.x + Math.cos(memberAngle) * radius,
        y: centroid.y + Math.sin(memberAngle) * radius,
        z: centroid.z + ((seed % 200) - 100) * 0.5,
      });
    });
  });

  return { positions, centroids };
}
