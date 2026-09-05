import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppStore } from '@/stores/app';

import { useCognitionSpace } from './use-cognition-space';

const api = {
  fetchMemoryCognition: vi.fn(),
  fetchMemoryLinks: vi.fn(),
  fetchMemoryFrictions: vi.fn(),
  wipeMemoryCognition: vi.fn(),
};

vi.mock('@/api/memory.api', () => ({
  fetchMemoryCognition: (...args: unknown[]) =>
    api.fetchMemoryCognition(...args),
  fetchMemoryLinks: (...args: unknown[]) => api.fetchMemoryLinks(...args),
  fetchMemoryFrictions: (...args: unknown[]) =>
    api.fetchMemoryFrictions(...args),
  wipeMemoryCognition: (...args: unknown[]) => api.wipeMemoryCognition(...args),
}));

describe('useCognitionSpace', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('maps the profile fields and insights to nodes', async () => {
    api.fetchMemoryCognition.mockResolvedValue({
      profile: '{"a":1}',
      insights: [{ id: 'insight-0', text: 'likes cars', path: 'likes.cars' }],
      convictions: [],
    });
    api.fetchMemoryLinks.mockResolvedValue([]);
    api.fetchMemoryFrictions.mockResolvedValue([]);
    const store = useAppStore();
    store.memoryCognition = 'test';

    const { nodes, refresh } = useCognitionSpace();
    await refresh();

    expect(nodes.value).toHaveLength(2);
    expect(nodes.value[0].id).toBe('cognition-profile:a');
    expect(nodes.value[1].topicKey).toBe('likes');
  });

  it('degrades to unavailable on fetch failure', async () => {
    api.fetchMemoryCognition.mockRejectedValue(new Error('down'));
    const store = useAppStore();
    store.memoryCognition = 'test';

    const { isUnavailable, refresh } = useCognitionSpace();
    await refresh();

    expect(isUnavailable.value).toBe(true);
  });
});
