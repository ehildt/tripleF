import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAttachedFilesStore } from '@/stores/attached-files';
import { useConversationStore } from '@/stores/conversation';
import type { SocketProvider } from '@/types/socket-provider.model';

import { useHarnessRequest } from './use-harness-request';
import type { PostHarnessRequestOptions } from './use-harness-request.types';

const toast = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}));

vi.mock('@/composables/use-toast', () => ({ useToast: () => toast }));

vi.mock('@/i18n/i18n', () => ({
  i18n: { global: { t: (key: string) => key, locale: { value: 'en' } } },
}));

function createSocketProvider() {
  const socket = { connected: true };
  const provider = {
    getSocket: vi.fn(() => socket),
    trackRequest: vi.fn(),
    connectedEvents: new Set<string>(),
    connectedRooms: new Map<string, Set<string>>(),
  };
  return { provider: provider as unknown as SocketProvider, socket };
}

/**
 * Stubs `fetch` so the harness endpoint returns the given result, while the
 * conversation store's boot GET gets a benign empty list.
 */
function stubHarnessFetch(harnessResponse: () => unknown) {
  const fetchMock = vi.fn(async (input: unknown) => {
    if (String(input).includes('/api/v1/harness')) return harnessResponse();
    return {
      ok: true,
      status: 200,
      text: async () => '[]',
      json: async () => [],
    };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function createRequest(
  overrides: Partial<PostHarnessRequestOptions> = {},
): PostHarnessRequestOptions {
  return {
    model: 'llama3',
    requestId: 'req-1',
    sid: 'sid-1',
    room: 'room-1',
    event: 'chat',
    params: new URLSearchParams({ requestId: 'req-1' }),
    formData: new FormData(),
    stream: true,
    numCtx: '4096',
    referencedImages: [],
    newDocuments: [],
    conversationId: 'cid-1',
    ...overrides,
  };
}

describe('useHarnessRequest', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    toast.debug.mockClear();
    toast.error.mockClear();
    toast.success.mockClear();
    toast.warning.mockClear();
  });

  it('posts, tracks the request, and promotes attachments on success', async () => {
    const fetchMock = stubHarnessFetch(() => ({ ok: true, status: 200 }));
    const { provider } = createSocketProvider();
    const conversationStore = useConversationStore();
    const conversation = conversationStore.createNewConversation();
    const setUploadedImages = vi.spyOn(conversationStore, 'setUploadedImages');
    const setUploadedDocuments = vi.spyOn(
      conversationStore,
      'setUploadedDocuments',
    );
    const setFiles = vi.spyOn(conversationStore, 'setFiles');
    const markExchangeError = vi.spyOn(conversationStore, 'markExchangeError');
    const clearPending = vi.spyOn(
      useAttachedFilesStore(),
      'clearPendingFilesForConversation',
    );

    const { postHarnessRequest } = useHarnessRequest({
      socketProvider: provider,
    });
    const request = createRequest({
      sid: conversation.id,
      referencedImages: [],
      newDocuments: [],
    });

    await postHarnessRequest(request);

    const harnessCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/api/v1/harness'),
    );
    expect(harnessCall).toBeDefined();
    const [url, init] = harnessCall as unknown as [
      string,
      { method: string; body: FormData },
    ];
    expect(url).toContain('/api/v1/harness?requestId=req-1');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(request.formData);
    expect(provider.trackRequest).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/harness?requestId=req-1'),
      'POST',
      expect.anything(),
      expect.objectContaining({
        requestId: 'req-1',
        roomId: 'room-1',
        event: 'chat',
        numCtx: '4096',
        stream: true,
        model: 'llama3',
      }),
    );
    expect(setUploadedImages).toHaveBeenCalledWith(conversation.id, []);
    expect(setUploadedDocuments).toHaveBeenCalledWith(conversation.id, []);
    expect(setFiles).toHaveBeenCalledWith(conversation.id, []);
    expect(clearPending).toHaveBeenCalledWith(conversation.id, 'cid-1');
    expect(markExchangeError).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('toast.requestSent');
  });

  it('marks the exchange as errored when the response is not ok', async () => {
    stubHarnessFetch(() => ({
      ok: false,
      status: 500,
      text: async () => 'boom',
    }));
    const { provider } = createSocketProvider();
    const conversationStore = useConversationStore();
    const conversation = conversationStore.createNewConversation();
    const markExchangeError = vi.spyOn(conversationStore, 'markExchangeError');

    const { postHarnessRequest } = useHarnessRequest({
      socketProvider: provider,
    });

    await postHarnessRequest(createRequest({ sid: conversation.id }));

    expect(markExchangeError).toHaveBeenCalledWith(
      conversation.id,
      'req-1',
      '500: boom',
    );
    expect(toast.debug).toHaveBeenCalledWith('500: boom');
    expect(toast.error).toHaveBeenCalledWith('toast.requestError');
  });

  it('marks the exchange as errored when the request throws', async () => {
    stubHarnessFetch(() => {
      throw new Error('network down');
    });
    const { provider } = createSocketProvider();
    const conversationStore = useConversationStore();
    const conversation = conversationStore.createNewConversation();
    const markExchangeError = vi.spyOn(conversationStore, 'markExchangeError');

    const { postHarnessRequest } = useHarnessRequest({
      socketProvider: provider,
    });

    await postHarnessRequest(createRequest({ sid: conversation.id }));

    expect(markExchangeError).toHaveBeenCalledWith(
      conversation.id,
      'req-1',
      'network down',
    );
    expect(toast.debug).toHaveBeenCalledWith('network down');
    expect(toast.error).toHaveBeenCalledWith('toast.serverUnreachable');
  });

  it('skips attachment promotion when there is no session id', async () => {
    stubHarnessFetch(() => ({ ok: true, status: 200 }));
    const { provider } = createSocketProvider();
    const conversationStore = useConversationStore();
    const setUploadedImages = vi.spyOn(conversationStore, 'setUploadedImages');
    const clearPending = vi.spyOn(
      useAttachedFilesStore(),
      'clearPendingFilesForConversation',
    );

    const { postHarnessRequest } = useHarnessRequest({
      socketProvider: provider,
    });

    await postHarnessRequest(createRequest({ sid: '' }));

    expect(setUploadedImages).not.toHaveBeenCalled();
    expect(clearPending).not.toHaveBeenCalled();
  });
});
