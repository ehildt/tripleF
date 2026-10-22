import { describe, expect, it, vi } from 'vitest';

import { synopsisText } from './helpers/synopsis-text.helper.js';
import { SynopsisRepository } from './synopsis.repository.js';

function makeRepo() {
  const client = {
    upsert: vi.fn().mockResolvedValue(undefined),
    scroll: vi.fn().mockResolvedValue({ points: [], next_page_offset: null }),
    query: vi.fn().mockResolvedValue({ points: [] }),
    delete: vi.fn().mockResolvedValue(undefined),
    setPayload: vi.fn().mockResolvedValue(undefined),
  };
  const clientService = {
    hasSynopsisCollection: vi.fn().mockResolvedValue(true),
    partitionSynopsisCollection: 'partition-synopsis_nomic',
    encyclopediaSynopsisCollection: 'encyclopedia-synopsis_nomic',
    getClient: vi.fn().mockReturnValue(client),
  };
  const repo = new SynopsisRepository(clientService as never);
  return { repo, client, clientService };
}

const point = {
  id: 'synopsis|cl-1',
  clusterId: 'cl-1',
  scopeKey: 'sess-1',
  level: 0,
  title: 'Cars',
  summary: 'All about cars',
  memberCount: 3,
  vector: [0.1, 0.2],
};

describe('SynopsisRepository', () => {
  it('upserts synopsis points with the payload shape', async () => {
    const { repo, client } = makeRepo();

    await repo.upsertSynopses('partition', [point]);

    expect(client.upsert).toHaveBeenCalledWith('partition-synopsis_nomic', {
      wait: true,
      points: [
        {
          id: 'synopsis|cl-1',
          vector: [0.1, 0.2],
          payload: {
            summarizes_cluster_id: 'cl-1',
            scope_key: 'sess-1',
            level: 0,
            title: 'Cars',
            summary: 'All about cars',
            member_count: 3,
            text: 'Cars\nAll about cars',
          },
        },
      ],
    });
  });

  it('skips upserting when the collection is missing', async () => {
    const { repo, client, clientService } = makeRepo();
    clientService.hasSynopsisCollection.mockResolvedValue(false);

    await repo.upsertSynopses('partition', [point]);

    expect(client.upsert).not.toHaveBeenCalled();
  });

  it('scrolls synopses of a scope with vectors', async () => {
    const { repo, client } = makeRepo();
    client.scroll.mockResolvedValue({
      points: [
        {
          id: 'synopsis|cl-1',
          vector: [0.1, 0.2],
          payload: {
            summarizes_cluster_id: 'cl-1',
            scope_key: 'sess-1',
            level: 0,
            title: 'Cars',
            summary: 'All about cars',
            member_count: 3,
          },
        },
      ],
      next_page_offset: null,
    });

    const points = await repo.scrollSynopses('partition', 'sess-1');

    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({ clusterId: 'cl-1', vector: [0.1, 0.2] });
    expect(client.scroll).toHaveBeenCalledWith(
      'partition-synopsis_nomic',
      expect.objectContaining({
        filter: { must: [{ key: 'scope_key', match: { value: 'sess-1' } }] },
      }),
    );
  });

  it('filters scrolls by level when given', async () => {
    const { repo, client } = makeRepo();

    await repo.scrollSynopses('partition', 'sess-1', 1);

    const filter = client.scroll.mock.calls[0][1].filter;
    expect(filter.must).toContainEqual({ key: 'level', match: { value: 1 } });
  });

  it('searches synopses semantically', async () => {
    const { repo, client } = makeRepo();
    client.query.mockResolvedValue({
      points: [
        {
          id: 'synopsis|cl-1',
          score: 0.8,
          payload: {
            summarizes_cluster_id: 'cl-1',
            scope_key: 'sess-1',
            level: 0,
            title: 'Cars',
            summary: 'All about cars',
            member_count: 3,
          },
        },
      ],
    });

    const hits = await repo.searchSynopses(
      'partition',
      'sess-1',
      [0.1, 0.2],
      2,
    );

    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ clusterId: 'cl-1', score: 0.8 });
  });

  it('deletes synopses whose cluster vanished', async () => {
    const { repo, client } = makeRepo();
    client.scroll.mockResolvedValue({
      points: [
        {
          id: 'synopsis|cl-1',
          vector: [0.1],
          payload: {
            summarizes_cluster_id: 'cl-1',
            scope_key: 'sess-1',
            level: 0,
            title: 'Cars',
            summary: 'x',
            member_count: 1,
          },
        },
        {
          id: 'synopsis|cl-2',
          vector: [0.2],
          payload: {
            summarizes_cluster_id: 'cl-2',
            scope_key: 'sess-1',
            level: 0,
            title: 'Cooking',
            summary: 'y',
            member_count: 1,
          },
        },
      ],
      next_page_offset: null,
    });

    await repo.deleteSynopsesNotIn('partition', 'sess-1', new Set(['cl-1']));

    expect(client.delete).toHaveBeenCalledWith('partition-synopsis_nomic', {
      wait: true,
      points: ['synopsis|cl-2'],
    });
  });

  it('increments heat on hits in one batched setPayload per count', async () => {
    const { repo, client } = makeRepo();

    await repo.incrementHeat('partition', [
      { id: 'a', heatAmount: 2 },
      { id: 'b', heatAmount: 2 },
      { id: 'c' },
    ]);

    expect(client.setPayload).toHaveBeenCalledTimes(2);
    expect(client.setPayload).toHaveBeenCalledWith(
      'partition-synopsis_nomic',
      expect.objectContaining({
        payload: expect.objectContaining({ heat_amount: 3 }),
        points: ['a', 'b'],
      }),
    );
    expect(client.setPayload).toHaveBeenCalledWith(
      'partition-synopsis_nomic',
      expect.objectContaining({
        payload: expect.objectContaining({ heat_amount: 1 }),
        points: ['c'],
      }),
    );
  });

  it('skips heat increment when the collection is missing', async () => {
    const { repo, client, clientService } = makeRepo();
    clientService.hasSynopsisCollection.mockResolvedValue(false);

    await repo.incrementHeat('partition', [{ id: 'a' }]);

    expect(client.setPayload).not.toHaveBeenCalled();
  });
});

describe('synopsisText', () => {
  it('joins the title and summary', () => {
    expect(synopsisText('Cars', 'All about cars')).toBe('Cars\nAll about cars');
  });
});
