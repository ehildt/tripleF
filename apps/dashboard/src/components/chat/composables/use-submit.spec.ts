import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Ref, ref } from 'vue';

import { useAppStore } from '@/stores/app';
import { useConversationStore } from '@/stores/conversation';
import type { Exchange } from '@/stores/conversation.model';
import { useMergeSelectionStore } from '@/stores/merge-selection';
import { useModelsStore } from '@/stores/models';
import type { SocketProvider } from '@/types/socket-provider.model';

import type { PostHarnessRequestOptions } from './use-harness-request.types';
import { useSubmit } from './use-submit';
import type { UseSubmitOptions } from './use-submit.types';

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

function createSocketProvider() {
  const addPendingMessage = vi.fn();
  const listenToEvent = vi.fn();
  const joinRoom = vi.fn();
  const provider = {
    getSocket: vi.fn(() => ({ connected: true })),
    trackRequest: vi.fn(),
    addPendingMessage,
    listenToEvent,
    joinRoom,
    connectedEvents: new Set<string>(),
    connectedRooms: new Map<string, Set<string>>(),
  };
  return {
    socketProvider: provider as unknown as SocketProvider,
    addPendingMessage,
    listenToEvent,
    joinRoom,
  };
}

/** Route fetch so the stores' boot GETs get benign payloads. */
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

function createOptions(promptText = 'hello') {
  const promptDraft = ref(promptText);
  const resetPromptDraft = vi.fn();
  const socket = createSocketProvider();
  const options: UseSubmitOptions = {
    socketProvider: socket.socketProvider,
    isEventConnected: () => false,
    isRoomConnected: () => false,
    promptDraft: promptDraft as Ref<string>,
    resetPromptDraft,
  };
  return { options, promptDraft, resetPromptDraft, ...socket };
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
  });

  it('submits the prompt through the harness transport', async () => {
    const { options, resetPromptDraft, addPendingMessage } = createOptions();
    const conversationStore = useConversationStore();
    const conversation = conversationStore.createNewConversation();
    conversation.model = 'llama3';
    vi.spyOn(conversationStore, 'buildPrompt').mockResolvedValue('[]');

    const { isSubmitting, submit } = useSubmit(options);
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
    expect(resetPromptDraft).toHaveBeenCalledTimes(1);
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
    const { options } = createOptions();
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

    const { submit } = useSubmit(options);
    await submit();

    expect(postHarnessRequest).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith('toast.contextFull', {
      key: expect.any(String),
    });
  });

  it('stops before the transport when no model is available', async () => {
    const { options } = createOptions();
    const conversationStore = useConversationStore();
    conversationStore.createNewConversation();
    const modelsStore = useModelsStore();
    vi.spyOn(modelsStore, 'whenModelsReady').mockResolvedValue(undefined);

    const { isSubmitting, submit } = useSubmit(options);
    await submit();

    expect(postHarnessRequest).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('toast.modelRequired');
    expect(isSubmitting.value).toBe(false);
  });

  it('marks the merge as pending for a merge submit', async () => {
    const { options } = createOptions();
    const conversationStore = useConversationStore();
    const conversation = conversationStore.createNewConversation();
    conversation.model = 'llama3';
    conversation.exchanges = [userExchange({ id: 'ex-1', requestId: 'req-a' })];
    const mergeSelectionStore = useMergeSelectionStore();
    mergeSelectionStore.setMergeSelectedIds(conversation.id, ['ex-1']);
    const markMergePending = vi.spyOn(mergeSelectionStore, 'markMergePending');

    const { submit } = useSubmit(options);
    await submit();

    expect(markMergePending).toHaveBeenCalledWith(
      conversation.id,
      useAppStore().requestId,
    );
    expect(postHarnessRequest).toHaveBeenCalledTimes(1);
  });
});
