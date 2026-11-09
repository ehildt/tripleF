import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useModelsStore } from './models.store';

describe('useModelsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with empty catalog and no loading or readiness', () => {
    const store = useModelsStore();
    expect(store.models).toEqual([]);
    expect(store.modelsLoading).toBe(false);
    expect(store.modelsReady).toBe(false);
  });

  it('applies catalog data through one synchronous mutation', () => {
    const store = useModelsStore();
    store.applyModelsCatalog({
      models: [{ model: 'llama', capabilities: ['completion'] }],
      numCtxOptions: [2048, 4096],
    });

    expect(store.modelNames).toEqual(['llama']);
    expect(store.defaultNumCtx).toBe('4096');
  });

  it('sorts eligible local and cloud groups and excludes capability-less models', () => {
    const store = useModelsStore();
    store.applyModelsCatalog({
      models: [
        { model: 'qwen', origin: 'local', capabilities: ['completion'] },
        { model: 'kimi', origin: 'cloud', capabilities: ['completion'] },
        { model: 'Mistral', capabilities: ['completion'] },
        { model: 'gpt', origin: 'cloud', capabilities: ['completion'] },
        { model: 'embed', origin: 'local', capabilities: [] },
      ],
      numCtxOptions: [],
    });

    expect(store.localModels.map((model) => model.model)).toEqual([
      'Mistral',
      'qwen',
    ]);
    expect(store.cloudModels.map((model) => model.model)).toEqual([
      'gpt',
      'kimi',
    ]);
    expect(store.modelNames).toContain('embed');
  });

  it('uses only eligible models for selected and fallback defaults', () => {
    const store = useModelsStore();
    store.applyModelsCatalog({
      models: [
        { model: 'embed', capabilities: [] },
        { model: 'llama', capabilities: ['completion'] },
        { model: 'cloud', origin: 'cloud', capabilities: ['completion'] },
      ],
      numCtxOptions: [],
    });
    expect(store.defaultModel).toBe('llama');

    store.setSelectedModel('cloud');
    expect(store.defaultModel).toBe('cloud');

    store.setSelectedModel('embed');
    expect(store.defaultModel).toBe('llama');
  });

  it('looks up raw models and derives their maximum context option', () => {
    const store = useModelsStore();
    store.applyModelsCatalog({
      models: [
        { model: 'llama', context_length: 8192 },
        { model: 'small', context_length: 1024 },
      ],
      numCtxOptions: [2048, 4096, 8192],
    });

    expect(store.getModel('llama')?.context_length).toBe(8192);
    expect(store.maxNumCtxForModel('llama')).toBe('8192');
    expect(store.maxNumCtxForModel('small')).toBe('1024');
    expect(store.maxNumCtxForModel('missing')).toBe('');
  });

  it('treats a successful empty catalog as ready', () => {
    const store = useModelsStore();
    store.setLastFetchOk(true);
    expect(store.modelsReady).toBe(true);

    store.setLastFetchOk(false);
    store.applyModelsCatalog({
      models: [{ model: 'llama' }],
      numCtxOptions: [],
    });
    expect(store.modelsReady).toBe(true);
  });

  it('owns explicit loading and selection setters', () => {
    const store = useModelsStore();
    store.setModelsLoading(true);
    store.setSelectedModel('llama');

    expect(store.modelsLoading).toBe(true);
    expect(store.selectedModel).toBe('llama');
  });
});
