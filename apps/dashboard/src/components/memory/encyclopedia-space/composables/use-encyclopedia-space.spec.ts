import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEncyclopediaSpace } from './use-encyclopedia-space';

const api = {
  fetchEncyclopediaChunks: vi.fn(),
  fetchEncyclopediaLinks: vi.fn(),
  fetchEncyclopediaFrictions: vi.fn(),
  fetchEncyclopediaClusters: vi.fn(),
};

vi.mock('@/api/memory.api', () => ({
  fetchEncyclopediaChunks: (...args: unknown[]) =>
    api.fetchEncyclopediaChunks(...args),
  fetchEncyclopediaLinks: (...args: unknown[]) =>
    api.fetchEncyclopediaLinks(...args),
  fetchEncyclopediaFrictions: (...args: unknown[]) =>
    api.fetchEncyclopediaFrictions(...args),
  fetchEncyclopediaClusters: (...args: unknown[]) =>
    api.fetchEncyclopediaClusters(...args),
}));

describe('useEncyclopediaSpace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchEncyclopediaClusters.mockResolvedValue([]);
  });

  it('maps fetched chunks to nodes grouped by domain', async () => {
    api.fetchEncyclopediaChunks.mockResolvedValue([
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
    api.fetchEncyclopediaLinks.mockResolvedValue([]);
    api.fetchEncyclopediaFrictions.mockResolvedValue([]);

    const { nodes, refresh } = useEncyclopediaSpace();
    await refresh();

    expect(nodes.value).toHaveLength(1);
    expect(nodes.value[0].topicKey).toBe('example.com');
  });

  it('degrades to unavailable on fetch failure', async () => {
    api.fetchEncyclopediaChunks.mockRejectedValue(new Error('down'));

    const { isUnavailable, refresh } = useEncyclopediaSpace();
    await refresh();

    expect(isUnavailable.value).toBe(true);
  });
});
