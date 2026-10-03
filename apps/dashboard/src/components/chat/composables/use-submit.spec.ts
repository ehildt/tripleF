import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppStore } from '@/stores/app';
import { useConversationStore } from '@/stores/conversation';
import type { Exchange } from '@/stores/conversation.model';
import { useMergeSelectionStore } from '@/stores/merge-selection';
import { useApiMessagesStore } from '@/stores/messages';
import { useModelsStore } from '@/stores/models';
import { useSocketStore } from '@/stores/socket';

import type { PostHarnessRequestOptions } from './use-harness-request.types';
import { usePromptDraft } from './use-prompt-draft';
import { useSubmit } from './use-submit';

const toast = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}));

const postHarnessRequest = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('@/composables/use-toast', () => ({ useToast: () => toast }));

vi.mock('@/i18n/i18n', () => ({
  i18n: { global: { t: (key: string) => key, locale: { value: 'en' } } },
}));

vi.mock('./use-harness-request', () => ({
  useHarnessRequest: () => ({ postHarnessRequest }),
}));

/**
 * Route fetch so the stores' boot GETs get benign payloads. The harness POST
 * itself is mocked at the module boundary (`./use-harness-request`).
 */
function stubBenignFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => {
      const payload = String(input).includes('/conversations') ? [] : {};
      return {
        ok: true,
        status: 200,
        json: async () => payload,
        text: async () => JSON.stringify(payload),
      };
    }),
  );
}

/**
 * The submit path reads the socket facade from the real stores. Spy the
 * store actions that would otherwise open a socket.io connection in jsdom;
 * `addPendingMessage` is spied so the tests can assert the in-flight
 * registration without touching the messages store's internals.
 */
function stubSocketSideEffects() {
  const socketStore = useSocketStore();
  const apiMessagesStore = useApiMessagesStore();

  vi.spyOn(socketStore, 'listenToEvent').mockImplementation(() => {});
  vi.spyOn(socketStore, 'joinRoom').mockImplementation(() => {});
  const addPendingMessage = vi
    .spyOn(apiMessagesStore, 'addPendingMessage')
    .mockImplementation(() => {});

  return { addPendingMessage };
}

/** Seed the shared prompt draft that `useSubmit` reads and clears. */
function seedDraft(text = 'hello') {
  usePromptDraft().promptDraft.value = text;
}

function userExchange(overrides: Partial<Exchange> = {}): Exchange {
  return {
    id: 'ex-1',
    role: 'user',
    content: 'question',
    status: 'done',
    timestamp: 0,
    ...overrides,
  };
}

describe('useSubmit', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    stubBenignFetch();
    toast.debug.mockClear();
    toast.error.mockClear();
    toast.success.mockClear();
    toast.warning.mockClear();
    postHarnessRequest.mockClear();
    usePromptDraft().promptDraft.value = '';
  });

  it('submits the prompt through the harness transport', async () => {
    seedDraft();
    const { addPendingMessage } = stubSocketSideEffects();
    const conversationStore = useConversationStore();
    const conversation = conversationStore.createNewConversation();
    conversation.model = 'llama3';
    vi.spyOn(conversationStore, 'buildPrompt').mockResolvedValue('[]');

    const { isSubmitting, submit } = useSubmit();
    await submit();

    expect(postHarnessRequest).toHaveBeenCalledTimes(1);
    const request = postHarnessRequest.mock
      .calls[0]![0] as unknown as PostHarnessRequestOptions;
    expect(request).toMatchObject({
      model: 'llama3',
      sid: conversation.id,
      referencedImages: [],
      newDocuments: [],
    });
    expect(request.params).toBeInstanceOf(URLSearchParams);
    expect(request.params.get('sessionId')).toBe(conversation.id);
    expect(request.params.get('requestId')).toBe(useAppStore().requestId);
    expect(request.formData).toBeInstanceOf(FormData);
    expect(usePromptDraft().promptDraft.value).toBe('');
    expect(addPendingMessage).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      useAppStore().requestId,
      true,
    );
    expect(isSubmitting.value).toBe(false);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('warns and skips the submit when the context is full', async () => {
    seedDraft();
    const conversationStore = useConversationStore();
    const conversation = conversationStore.createNewConversation();
    conversation.model = 'llama3';
    conversation.numCtx = '100';
    conversation.exchanges = [
      {
        id: 'a-1',
        role: 'assistant',
        content: 'answer',
        status: 'done',
        timestamp: 0,
        inputTokenDelta: 100,
        evalCount: 0,
      },
    ];

    const { submit } = useSubmit();
    await submit();

    expect(postHarnessRequest).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith('toast.contextFull', {
      key: expect.any(String),
    });
  });

  it('stops before the transport when no model is available', async () => {
    seedDraft();
    const conversationStore = useConversationStore();
    conversationStore.createNewConversation();
    const modelsStore = useModelsStore();
    vi.spyOn(modelsStore, 'whenModelsReady').mockResolvedValue(undefined);

    const { isSubmitting, submit } = useSubmit();
    await submit();

    expect(postHarnessRequest).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('toast.modelRequired');
    expect(isSubmitting.value).toBe(false);
  });

  it('marks the merge as pending for a merge submit', async () => {
    seedDraft();
    stubSocketSideEffects();
    const conversationStore = useConversationStore();
    const conversation = conversationStore.createNewConversation();
    conversation.model = 'llama3';
    conversation.exchanges = [userExchange({ id: 'ex-1', requestId: 'req-a' })];
    const mergeSelectionStore = useMergeSelectionStore();
    mergeSelectionStore.setMergeSelectedIds(conversation.id, ['ex-1']);
    const markMergePending = vi.spyOn(mergeSelectionStore, 'markMergePending');

    const { submit } = useSubmit();
    await submit();

    expect(markMergePending).toHaveBeenCalledWith(
      conversation.id,
      useAppStore().requestId,
    );
    expect(postHarnessRequest).toHaveBeenCalledTimes(1);
  });
});
