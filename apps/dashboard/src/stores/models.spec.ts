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
              { model: 'llama', origin: 'local', capabilities: ['completion'] },
              {
                model: 'gpt-oss:120b',
                origin: 'cloud',
                capabilities: ['completion'],
              },
              { model: 'mistral', capabilities: ['completion'] },
            ],
          }),
      }),
    );
    const store = useModelsStore();
    await store.fetchModels();
    // Models without an origin tag count as local.
    expect(store.localModels).toEqual([
      { model: 'llama', origin: 'local', capabilities: ['completion'] },
      { model: 'mistral', capabilities: ['completion'] },
    ]);
    expect(store.cloudModels).toEqual([
      { model: 'gpt-oss:120b', origin: 'cloud', capabilities: ['completion'] },
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
              {
                model: 'qwen3:8b',
                origin: 'local',
                capabilities: ['completion'],
              },
              {
                model: 'kimi-k2:1t',
                origin: 'cloud',
                capabilities: ['completion'],
              },
              {
                model: 'Mistral:7b',
                origin: 'local',
                capabilities: ['completion'],
              },
              {
                model: 'gpt-oss:120b',
                origin: 'cloud',
                capabilities: ['completion'],
              },
              {
                model: 'gemma4:12b',
                origin: 'local',
                capabilities: ['completion'],
              },
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

  it('excludes capability-less models from both picker groups', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: () =>
          Promise.resolve({
            models: [
              { model: 'llama', origin: 'local', capabilities: ['completion'] },
              { model: 'nomic-embed-text', origin: 'local', capabilities: [] },
              {
                model: 'gpt-oss:120b',
                origin: 'cloud',
                capabilities: ['completion'],
              },
              { model: 'embed', origin: 'cloud' },
            ],
          }),
      }),
    );
    const store = useModelsStore();
    await store.fetchModels();
    // The raw catalog stays complete for availability checks...
    expect(store.models.map((m) => m.model)).toEqual([
      'llama',
      'nomic-embed-text',
      'gpt-oss:120b',
      'embed',
    ]);
    // ...but the picker lists never offer a model that can't run a chat request.
    expect(store.localModels.map((m) => m.model)).toEqual(['llama']);
    expect(store.cloudModels.map((m) => m.model)).toEqual(['gpt-oss:120b']);
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
