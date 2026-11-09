import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';
import { useModelsStore } from '@/stores/models/models.store';
import type { ModelsCatalog } from '@/types/models-catalog.model';

import { useModelCatalog } from './use-model-catalog';

const api = vi.hoisted(() => ({
  fetchModelsCatalog: vi.fn(),
  fetchConfig: vi.fn(),
  saveConfig: vi.fn(),
}));
const conversationCatalog = vi.hoisted(() => ({
  loadConversationForWrite: vi.fn(),
}));
const persistence = vi.hoisted(() => ({ persistConversation: vi.fn() }));
const toast = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}));

vi.mock('@/api/fetch-models-catalog.api', () => ({
  fetchModelsCatalog: api.fetchModelsCatalog,
}));
vi.mock('@/api/config.api', () => ({
  fetchConfig: api.fetchConfig,
  saveConfig: api.saveConfig,
}));
vi.mock('@/components/chat/composables/use-conversation-catalog', () => ({
  useConversationCatalog: () => conversationCatalog,
}));
vi.mock('@/components/chat/composables/use-conversation-persistence', () => ({
  useConversationPersistence: () => persistence,
}));
vi.mock('@/composables/use-toast/use-toast', () => ({ useToast: () => toast }));
vi.mock('@/i18n/i18n', () => ({
  i18n: { global: { t: (key: string) => key } },
}));
vi.mock(
  '@/utils/get-persistent-socket-session-id/get-persistent-socket-session-id.helper',
  () => ({ getPersistentSocketSessionId: () => 'session-1' }),
);

function catalogResponse(catalog: ModelsCatalog, etag = 'etag-1'): Response {
  return new Response(JSON.stringify(catalog), {
    status: 200,
    headers: { ETag: etag },
  });
}

function seedConversation(model: string, numCtx: string) {
  const conversation = createConversation('Chat');
  conversation.model = model;
  conversation.numCtx = numCtx;
  useConversationStore().insertConversation(conversation);
  return conversation;
}

describe('useModelCatalog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    api.fetchConfig.mockResolvedValue(null);
    api.saveConfig.mockResolvedValue(undefined);
    persistence.persistConversation.mockResolvedValue(undefined);
    conversationCatalog.loadConversationForWrite.mockImplementation(
      async (id: string) => useConversationStore().getConversation(id),
    );
    api.fetchModelsCatalog.mockResolvedValue(
      catalogResponse({ models: [], numCtxOptions: [] }),
    );
  });

  it('loads, selects, and reconciles only invalid conversation fields', async () => {
    const invalid = seedConversation('ghost', '');
    const valid = seedConversation('llama', '2048');
    const excessive = seedConversation('llama', '8192');
    api.fetchModelsCatalog.mockResolvedValue(
      catalogResponse({
        models: [
          { model: 'embed', capabilities: [] },
          {
            model: 'llama',
            capabilities: ['completion'],
            context_length: 4096,
          },
        ],
        numCtxOptions: [2048, 4096],
      }),
    );

    await useModelCatalog().fetchModels();

    expect(invalid.model).toBe('llama');
    expect(invalid.numCtx).toBe('4096');
    expect(valid.model).toBe('llama');
    expect(valid.numCtx).toBe('2048');
    expect(excessive.numCtx).toBe('4096');
    expect(persistence.persistConversation).toHaveBeenCalledTimes(2);
    expect(useModelsStore().selectedModel).toBe('');
    expect(localStorage.getItem('harness-models-etag')).toBe('etag-1');
  });

  it('loads selected config on 304 and retains the in-memory catalog', async () => {
    const store = useModelsStore();
    store.applyModelsCatalog({
      models: [{ model: 'llama', capabilities: ['completion'] }],
      numCtxOptions: [4096],
    });
    localStorage.setItem('harness-models-etag', 'etag-1');
    api.fetchConfig.mockResolvedValue({ selectedModel: 'llama' });
    api.fetchModelsCatalog.mockResolvedValue(
      new Response(null, {
        status: 304,
        headers: { ETag: 'etag-2' },
      }),
    );

    await useModelCatalog().fetchModels({ refresh: true });

    expect(api.fetchModelsCatalog).toHaveBeenCalledWith('etag-1');
    expect(api.fetchConfig).toHaveBeenCalledWith('session-1');
    expect(store.selectedModel).toBe('llama');
    expect(store.modelsReady).toBe(true);
    expect(localStorage.getItem('harness-models-etag')).toBe('etag-2');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('does not send a persisted ETag without an in-memory catalog', async () => {
    localStorage.setItem('harness-models-etag', 'stale-etag');
    api.fetchModelsCatalog.mockResolvedValue(
      catalogResponse({ models: [], numCtxOptions: [] }),
    );

    await useModelCatalog().whenModelsReady();

    expect(api.fetchModelsCatalog).toHaveBeenCalledWith('');
    expect(useModelsStore().modelsReady).toBe(true);
  });

  it('shares one request while preserving each caller presentation', async () => {
    let resolveResponse!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    api.fetchModelsCatalog.mockReturnValue(pending);
    const catalog = useModelCatalog();

    const ambient = catalog.fetchModels({ silent: true });
    const manual = catalog.fetchModels({ refresh: true });
    expect(useModelsStore().modelsLoading).toBe(true);
    expect(api.fetchModelsCatalog).toHaveBeenCalledOnce();

    resolveResponse(
      catalogResponse({
        models: [{ model: 'llama', capabilities: ['completion'] }],
        numCtxOptions: [],
      }),
    );
    await Promise.all([ambient, manual]);

    expect(api.fetchModelsCatalog).toHaveBeenCalledOnce();
    expect(useModelsStore().modelsLoading).toBe(false);
    expect(toast.success).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith('toast.loadedModels');
  });

  it('retains stale models and reports a network failure', async () => {
    const store = useModelsStore();
    store.applyModelsCatalog({
      models: [{ model: 'llama', capabilities: ['completion'] }],
      numCtxOptions: [4096],
    });
    api.fetchModelsCatalog.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await useModelCatalog().fetchModels();

    expect(store.models).toHaveLength(1);
    expect(store.lastFetchOk).toBe(false);
    expect(store.modelsLoading).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('toast.failedLoadModels');
  });

  it('settles readiness after a failed empty-catalog request', async () => {
    api.fetchModelsCatalog.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await useModelCatalog().whenModelsReady();

    expect(api.fetchModelsCatalog).toHaveBeenCalledOnce();
    expect(useModelsStore().modelsLoading).toBe(false);
    expect(useModelsStore().modelsReady).toBe(false);
  });

  it('keeps silent HTTP failures out of user-facing toasts', async () => {
    api.fetchModelsCatalog.mockResolvedValue(
      new Response(null, { status: 503 }),
    );
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await useModelCatalog().fetchModels({ silent: true });

    expect(toast.error).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith('Failed to fetch models: 503');
    expect(useModelsStore().modelsLoading).toBe(false);
  });

  it('selects and persists a model through the config workflow', () => {
    useModelCatalog().selectModel('llama');

    expect(useModelsStore().selectedModel).toBe('llama');
    expect(api.saveConfig).toHaveBeenCalledWith('session-1', {
      selectedModel: 'llama',
    });
  });
});
