import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppStore } from '@/stores/app';

import { usePartitionSpace } from './use-partition-space';

const api = {
  fetchMemoryFacts: vi.fn(),
  fetchMemoryLinks: vi.fn(),
  fetchMemoryFrictions: vi.fn(),
  fetchMemoryClusters: vi.fn(),
  wipeMemoryFacts: vi.fn(),
};

vi.mock('@/api/memory.api', () => ({
  fetchMemoryFacts: (...args: unknown[]) => api.fetchMemoryFacts(...args),
  fetchMemoryLinks: (...args: unknown[]) => api.fetchMemoryLinks(...args),
  fetchMemoryFrictions: (...args: unknown[]) =>
    api.fetchMemoryFrictions(...args),
  fetchMemoryClusters: (...args: unknown[]) => api.fetchMemoryClusters(...args),
  wipeMemoryFacts: (...args: unknown[]) => api.wipeMemoryFacts(...args),
}));

describe('usePartitionSpace', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    api.fetchMemoryClusters.mockResolvedValue([]);
  });

  it('maps fetched facts to nodes and links', async () => {
    api.fetchMemoryFacts.mockResolvedValue([
      {
        id: 'a',
        text: 'one',
        tags: ['work'],
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'b',
        text: 'two',
        tags: ['work'],
        createdAt: '2024-01-02T00:00:00Z',
      },
    ]);
    api.fetchMemoryLinks.mockResolvedValue([
      { source: 'a', target: 'b', score: 0.8 },
    ]);
    api.fetchMemoryFrictions.mockResolvedValue([
      {
        source: 'a',
        target: 'b',
        kind: 'contradiction',
        status: 'open',
        reason: 'conflict',
      },
    ]);
    const store = useAppStore();
    store.memoryPartition = 'test';

    const { nodes, links, frictions, refresh } = usePartitionSpace();
    await refresh();

    expect(nodes.value).toHaveLength(2);
    expect(links.value).toEqual([
      { source: 'a', target: 'b', type: 'semantic', score: 0.8 },
    ]);
    expect(frictions.value).toEqual([
      { source: 'a', target: 'b', reason: 'conflict' },
    ]);
  });

  it('degrades to nodes-without-links when the links fetch fails', async () => {
    api.fetchMemoryFacts.mockResolvedValue([
      {
        id: 'a',
        text: 'one',
        tags: ['work'],
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]);
    api.fetchMemoryLinks.mockRejectedValue(new Error('down'));
    const store = useAppStore();
    store.memoryPartition = 'test';

    const { nodes, links, isUnavailable, refresh } = usePartitionSpace();
    await refresh();

    expect(nodes.value).toHaveLength(1);
    expect(links.value).toEqual([]);
    expect(isUnavailable.value).toBe(false);
  });

  it('degrades to unavailable on fetch failure', async () => {
    api.fetchMemoryFacts.mockRejectedValue(new Error('down'));
    const store = useAppStore();
    store.memoryPartition = 'test';

    const { isUnavailable, isEmpty, refresh } = usePartitionSpace();
    await refresh();

    expect(isUnavailable.value).toBe(true);
    expect(isEmpty.value).toBe(true);
  });
});
