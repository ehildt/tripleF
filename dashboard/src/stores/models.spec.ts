import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useModelsStore } from './models';

describe('useModelsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('initializes with empty models and no loading', () => {
    const store = useModelsStore();
    expect(store.models).toEqual([]);
    expect(store.modelsLoading).toBe(false);
  });

  it('fetchModels loads models on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            models: [{ model: 'llama' }, { model: 'mistral' }],
          }),
      }),
    );
    const store = useModelsStore();
    await store.fetchModels();
    expect(store.models).toEqual([{ model: 'llama' }, { model: 'mistral' }]);
    expect(store.modelsLoading).toBe(false);
  });

  it('fetchModels shows toast on refresh', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [{ model: 'x' }] }),
      }),
    );
    const store = useModelsStore();
    await store.fetchModels(true);
    expect(store.models).toEqual([{ model: 'x' }]);
  });

  it('fetchModels shows error toast on non-ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    const store = useModelsStore();
    await store.fetchModels();
    expect(store.models).toEqual([]);
  });

  it('fetchModels shows error toast on exception', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network error')),
    );
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const store = useModelsStore();
    await store.fetchModels();
    expect(store.models).toEqual([]);
    expect(store.modelsLoading).toBe(false);
    spy.mockRestore();
  });
});
