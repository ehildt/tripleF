import { describe, expect, it } from 'vitest';

import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';

import { buildLabelMeta } from './build-label-meta.helper';

function node(
  overrides: Partial<MemoryTaxonomyNodeRecord>,
): MemoryTaxonomyNodeRecord {
  return {
    id: 'n',
    kind: 'cluster',
    parentId: '',
    name: 'games',
    createdBy: 'memory',
    leafCount: 0,
    linkedCount: 0,
    childCount: 0,
    aliases: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('buildLabelMeta', () => {
  it('maps a cluster to its synthetic dot id with counts and stamps', () => {
    const meta = buildLabelMeta([
      node({
        kind: 'cluster',
        name: 'games',
        icon: 'gamepad',
        summary: 'Video games',
        leafCount: 12,
        linkedCount: 3,
        childCount: 2,
        aliases: [{ alias: 'gaming' } as never],
        lastReflectedAt: '2024-06-01T00:00:00Z',
      }),
    ]);
    const row = meta.get('cluster:games');
    expect(row?.icon).toBe('gamepad');
    expect(row?.summary).toBe('Video games');
    expect(row?.meta).toContainEqual({ label: 'leaves', value: '12' });
    expect(row?.meta).toContainEqual({ label: 'linked', value: '3' });
    expect(row?.meta).toContainEqual({ label: 'aliases', value: 'gaming' });
    expect(row?.meta).toContainEqual({
      label: 'reflected',
      value: '2024-06-01',
    });
  });

  it('maps hubs to topic dots and skips tags', () => {
    const meta = buildLabelMeta([
      node({ kind: 'hub', name: 'survival-games' }),
      node({ kind: 'tag', name: 'steam' }),
    ]);
    expect(meta.has('topic:survival-games')).toBe(true);
    expect(meta.has('tag:steam')).toBe(false);
  });

  it('aliases a cluster label onto a server graph-cluster hub by plurality', () => {
    const meta = buildLabelMeta(
      [node({ kind: 'cluster', name: 'games', icon: 'gamepad' })],
      [
        { id: 'f1', category: 'games', clusterId: 'gc-1' },
        { id: 'f2', category: 'games', clusterId: 'gc-1' },
        { id: 'f3', category: 'pets', clusterId: 'gc-1' },
      ],
    );
    expect(meta.get('cluster:gc-1')?.icon).toBe('gamepad');
    expect(meta.get('cluster:games')?.icon).toBe('gamepad');
  });
});
