import { fetchConfig, saveConfig } from '@/api/config.api';
import { fetchModelsCatalog } from '@/api/fetch-models-catalog.api';
import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationPersistence } from '@/components/chat/composables/use-conversation-persistence';
import { useToast } from '@/composables/use-toast/use-toast';
import { i18n } from '@/i18n/i18n';
import type { Conversation } from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { useModelsStore } from '@/stores/models/models.store';
import { getPersistentSocketSessionId } from '@/utils/get-persistent-socket-session-id/get-persistent-socket-session-id.helper';

import { parseModelsCatalog } from './helpers/parse-models-catalog.helper';
import type {
  FetchModelsOptions,
  ModelCatalog,
} from './use-model-catalog.types';

const SESSION_ID = getPersistentSocketSessionId();
const ETAG_KEY = 'harness-models-etag';

interface CatalogLoadSuccess {
  type: 'success';
}

interface CatalogNotModified {
  type: 'not-modified';
}

interface CatalogHttpFailure {
  type: 'http-failure';
  status: number;
}

interface CatalogRequestFailure {
  type: 'request-failure';
  error: unknown;
}

type CatalogLoadOutcome =
  | CatalogLoadSuccess
  | CatalogNotModified
  | CatalogHttpFailure
  | CatalogRequestFailure;

type ConversationModelPatch = Partial<Pick<Conversation, 'model' | 'numCtx'>>;

let inFlight: Promise<CatalogLoadOutcome> | null = null;
let visibleRequestCount = 0;

function loadLastEtag(): string {
  try {
    return localStorage.getItem(ETAG_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveLastEtag(etag: string): void {
  try {
    localStorage.setItem(ETAG_KEY, etag);
  } catch {
    // The catalog remains usable in memory when storage is unavailable.
  }
}

/**
 * Own the app-level model catalog/config workflow. The in-flight request and
 * visible-caller count are singletons; reactive catalog data remains in the
 * models store and conversation writes use their persistence owner.
 */
export function useModelCatalog(): ModelCatalog {
  const modelsStore = useModelsStore();
  const conversationStore = useConversationStore();
  const conversationCatalog = useConversationCatalog();
  const conversationPersistence = useConversationPersistence();
  const toast = useToast();

  async function loadSelectedModel(): Promise<void> {
    try {
      const config = await fetchConfig(SESSION_ID);
      if (config?.selectedModel) {
        modelsStore.setSelectedModel(config.selectedModel);
      }
    } catch {
      // Offline: retain the current in-memory selection for fallback.
    }
  }

  function buildConversationModelPatch(
    conversation: Conversation,
  ): ConversationModelPatch {
    const patch: ConversationModelPatch = {};
    const eligibleModels = [
      ...modelsStore.localModels,
      ...modelsStore.cloudModels,
    ];
    if (!eligibleModels.some((model) => model.model === conversation.model)) {
      patch.model = modelsStore.defaultModel;
    }

    const modelName = patch.model ?? conversation.model;
    const maxNumCtx = modelsStore.maxNumCtxForModel(modelName);
    const currentNumCtx = Number(conversation.numCtx);
    const hasValidNumCtx =
      conversation.numCtx.trim() !== '' &&
      Number.isFinite(currentNumCtx) &&
      currentNumCtx > 0 &&
      currentNumCtx <= Number(maxNumCtx);
    if (maxNumCtx && !hasValidNumCtx) patch.numCtx = maxNumCtx;
    return patch;
  }

  async function reconcileConversations(): Promise<void> {
    if (!modelsStore.defaultModel) return;
    await Promise.all(
      conversationStore.conversations.map(async (current) => {
        const conversation = current.loaded
          ? current
          : await conversationCatalog.loadConversationForWrite(current.id);
        if (!conversation) return;
        const patch = buildConversationModelPatch(conversation);
        if (Object.keys(patch).length === 0) return;
        conversationStore.patchConversation(conversation.id, patch);
        await conversationPersistence.persistConversation(conversation);
      }),
    );
  }

  function updateEtag(response: Response): void {
    const etag = response.headers.get('ETag');
    if (etag) saveLastEtag(etag);
  }

  async function loadAndApply(): Promise<CatalogLoadOutcome> {
    try {
      // A 304 has no body. Without an in-memory 200 representation there is
      // nothing to reuse, so a persisted ETag alone must not trigger it.
      const etag = modelsStore.models.length > 0 ? loadLastEtag() : '';
      const response = await fetchModelsCatalog(etag);

      if (response.status === 304) {
        if (modelsStore.models.length === 0) {
          modelsStore.setLastFetchOk(false);
          return {
            type: 'request-failure',
            error: new Error('Received 304 without an in-memory catalog'),
          };
        }
        updateEtag(response);
        await loadSelectedModel();
        modelsStore.setLastFetchOk(true);
        return { type: 'not-modified' };
      }

      if (!response.ok) {
        modelsStore.setLastFetchOk(false);
        return { type: 'http-failure', status: response.status };
      }

      const catalog = parseModelsCatalog(await response.json());
      modelsStore.applyModelsCatalog(catalog);
      await loadSelectedModel();
      try {
        await reconcileConversations();
      } catch (error) {
        // Reconciliation is secondary to a successfully loaded catalog.
        console.error('Failed to reconcile conversation models:', error);
      }
      updateEtag(response);
      modelsStore.setLastFetchOk(true);
      return { type: 'success' };
    } catch (error) {
      modelsStore.setLastFetchOk(false);
      return { type: 'request-failure', error };
    }
  }

  function startCatalogLoad(): Promise<CatalogLoadOutcome> {
    const request = loadAndApply();
    inFlight = request;
    const clear = (): void => {
      if (inFlight === request) inFlight = null;
    };
    void request.then(clear, clear);
    return request;
  }

  function presentOutcome(
    outcome: CatalogLoadOutcome,
    options: Required<FetchModelsOptions>,
  ): void {
    if (outcome.type === 'success' && options.refresh) {
      toast.success(
        i18n.global.t('toast.loadedModels', {
          count: modelsStore.models.length,
        }),
      );
      return;
    }
    if (outcome.type === 'http-failure') {
      if (options.silent) {
        console.warn(`Failed to fetch models: ${outcome.status}`);
      } else {
        toast.error(
          i18n.global.t('toast.failedLoadModelsStatus', {
            status: outcome.status,
          }),
        );
      }
      return;
    }
    if (outcome.type === 'request-failure') {
      console.error('Failed to fetch models:', outcome.error);
      if (!options.silent) {
        toast.error(i18n.global.t('toast.failedLoadModels'));
      }
    }
  }

  function setVisibleLoading(loading: boolean): void {
    visibleRequestCount = Math.max(0, visibleRequestCount + (loading ? 1 : -1));
    modelsStore.setModelsLoading(visibleRequestCount > 0);
  }

  async function fetchModels(options?: FetchModelsOptions): Promise<void> {
    const resolved: Required<FetchModelsOptions> = {
      refresh: options?.refresh ?? false,
      silent: options?.silent ?? false,
    };
    if (!resolved.silent) setVisibleLoading(true);
    try {
      const outcome = await (inFlight ?? startCatalogLoad());
      presentOutcome(outcome, resolved);
    } catch (error) {
      // Contain unexpected workflow failures so readiness always settles.
      modelsStore.setLastFetchOk(false);
      presentOutcome({ type: 'request-failure', error }, resolved);
    } finally {
      if (!resolved.silent) setVisibleLoading(false);
    }
  }

  function selectModel(modelName: string): void {
    modelsStore.setSelectedModel(modelName);
    saveConfig(SESSION_ID, { selectedModel: modelName }).catch(() => {
      // Offline: preserve the in-memory selection.
    });
  }

  async function whenModelsReady(): Promise<void> {
    if (modelsStore.modelsReady) return;
    await fetchModels();
  }

  return { fetchModels, selectModel, whenModelsReady };
}
