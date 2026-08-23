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
        status: 200,
        headers: { get: () => null },
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

  it('splits models into local and cloud groups by origin', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: () =>
          Promise.resolve({
            models: [
              { model: 'llama', origin: 'local' },
              { model: 'gpt-oss:120b', origin: 'cloud' },
              { model: 'mistral' },
            ],
          }),
      }),
    );
    const store = useModelsStore();
    await store.fetchModels();
    // Models without an origin tag count as local.
    expect(store.localModels).toEqual([
      { model: 'llama', origin: 'local' },
      { model: 'mistral' },
    ]);
    expect(store.cloudModels).toEqual([
      { model: 'gpt-oss:120b', origin: 'cloud' },
    ]);
  });

  it('sorts local and cloud groups alphabetically within each section', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: () =>
          Promise.resolve({
            models: [
              { model: 'qwen3:8b', origin: 'local' },
              { model: 'kimi-k2:1t', origin: 'cloud' },
              { model: 'Mistral:7b', origin: 'local' },
              { model: 'gpt-oss:120b', origin: 'cloud' },
              { model: 'gemma4:12b', origin: 'local' },
            ],
          }),
      }),
    );
    const store = useModelsStore();
    await store.fetchModels();
    expect(store.localModels.map((m) => m.model)).toEqual([
      'gemma4:12b',
      'Mistral:7b',
      'qwen3:8b',
    ]);
    expect(store.cloudModels.map((m) => m.model)).toEqual([
      'gpt-oss:120b',
      'kimi-k2:1t',
    ]);
  });

  it('fetchModels shows toast on refresh', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: () => Promise.resolve({ models: [{ model: 'x' }] }),
      }),
    );
    const store = useModelsStore();
    await store.fetchModels({ refresh: true });
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
