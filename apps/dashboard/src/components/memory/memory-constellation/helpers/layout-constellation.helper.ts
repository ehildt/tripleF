import type {
  ConstellationNode,
  ConstellationPosition,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { calcFibonacciSpherePoint } from './calc-fibonacci-sphere-point.helper';
import { hashNodeId } from './hash-node-id.helper';

interface ConstellationLayout {
  /** World position of every node id (3D). */
  positions: Map<string, ConstellationPosition>;
  /** World position of every topic centroid (3D). */
  centroids: Map<string, ConstellationPosition>;
}

/** Extra id-seeded z spread, relative to the topic blob radius. */
const MEMBER_Z_JITTER_SCALE = 1.5;

/**
 * Deterministic volumetric layout: topic centroids sit on a Fibonacci
 * sphere, and each topic's members use another spherical scatter around
 * their centroid with id-seeded radial variation and z jitter. No force
 * simulation, no projection — the meaning lives in the topics and links,
 * not the coordinates.
 */
export function layoutConstellation(
  nodes: readonly ConstellationNode[],
  topics: readonly ConstellationTopic[],
): ConstellationLayout {
  const positions = new Map<string, ConstellationPosition>();
  const centroids = new Map<string, ConstellationPosition>();
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const topicSphereRadius = Math.sqrt(Math.max(nodes.length, 1)) * 60;

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
    const centroid = isAnchored
      ? { x: 0, y: 0, z: 0 }
      : calcFibonacciSpherePoint(topicIndex, topics.length, topicSphereRadius);
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
      const radius =
        blobRadius * (0.25 + 0.75 * ((Math.abs(seed) % 1000) / 1000));
      const point = calcFibonacciSpherePoint(
        memberIndex,
        topic.memberIds.length,
        radius,
      );
      const zJitter =
        ((Math.abs(seed % 200) - 100) / 100) *
        blobRadius *
        MEMBER_Z_JITTER_SCALE;
      positions.set(memberId, {
        x: centroid.x + point.x,
        y: centroid.y + point.y,
        z: centroid.z + point.z + zJitter,
      });
    });
  });

  return { positions, centroids };
}
