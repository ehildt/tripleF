import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useSocket } from '@/composables/use-socket/use-socket';
import { useAttachedFilesStore } from '@/stores/chat/attached-files/attached-files.store';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';

import { useAssistantRequest } from './use-assistant-request';
import type { PostHarnessRequestOptions } from './use-assistant-request.types';

const toast = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}));

const conversationImages = vi.hoisted(() => ({
  setUploadedImages: vi.fn(),
}));
const conversationDocuments = vi.hoisted(() => ({
  setUploadedDocuments: vi.fn(),
}));

vi.mock('./use-conversation-images', () => ({
  useConversationImages: () => conversationImages,
}));
vi.mock('./use-conversation-documents', () => ({
  useConversationDocuments: () => conversationDocuments,
}));

const completion = vi.hoisted(() => ({
  markExchangeError: vi.fn(),
}));

vi.mock('./use-conversation-exchange-completion', () => ({
  useConversationExchangeCompletion: () => completion,
}));

const debugRequestTracker = vi.hoisted(() => ({
  trackRequest: vi.fn(),
}));

vi.mock('@/components/debug/composables/use-debug-request-tracker', () => ({
  useDebugRequestTracker: () => debugRequestTracker,
}));

vi.mock('@/composables/use-toast/use-toast', () => ({ useToast: () => toast }));

vi.mock('@/i18n/i18n', () => ({
  i18n: { global: { t: (key: string) => key, locale: { value: 'en' } } },
}));

/**
 * The transport reads the socket facade from the socket composable and the
 * debug store. Spy the actions that would otherwise open a socket.io
 * connection (`ensureSocketConnection`) or append debug records
 * (`trackRequest`) in jsdom, and return spies the tests can assert against.
 */
function stubSocketProvider() {
  const socket = { connected: true };
  const socketStore = useSocket();
  vi.spyOn(socketStore, 'ensureSocketConnection').mockReturnValue(
    socket as unknown as ReturnType<typeof socketStore.ensureSocketConnection>,
  );
  const trackRequest = debugRequestTracker.trackRequest.mockResolvedValue(
    {} as Response,
  );
  return { socket, trackRequest };
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

describe('useAssistantRequest', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    toast.debug.mockClear();
    toast.error.mockClear();
    toast.success.mockClear();
    toast.warning.mockClear();
    conversationImages.setUploadedImages.mockClear();
    conversationDocuments.setUploadedDocuments.mockClear();
    completion.markExchangeError.mockClear();
    debugRequestTracker.trackRequest.mockClear();
  });

  it('posts, tracks the request, and promotes attachments on success', async () => {
    const fetchMock = stubHarnessFetch(() => ({ ok: true, status: 200 }));
    const { trackRequest } = stubSocketProvider();
    const conversationStore = useConversationStore();
    const conversation = useConversationCatalog().createNewConversation();
    const setSavedFileInfos = vi.spyOn(conversationStore, 'setSavedFileInfos');
    const markExchangeError = completion.markExchangeError;
    const clearPending = vi.spyOn(
      useAttachedFilesStore(),
      'clearPendingFilesForConversation',
    );

    const { postHarnessRequest } = useAssistantRequest();
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
    expect(trackRequest).toHaveBeenCalledWith(
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
    expect(conversationImages.setUploadedImages).toHaveBeenCalledWith(
      conversation.id,
      [],
    );
    expect(conversationDocuments.setUploadedDocuments).toHaveBeenCalledWith(
      conversation.id,
      [],
    );
    expect(setSavedFileInfos).toHaveBeenCalledWith(conversation.id, []);
    expect(clearPending).toHaveBeenCalledWith({
      parentConversationId: conversation.id,
      conversationId: 'cid-1',
    });
    expect(markExchangeError).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('toast.requestSent');
  });

  it('marks the exchange as errored when the response is not ok', async () => {
    stubHarnessFetch(() => ({
      ok: false,
      status: 500,
      text: async () => 'boom',
    }));
    stubSocketProvider();
    const conversation = useConversationCatalog().createNewConversation();

    const { postHarnessRequest } = useAssistantRequest();

    await postHarnessRequest(createRequest({ sid: conversation.id }));

    expect(completion.markExchangeError).toHaveBeenCalledWith(
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
    stubSocketProvider();
    const conversation = useConversationCatalog().createNewConversation();

    const { postHarnessRequest } = useAssistantRequest();

    await postHarnessRequest(createRequest({ sid: conversation.id }));

    expect(completion.markExchangeError).toHaveBeenCalledWith(
      conversation.id,
      'req-1',
      'network down',
    );
    expect(toast.debug).toHaveBeenCalledWith('network down');
    expect(toast.error).toHaveBeenCalledWith('toast.serverUnreachable');
  });

  it('skips attachment promotion when there is no session id', async () => {
    stubHarnessFetch(() => ({ ok: true, status: 200 }));
    stubSocketProvider();
    const clearPending = vi.spyOn(
      useAttachedFilesStore(),
      'clearPendingFilesForConversation',
    );

    const { postHarnessRequest } = useAssistantRequest();

    await postHarnessRequest(createRequest({ sid: '' }));

    expect(conversationImages.setUploadedImages).not.toHaveBeenCalled();
    expect(clearPending).not.toHaveBeenCalled();
  });
});
