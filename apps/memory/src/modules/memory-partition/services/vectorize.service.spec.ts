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
      memoryPartition: 'sess-1',
      sessionId: 'sess-1',
      text: 'Sams phone number is 555-1234',
      tags: ['contacts'],
    });
    const second = await service.storeRecord({
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
        memoryPartition: 'sess-1',
        sessionId: 'sess-1',
        text: 'Do not remember',
      }),
    ).rejects.toThrow('disabled');
    expect(embed).not.toHaveBeenCalled();
    expect(upsertBatch).not.toHaveBeenCalled();
  });
});
