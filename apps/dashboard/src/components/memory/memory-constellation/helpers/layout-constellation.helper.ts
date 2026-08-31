import type {
  ConstellationNode,
  ConstellationPosition,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { hashNodeId } from './hash-node-id.helper';

export interface ConstellationLayout {
  /** World position of every node id (3D). */
  positions: Map<string, ConstellationPosition>;
  /** World position of every topic centroid (3D). */
  centroids: Map<string, ConstellationPosition>;
}

/** Vertical spacing between topic centroids (z axis). */
const CLUSTER_Z_SPACING = 70;

/**
 * Deterministic 3D layout: topic centroids sit on a ring in the x-y plane
 * and are spread along the z axis, and each topic's members scatter in a
 * disk around their centroid with a small z jitter (seeded by the node id
 * hash). No force simulation, no projection — the meaning lives in the
 * topics and links, not the coordinates.
 */
export function layoutConstellation(
  nodes: readonly ConstellationNode[],
  topics: readonly ConstellationTopic[],
): ConstellationLayout {
  const positions = new Map<string, ConstellationPosition>();
  const centroids = new Map<string, ConstellationPosition>();
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const topicRingRadius = Math.sqrt(Math.max(nodes.length, 1)) * 60;

  // Clusters containing an anchored node (e.g. the cognition profile hub)
  // sit at the origin — the source the other topics orbit around.
  const anchoredTopicKeys = new Set(
    topics
      .filter((topic) =>
        topic.memberIds.some((id) => nodeById.get(id)?.anchorToOrigin),
      )
      .map((topic) => topic.key),
  );

  topics.forEach((topic, topicIndex) => {
    const isAnchored = anchoredTopicKeys.has(topic.key);
    const angle = (topicIndex / Math.max(topics.length, 1)) * Math.PI * 2;
    const centroid = isAnchored
      ? { x: 0, y: 0, z: 0 }
      : {
          x: Math.cos(angle) * topicRingRadius,
          y: Math.sin(angle) * topicRingRadius,
          z: (topicIndex - (topics.length - 1) / 2) * CLUSTER_Z_SPACING,
        };
    centroids.set(topic.key, centroid);

    const blobRadius = 22 + Math.sqrt(topic.memberIds.length) * 18;
    topic.memberIds.forEach((memberId, memberIndex) => {
      const node = nodeById.get(memberId);
      if (!node) return;
      // Anchored nodes sit exactly at the origin (the scene center).
      if (node.anchorToOrigin) {
        positions.set(memberId, { x: 0, y: 0, z: 0 });
        return;
      }
      const seed = hashNodeId(memberId);
      const memberAngle =
        (memberIndex / Math.max(topic.memberIds.length, 1)) * Math.PI * 2 +
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
