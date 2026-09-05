import { describe, expect, it } from 'vitest';

import { detectClusters } from './detect-clusters.helper.js';

/** A point with a simple 2-d vector (cosine is easy to reason about). */
function point(
  id: string,
  vector: number[],
  category?: string,
): Parameters<typeof detectClusters>[0]['points'][number] {
  return { id, vector, text: `text-${id}`, category, tags: [] };
}

describe('detectClusters', () => {
  it('groups connected components into structural clusters', () => {
    const { clusters, assignments } = detectClusters({
      edges: [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
      ],
      points: [point('a', [1, 0]), point('b', [1, 0]), point('c', [1, 0])],
      minMembers: 2,
      scopeSeed: 'scope',
    });

    expect(clusters).toHaveLength(1);
    expect(clusters[0].memberIds).toEqual(['a', 'b', 'c']);
    expect(assignments.get('a')).toBe(clusters[0].id);
    expect(assignments.get('b')).toBe(clusters[0].id);
    expect(assignments.get('c')).toBe(clusters[0].id);
  });

  it('absorbs singletons into their nearest structural cluster', () => {
    const { clusters, assignments } = detectClusters({
      edges: [{ source: 'a', target: 'b' }],
      points: [
        point('a', [1, 0]),
        point('b', [1, 0]),
        // Lone point, cosine-close to the a/b cluster.
        point('c', [1, 0.1]),
      ],
      minMembers: 2,
      scopeSeed: 'scope',
    });

    // The singleton is absorbed — no lone facts.
    expect(clusters).toHaveLength(1);
    expect(clusters[0].memberIds).toEqual(['a', 'b', 'c']);
    expect(assignments.get('c')).toBe(clusters[0].id);
  });

  it('falls back to category grouping when there are no structural clusters', () => {
    const { clusters, assignments } = detectClusters({
      edges: [],
      points: [
        point('a', [1, 0], 'games'),
        point('b', [1, 0], 'games'),
        point('c', [1, 0], 'pets'),
        point('d', [1, 0]),
      ],
      minMembers: 2,
      scopeSeed: 'scope',
    });

    // games (2), pets (1), uncategorized solo (1).
    expect(clusters).toHaveLength(3);
    const games = clusters.find((c) => c.memberIds.includes('a'));
    expect(games?.memberIds).toEqual(['a', 'b']);
    expect(assignments.get('a')).toBe(games?.id);
    expect(assignments.get('c')).toBe(
      clusters.find((c) => c.memberIds.includes('c'))?.id,
    );
    // Uncategorized point still lands somewhere (its own cluster).
    expect(assignments.get('d')).toBeTruthy();
  });

  it('assigns every point exactly once', () => {
    const { clusters, assignments } = detectClusters({
      edges: [
        { source: 'a', target: 'b' },
        { source: 'c', target: 'd' },
      ],
      points: [
        point('a', [1, 0]),
        point('b', [1, 0]),
        point('c', [0, 1]),
        point('d', [0, 1]),
        point('e', [1, 1]),
      ],
      minMembers: 2,
      scopeSeed: 'scope',
    });

    const assigned = new Set(assignments.keys());
    expect(assigned).toEqual(new Set(['a', 'b', 'c', 'd', 'e']));
    // Every assignment points at a real cluster id.
    const ids = new Set(clusters.map((c) => c.id));
    for (const clusterId of assignments.values()) {
      expect(ids.has(clusterId)).toBe(true);
    }
  });

  it('is deterministic regardless of input point order', () => {
    const base = {
      edges: [{ source: 'a', target: 'b' }],
      points: [point('a', [1, 0]), point('b', [1, 0]), point('c', [1, 0.1])],
      minMembers: 2,
      scopeSeed: 'scope',
    };
    const first = detectClusters(base);
    const second = detectClusters({
      ...base,
      points: [...base.points].reverse(),
    });

    expect(first.clusters.map((c) => c.id)).toEqual(
      second.clusters.map((c) => c.id),
    );
    expect(first.clusters.map((c) => c.fingerprint)).toEqual(
      second.clusters.map((c) => c.fingerprint),
    );
  });

  it('fingerprints the sorted member ids (the drift signal)', () => {
    const { clusters } = detectClusters({
      edges: [{ source: 'b', target: 'a' }],
      points: [point('b', [1, 0]), point('a', [1, 0])],
      minMembers: 2,
      scopeSeed: 'scope',
    });

    expect(clusters[0].memberIds).toEqual(['a', 'b']);
    // Same members in a different input order → same fingerprint.
    const again = detectClusters({
      edges: [{ source: 'a', target: 'b' }],
      points: [point('a', [1, 0]), point('b', [1, 0])],
      minMembers: 2,
      scopeSeed: 'scope',
    });
    expect(again.clusters[0].fingerprint).toBe(clusters[0].fingerprint);
  });
});
