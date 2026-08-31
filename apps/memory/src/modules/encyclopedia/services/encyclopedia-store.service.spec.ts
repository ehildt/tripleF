import { hashPayload } from '@triplef/helpers/hash-payload';
import { describe, expect, it, vi } from 'vitest';

import { EncyclopediaStoreService } from './encyclopedia-store.service.js';

function makeService(maxDocumentChars = 4_000_000) {
  const repository = {
    scrollByUrl: vi.fn().mockResolvedValue([]),
    upsertChunks: vi.fn().mockResolvedValue(undefined),
    deleteByUrlExcludingHash: vi.fn().mockResolvedValue(undefined),
  };
  const ledger = {
    insertMany: vi.fn().mockResolvedValue(undefined),
    countPending: vi.fn().mockResolvedValue(0),
    countPendingClassification: vi.fn().mockResolvedValue(0),
  };
  const embedding = {
    embed: vi
      .fn()
      .mockImplementation((chunks: string[]) =>
        Promise.resolve(chunks.map(() => [0.1, 0.2, 0.3])),
      ),
  };
  const memoryEnqueue = {
    enqueueEncyclopediaSweep: vi.fn().mockResolvedValue(undefined),
    enqueueEncyclopediaClassify: vi.fn().mockResolvedValue(undefined),
  };
  const overrides = {
    getClassifyModel: vi.fn().mockReturnValue(undefined),
  };
  const config = {
    maxDocumentChars,
    chunkChars: 1600,
    chunkOverlapSentences: 1,
    consolidateThreshold: 200,
    classifyThreshold: 20,
    classifyModel: undefined,
  };
  const service = new EncyclopediaStoreService(
    repository as never,
    ledger as never,
    embedding as never,
    memoryEnqueue as never,
    overrides as never,
    config as never,
  );
  return { service, repository, ledger, embedding };
}

describe('EncyclopediaStoreService.persistDocuments', () => {
  it('persists url-less documents under a synthetic upload url when allowUrlless', async () => {
    const { service, repository } = makeService();

    const outcome = await service.persistDocuments(
      [{ title: 'Upload', content: 'A url-less upload body.' }],
      'global',
      undefined,
      true,
    );

    expect(outcome.storedDocs).toBe(1);
    expect(outcome.ephemeralDocs).toHaveLength(0);
    expect(repository.upsertChunks).toHaveBeenCalledTimes(1);
    const points = repository.upsertChunks.mock.calls[0][0] as Array<{
      url: string;
      id: string;
    }>;
    expect(points[0].url).toMatch(/^upload:[0-9a-f]{64}$/);
    expect(points[0].id).toBeTruthy();

    // Idempotent: re-uploading the same content reproduces the same
    // deterministic id, so the point overwrites in place (no duplicates).
    repository.upsertChunks.mockClear();
    const again = await service.persistDocuments(
      [{ title: 'Upload', content: 'A url-less upload body.' }],
      'global',
      undefined,
      true,
    );
    expect(again.storedDocs).toBe(1);
    const rePoints = repository.upsertChunks.mock.calls[0][0] as Array<{
      id: string;
    }>;
    expect(rePoints[0].id).toBe(points[0].id);
  });

  it('reports an oversized document as rejected (reason: oversize)', async () => {
    const { service, repository } = makeService(10);

    const outcome = await service.persistDocuments(
      [
        {
          url: 'https://example.com/big',
          title: 'Big',
          content: 'x'.repeat(100),
        },
      ],
      'global',
      undefined,
      true,
    );

    expect(outcome.storedDocs).toBe(0);
    expect(outcome.rejectedDocs).toEqual([
      { title: 'Big', url: 'https://example.com/big', reason: 'oversize' },
    ]);
    expect(repository.upsertChunks).not.toHaveBeenCalled();
  });

  it('reports an unchunkable document as rejected (reason: empty)', async () => {
    const { service, repository } = makeService();

    const outcome = await service.persistDocuments(
      [{ title: 'Empty', content: '' }],
      'global',
      undefined,
      true,
    );

    expect(outcome.storedDocs).toBe(0);
    expect(outcome.rejectedDocs).toEqual([
      {
        title: 'Empty',
        url: expect.stringMatching(/^upload:/),
        reason: 'empty',
      },
    ]);
    expect(repository.upsertChunks).not.toHaveBeenCalled();
  });

  it('treats url-less documents as ephemeral in the select flow (default)', async () => {
    const { service, repository } = makeService();

    const outcome = await service.persistDocuments(
      [{ title: 'Upload', content: 'A url-less upload body.' }],
      'global',
    );

    expect(outcome.storedDocs).toBe(0);
    expect(outcome.ephemeralDocs).toHaveLength(1);
    expect(repository.upsertChunks).not.toHaveBeenCalled();
  });

  it('reuses an unchanged url-keyed document by content hash', async () => {
    const { service, repository } = makeService();
    const content = 'unchanged';
    repository.scrollByUrl.mockResolvedValue([
      {
        contentHash: hashPayload(content),
        fetchedAt: '2025-01-01T00:00:00.000Z',
      },
    ]);

    const outcome = await service.persistDocuments(
      [{ url: 'https://example.com/a', content }],
      'global',
    );

    expect(outcome.reusedDocs).toBe(1);
    expect(outcome.storedDocs).toBe(0);
    expect(repository.upsertChunks).not.toHaveBeenCalled();
  });
});
