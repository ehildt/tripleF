import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLexiconSpace } from './use-lexicon-space';

const api = {
  fetchLexiconChunks: vi.fn(),
  fetchLexiconLinks: vi.fn(),
};

vi.mock('@/api/memory.api', () => ({
  fetchLexiconChunks: (...args: unknown[]) => api.fetchLexiconChunks(...args),
  fetchLexiconLinks: (...args: unknown[]) => api.fetchLexiconLinks(...args),
}));

describe('useLexiconSpace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps fetched chunks to nodes clustered by domain', async () => {
    api.fetchLexiconChunks.mockResolvedValue([
      {
        id: 'a',
        content: 'chunk one',
        url: 'https://example.com/a',
        domain: 'example.com',
        fetchedAt: '2024-01-01T00:00:00Z',
        contentHash: 'h',
        chunkIndex: 0,
        chunkCount: 1,
        partitionScope: 'global',
      },
    ]);
    api.fetchLexiconLinks.mockResolvedValue([]);

    const { nodes, refresh } = useLexiconSpace();
    await refresh();

    expect(nodes.value).toHaveLength(1);
    expect(nodes.value[0].clusterKey).toBe('example.com');
  });

  it('degrades to unavailable on fetch failure', async () => {
    api.fetchLexiconChunks.mockRejectedValue(new Error('down'));

    const { isUnavailable, refresh } = useLexiconSpace();
    await refresh();

    expect(isUnavailable.value).toBe(true);
  });
});
