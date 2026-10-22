import { describe, expect, it, vi } from 'vitest';

import { deterministicPointId } from '../../qdrant/helpers/deterministic-point-id.helper.js';
import type { QdrantConfig } from '../../qdrant/models/qdrant-config.model.js';

import { VectorizeService } from './vectorize.service.js';

function makeService() {
  const embed = vi.fn();
  const upsertBatch = vi.fn().mockResolvedValue(undefined);
  const ledger = {
    insertMany: vi.fn().mockResolvedValue(undefined),
    countPending: vi.fn().mockResolvedValue(0),
  };
  const memoryEnqueue = {
    enqueueConsolidateJob: vi.fn().mockResolvedValue(undefined),
  };
  const overrides = {
    getConsolidateModel: vi.fn().mockReturnValue(undefined),
  };
  const service = new VectorizeService(
    { embed } as never,
    { upsertBatch } as never,
    ledger as never,
    memoryEnqueue as never,
    overrides as never,
    {
      resolveLabels: vi.fn().mockResolvedValue([]),
      applyIconHint: vi.fn(),
    } as never,
    { enabled: true, consolidateThreshold: 50 } as QdrantConfig,
  );
  embed.mockImplementation((input: string[]) =>
    Promise.resolve(input.map((_, i) => [i, 0, 1])),
  );
  return { service, embed, upsertBatch };
}

describe('VectorizeService.storeRecord', () => {
  it('embeds and upserts one deterministic fact point with tags', async () => {
    const { service, embed, upsertBatch } = makeService();

    const id = await service.storeRecord({
      category: 'games',
      community: 'video games',
      subject: 'sam',
      node: 'contact info',
      memoryPartition: 'sess-1',
      sessionId: 'sess-1',
      text: 'Sams phone number is 555-1234',
      tags: ['contacts', 'sam'],
    });

    expect(embed).toHaveBeenCalledWith(
      ['Sams phone number is 555-1234'],
      'document',
    );
    expect(upsertBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        memoryPartition: 'sess-1',
        sessionId: 'sess-1',
        role: 'user',
        points: [
          expect.objectContaining({
            text: 'Sams phone number is 555-1234',
            tags: ['contacts', 'sam'],
            id: deterministicPointId(
              'sess-1|user|Sams phone number is 555-1234',
            ),
          }),
        ],
      }),
    );
    expect(id).toBe(
      deterministicPointId('sess-1|user|Sams phone number is 555-1234'),
    );
  });

  it('refreshes an existing fact in place (same deterministic id)', async () => {
    const { service } = makeService();
    const first = await service.storeRecord({
      category: 'games',
      community: 'video games',
      subject: 'sam',
      node: 'contact info',
      memoryPartition: 'sess-1',
      sessionId: 'sess-1',
      text: 'Sams phone number is 555-1234',
      tags: ['contacts'],
    });
    const second = await service.storeRecord({
      category: 'games',
      community: 'video games',
      subject: 'sam',
      node: 'contact info',
      memoryPartition: 'sess-1',
      sessionId: 'sess-1',
      text: 'Sams phone number is 555-1234',
      tags: ['contacts', 'updated'],
    });
    expect(second).toBe(first);
  });

  it('throws when the feature is disabled', async () => {
    const { embed, upsertBatch } = makeService();
    const disabled = new VectorizeService(
      { embed } as never,
      { upsertBatch } as never,
      { insertMany: vi.fn(), countPending: vi.fn() } as never,
      { enqueueConsolidateJob: vi.fn() } as never,
      { getConsolidateModel: vi.fn() } as never,
      {
        resolveLabels: vi.fn().mockResolvedValue([]),
        applyIconHint: vi.fn(),
      } as never,
      { enabled: false, consolidateThreshold: 50 } as QdrantConfig,
    );

    await expect(
      disabled.storeRecord({
        category: 'games',
        community: 'video games',
        subject: 'sam',
        node: 'contact info',
        memoryPartition: 'sess-1',
        sessionId: 'sess-1',
        text: 'Do not remember',
      }),
    ).rejects.toThrow('disabled');
    expect(embed).not.toHaveBeenCalled();
    expect(upsertBatch).not.toHaveBeenCalled();
  });

  it('throws when the text is empty', async () => {
    const { service, embed } = makeService();

    await expect(
      service.storeRecord({
        category: 'games',
        community: 'video games',
        subject: 'sam',
        node: 'contact info',
        memoryPartition: 'sess-1',
        text: '   ',
      }),
    ).rejects.toThrow('text is empty');
    expect(embed).not.toHaveBeenCalled();
  });

  it('throws when the embed returns no vector', async () => {
    const { service, embed } = makeService();
    embed.mockResolvedValue([]);

    await expect(
      service.storeRecord({
        category: 'games',
        community: 'video games',
        subject: 'sam',
        node: 'contact info',
        memoryPartition: 'sess-1',
        text: 'Some text',
      }),
    ).rejects.toThrow('Embedding returned no vector');
  });

  it('resolves taxonomy labels and applies the icon hint', async () => {
    const embed = vi.fn().mockResolvedValue([[0, 1, 2]]);
    const upsertBatch = vi.fn().mockResolvedValue(undefined);
    const resolveLabels = vi.fn().mockResolvedValue([
      { kind: 'cluster', input: 'cars', name: 'Cars' },
      { kind: 'tag', input: 'vintage', name: 'Vintage' },
    ]);
    const applyIconHint = vi.fn();
    const service = new VectorizeService(
      { embed } as never,
      { upsertBatch } as never,
      {
        insertMany: vi.fn().mockResolvedValue(undefined),
        countPending: vi.fn().mockResolvedValue(0),
      } as never,
      { enqueueConsolidateJob: vi.fn() } as never,
      { getConsolidateModel: vi.fn() } as never,
      { resolveLabels, applyIconHint } as never,
      { enabled: true, consolidateThreshold: 50 } as QdrantConfig,
    );

    await service.storeRecord({
      community: 'video games',
      subject: 'sam',
      node: 'contact info',
      memoryPartition: 'sess-1',
      text: 'Loves vintage cars',
      category: 'cars',
      tags: ['vintage'],
      icon: 'car',
    });

    expect(resolveLabels).toHaveBeenCalledWith(
      'partition',
      'sess-1',
      expect.arrayContaining([
        { kind: 'cluster', label: 'cars' },
        { kind: 'tag', label: 'vintage' },
      ]),
    );
    expect(applyIconHint).toHaveBeenCalledWith('car', expect.any(Array));
    expect(upsertBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        points: [
          expect.objectContaining({
            category: 'Cars',
            tags: ['Vintage'],
          }),
        ],
      }),
    );
  });

  it('triggers a consolidate job when the pending count reaches the threshold', async () => {
    const embed = vi.fn().mockResolvedValue([[0, 1, 2]]);
    const upsertBatch = vi.fn().mockResolvedValue(undefined);
    const insertMany = vi.fn().mockResolvedValue(undefined);
    const countPending = vi.fn().mockResolvedValue(50);
    const enqueueConsolidateJob = vi.fn().mockResolvedValue(undefined);
    const getConsolidateModel = vi.fn().mockReturnValue('llama3');
    const service = new VectorizeService(
      { embed } as never,
      { upsertBatch } as never,
      { insertMany, countPending } as never,
      { enqueueConsolidateJob } as never,
      { getConsolidateModel } as never,
      {
        resolveLabels: vi.fn().mockResolvedValue([]),
        applyIconHint: vi.fn(),
      } as never,
      { enabled: true, consolidateThreshold: 50 } as QdrantConfig,
    );

    await service.storeRecord({
      category: 'games',
      community: 'video games',
      subject: 'sam',
      node: 'contact info',
      memoryPartition: 'sess-1',
      text: 'A fact',
    });

    expect(enqueueConsolidateJob).toHaveBeenCalledWith({
      memoryPartition: 'sess-1',
      model: 'llama3',
    });
  });

  it('continues when the ledger write fails', async () => {
    const { upsertBatch } = makeService();
    const ledger = {
      insertMany: vi.fn().mockRejectedValue(new Error('db down')),
      countPending: vi.fn(),
    };
    const service2 = new VectorizeService(
      { embed: vi.fn().mockResolvedValue([[0, 1, 2]]) } as never,
      { upsertBatch } as never,
      ledger as never,
      { enqueueConsolidateJob: vi.fn() } as never,
      { getConsolidateModel: vi.fn() } as never,
      {
        resolveLabels: vi.fn().mockResolvedValue([]),
        applyIconHint: vi.fn(),
      } as never,
      { enabled: true, consolidateThreshold: 50 } as QdrantConfig,
    );

    const id = await service2.storeRecord({
      category: 'games',
      community: 'video games',
      subject: 'sam',
      node: 'contact info',
      memoryPartition: 'sess-1',
      text: 'A fact',
    });

    expect(id).toBeTruthy();
    expect(upsertBatch).toHaveBeenCalled();
  });
});

describe('VectorizeService.deleteRecords', () => {
  it('deletes matching records and returns their texts', async () => {
    const listMemory = vi.fn().mockResolvedValue([
      { id: 'p1', text: 'fact one' },
      { id: 'p2', text: 'fact two' },
    ]);
    const deleteByIds = vi.fn().mockResolvedValue(undefined);
    const service = new VectorizeService(
      { embed: vi.fn() } as never,
      { listMemory, deleteByIds } as never,
      { insertMany: vi.fn(), countPending: vi.fn() } as never,
      { enqueueConsolidateJob: vi.fn() } as never,
      { getConsolidateModel: vi.fn() } as never,
      { resolveLabels: vi.fn(), applyIconHint: vi.fn() } as never,
      { enabled: true, consolidateThreshold: 50 } as QdrantConfig,
    );

    const outcome = await service.deleteRecords({
      memoryPartition: 'sess-1',
      text: 'fact',
    });

    expect(outcome).toEqual({
      deleted: 2,
      texts: ['fact one', 'fact two'],
      matched: 2,
    });
    expect(deleteByIds).toHaveBeenCalledWith(['p1', 'p2']);
  });

  it('returns zero when nothing matches', async () => {
    const listMemory = vi.fn().mockResolvedValue([]);
    const deleteByIds = vi.fn();
    const service = new VectorizeService(
      { embed: vi.fn() } as never,
      { listMemory, deleteByIds } as never,
      { insertMany: vi.fn(), countPending: vi.fn() } as never,
      { enqueueConsolidateJob: vi.fn() } as never,
      { getConsolidateModel: vi.fn() } as never,
      { resolveLabels: vi.fn(), applyIconHint: vi.fn() } as never,
      { enabled: true, consolidateThreshold: 50 } as QdrantConfig,
    );

    const outcome = await service.deleteRecords({
      memoryPartition: 'sess-1',
      text: 'nothing',
    });

    expect(outcome).toEqual({ deleted: 0, texts: [], matched: 0 });
    expect(deleteByIds).not.toHaveBeenCalled();
  });

  it('refuses to delete when more than the cap matches', async () => {
    const matches = Array.from({ length: 51 }, (_, i) => ({
      id: `p${i}`,
      text: `fact ${i}`,
    }));
    const listMemory = vi.fn().mockResolvedValue(matches);
    const service = new VectorizeService(
      { embed: vi.fn() } as never,
      { listMemory, deleteByIds: vi.fn() } as never,
      { insertMany: vi.fn(), countPending: vi.fn() } as never,
      { enqueueConsolidateJob: vi.fn() } as never,
      { getConsolidateModel: vi.fn() } as never,
      { resolveLabels: vi.fn(), applyIconHint: vi.fn() } as never,
      { enabled: true, consolidateThreshold: 50 } as QdrantConfig,
    );

    await expect(
      service.deleteRecords({ memoryPartition: 'sess-1', text: 'fact' }),
    ).rejects.toThrow('Refusing to delete');
  });

  it('throws when the feature is disabled', async () => {
    const service = new VectorizeService(
      { embed: vi.fn() } as never,
      { listMemory: vi.fn(), deleteByIds: vi.fn() } as never,
      { insertMany: vi.fn(), countPending: vi.fn() } as never,
      { enqueueConsolidateJob: vi.fn() } as never,
      { getConsolidateModel: vi.fn() } as never,
      { resolveLabels: vi.fn(), applyIconHint: vi.fn() } as never,
      { enabled: false, consolidateThreshold: 50 } as QdrantConfig,
    );

    await expect(
      service.deleteRecords({ memoryPartition: 'sess-1', text: 'fact' }),
    ).rejects.toThrow('disabled');
  });
});
