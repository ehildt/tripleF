import { computed, ref } from 'vue';

import { getApiUrl } from '@/api/api-url';
import type { UploadedImage } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';
import { buildFormData } from '@/utils/build-form-data.helper';
import { buildHeaders } from '@/utils/build-headers.helper';
import {
  buildQueryParams,
  type ConversationMetadata,
  type ConversationMetadataImage,
} from '@/utils/build-query-params.helper';
import { handleResponse } from '@/utils/handle-response.helper';
import { hashFile } from '@/utils/hash-file.helper';
import { requireModel } from '@/utils/require-model.helper';

import { calcTotalContextPercentage } from '../components/chat/shared/helpers/calc-token-percent.helper';
import { useAppStore } from '../stores/app';
import { useModelsStore } from '../stores/models';
import type { SocketProvider } from '../types/socket-provider.model';
import { clearPendingFilesForConversation } from './attached-files.state';
import { useToast } from './use-toast';

interface UseSubmitOptions {
  socketProvider: SocketProvider;
  isEventConnected: (eventName: string) => boolean;
  isRoomConnected: (eventName: string, roomName: string) => boolean;
}

export function useSubmit(options: UseSubmitOptions) {
  const { socketProvider, isEventConnected, isRoomConnected } = options;

  const appStore = useAppStore();
  const conversationStore = useConversationStore();
  const modelsStore = useModelsStore();
  const toast = useToast();

  const loading = ref(false);
  const arguments_ = ref('');

  const STORAGE_KEY = 'api-fields';

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      arguments_.value = parsed.arguments_ ?? '';
    } catch {
      /* ignore */
    }
  }

  function persistArguments() {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      existing.arguments_ = arguments_.value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch {
      /* ignore */
    }
  }

  const activeConversation = computed(() => {
    if (!conversationStore.activeConversationId) return null;
    return (
      conversationStore.getConversation(
        conversationStore.activeConversationId,
      ) ?? null
    );
  });

  const conversationModel = computed(
    () => activeConversation.value?.model || modelsStore.selectedModel || '',
  );

  function isTokenContextFull(): boolean {
    const conversationId = conversationStore.activeConversationId;
    if (!conversationId) return false;
    const conversation = conversationStore.getConversation(conversationId);
    if (!conversation) return false;

    const percent = calcTotalContextPercentage(
      conversation.exchanges,
      conversation.numCtx ?? '',
    );
    if (percent == null) return false;
    return Number(percent) >= 100;
  }

  function ensureConversation(): string {
    if (conversationStore.activeConversationId)
      return conversationStore.activeConversationId;
    const s = conversationStore.createNewConversation();
    conversationStore.activeConversationId = s.id;
    return s.id;
  }

  function ensureSocketSubscription(eventName: string, room: string) {
    if (!isEventConnected(eventName)) {
      socketProvider.listenToEvent?.(eventName);
    }
    if (room && !isRoomConnected(eventName, room)) {
      socketProvider.joinRoom?.(room, eventName);
    }
  }

  function buildConversation(): string {
    const id = conversationStore.activeConversationId;
    if (!id)
      return JSON.stringify([
        { role: 'user', content: arguments_.value.trim() },
      ]);
    return conversationStore.buildPrompt(id);
  }

  function setupActiveSession(
    sid: string,
    conversationId: string,
    model: string,
    event: string,
    room: string,
    requestId: string,
    userContent: string,
    images: ConversationMetadataImage[],
  ) {
    if (userContent) {
      conversationStore.addExchange(sid, {
        role: 'user',
        content: userContent,
        requestId,
        status: 'done',
        model,
        event,
        roomId: room,
        conversationId,
        images,
      });
    }
    conversationStore.addExchange(sid, {
      role: 'assistant',
      content: '',
      requestId,
      status: 'pending',
      model,
      event,
      roomId: room,
      conversationId,
    });
    conversationStore.setModel(sid, model);
    const numCtx =
      conversationStore.getConversation(sid)?.numCtx ||
      activeConversation.value?.numCtx ||
      modelsStore.maxNumCtxForModel(model) ||
      '';
    conversationStore.setNumCtx(sid, numCtx);
    conversationStore.setStream(sid, activeConversation.value?.stream ?? true);
    conversationStore.setThink(
      sid,
      activeConversation.value?.think ?? 'medium',
    );
    const s = conversationStore.getConversation(sid);
    if (s) {
      s.event = event;
      s.roomId = room;
    }
  }

  function addCrossSessionExchanges(
    sid: string | null,
    event: string,
    room: string,
    requestId: string,
    model: string,
    userContent: string,
    images: ConversationMetadataImage[],
  ) {
    for (const s of conversationStore.conversations) {
      if (s.id === sid) continue;
      if (s.event !== event) continue;

      const conversationId = s.conversationId;

      if (userContent) {
        conversationStore.addExchange(s.id, {
          role: 'user',
          content: userContent,
          requestId,
          status: 'done',
          model,
          event,
          roomId: room,
          conversationId,
          images,
        });
      }
      conversationStore.addExchange(s.id, {
        role: 'assistant',
        content: '',
        requestId,
        status: 'pending',
        model,
        event,
        roomId: room,
        conversationId,
      });
    }
  }

  async function classifySelectedFiles(
    files: File[],
    uploadedImages: UploadedImage[],
    conversationId: string,
  ): Promise<{
    newFiles: File[];
    referencedImages: UploadedImage[];
  }> {
    const uploadedHashes = new Set(
      uploadedImages
        .filter((img) => img.conversationId === conversationId)
        .map((img) => img.hash),
    );
    const fileHashes = await Promise.all(files.map((file) => hashFile(file)));

    const referencedImages: UploadedImage[] = [];
    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const hash = fileHashes[i];
      referencedImages.push({
        name: file.name,
        hash,
        size: file.size,
        uploadedAt: Date.now(),
        conversationId,
      });
      if (!uploadedHashes.has(hash)) {
        newFiles.push(file);
      }
    }

    return {
      newFiles,
      referencedImages,
    };
  }

  function warnModelSupportsVision(model: string, files: File[]): boolean {
    const selectedModel = modelsStore.getModel(model);
    const supportsVision =
      selectedModel?.capabilities?.includes('vision') ?? true;
    if (files.length > 0 && !supportsVision) {
      toast.warning(
        `Model "${model}" does not support images. They will be excluded from this request.`,
      );
    }
    return true;
  }

  function buildConversationMetadata(
    referencedImages: UploadedImage[],
    uploadedImages: UploadedImage[],
    conversationId: string,
  ): ConversationMetadata {
    const selectedToolbarHashes = new Set(
      referencedImages.map((img) => img.hash),
    );
    const persistedSelectedImages = uploadedImages.filter(
      (img) =>
        img.conversationId === conversationId &&
        img.selected !== false &&
        !selectedToolbarHashes.has(img.hash),
    );

    return {
      images: [...referencedImages, ...persistedSelectedImages]
        .filter(
          (img) =>
            !('variant' in img) || !img.variant || img.variant === 'original',
        )
        .map(({ name, hash }) => ({ name, hash })),
    };
  }

  function buildSubmitContext(): {
    sid: string;
    conversationId: string;
    model: string;
    event: string;
    room: string;
    requestId: string;
    userContent: string;
  } | null {
    if (!requireModel(conversationModel, toast)) {
      loading.value = false;
      return null;
    }

    const model = conversationModel.value;
    const event = (activeConversation.value?.event ?? '').trim();
    const room = (activeConversation.value?.roomId ?? '').trim();
    const requestId = appStore.requestId;
    const userContent = arguments_.value.trim();
    const sid = conversationStore.activeConversationId;
    const conversationId = sid ? conversationStore.getConversationId(sid) : '';

    return {
      sid: sid ?? '',
      conversationId,
      model,
      event,
      room,
      requestId,
      userContent,
    };
  }

  function buildSubmitParams(
    requestId: string,
    sid: string,
    room: string,
    event: string,
    hasNewImages: boolean,
    conversationMetadata: ConversationMetadata,
    conversationId: string,
  ): URLSearchParams {
    const params = buildQueryParams({
      requestId: ref(requestId),
      sessionId: ref(sid ?? ''),
      conversationId: ref(conversationId),
      roomId: ref(room),
      stream: ref(activeConversation.value?.stream ?? true),
      event: ref(event),
      numCtx: ref(activeConversation.value?.numCtx ?? ''),
      think: ref(activeConversation.value?.think ?? 'medium'),
      hasNewImages: ref(hasNewImages),
      conversationMetadata: ref(conversationMetadata),
    });

    return params;
  }

  async function submitRest() {
    const ctx = buildSubmitContext();
    if (!ctx) return;

    const { sid, conversationId, model, event, room, requestId, userContent } =
      ctx;

    ensureSocketSubscription(event, room);
    const socket = socketProvider.getSocket();

    const currentFiles = conversationStore.getFiles(sid ?? '');
    conversationStore.setFiles(sid!, currentFiles);

    if (!warnModelSupportsVision(model, currentFiles)) {
      loading.value = false;
      return;
    }

    const conversation = sid ? conversationStore.getConversation(sid) : null;
    const preUploadImages = conversation?.uploadedImages ?? [];
    const { newFiles, referencedImages } = await classifySelectedFiles(
      currentFiles,
      preUploadImages,
      conversationId,
    );

    const hasNewImages = newFiles.length > 0;

    const conversationMetadata = buildConversationMetadata(
      referencedImages,
      preUploadImages,
      conversationId,
    );

    const promptImages = conversationMetadata.images ?? [];

    if (sid) {
      setupActiveSession(
        sid,
        conversationId,
        model,
        event,
        room,
        requestId,
        userContent,
        promptImages,
      );
    }

    console.log('[use-submit] submitting request', {
      requestId,
      conversationId: sid,
      hasNewImages,
      conversationMetadata,
    });

    const conv = buildConversation();
    console.log('[use-submit] conversation prompt', conv);

    const formData = buildFormData(newFiles, {
      prompt: conv,
    });

    arguments_.value = '';
    persistArguments();

    addCrossSessionExchanges(
      sid,
      event,
      room,
      requestId,
      model,
      userContent,
      promptImages,
    );

    const params = buildSubmitParams(
      requestId,
      sid,
      room,
      event,
      hasNewImages,
      conversationMetadata,
      conversationId,
    );

    socketProvider.addPendingMessage(
      event,
      room,
      requestId,
      activeConversation.value?.stream ?? true,
    );

    await sendRequest({
      model,
      requestId,
      sid,
      room,
      event,
      params,
      formData,
      socket,
      referencedImages,
      conversationId,
    });
  }

  async function sendRequest(options: {
    model: string;
    requestId: string;
    sid: string;
    room: string;
    event: string;
    params: URLSearchParams;
    formData: FormData;
    socket: ReturnType<SocketProvider['getSocket']>;
    referencedImages: UploadedImage[];
    conversationId: string;
  }) {
    const {
      model,
      requestId,
      sid,
      room,
      event,
      params,
      formData,
      socket,
      referencedImages,
      conversationId,
    } = options;

    const headers = buildHeaders(model);

    const fetchPromise = fetch(
      getApiUrl(`/api/v1/harness?${params.toString()}`),
      {
        method: 'POST',
        headers,
        body: formData,
      },
    );

    socketProvider.trackRequest(
      getApiUrl(
        `/api/v1/harness${params.toString() ? '?' + params.toString() : ''}`,
      ),
      'POST',
      fetchPromise,
      {
        headers,
        formData,
        requestId,
        roomId: room,
        event,
        numCtx: activeConversation.value?.numCtx ?? '',
        stream: activeConversation.value?.stream ?? true,
        model,
      },
    );

    try {
      const res = await fetchPromise;
      if (!res.ok) {
        const text = await res.text();
        const msg = `${res.status}: ${text}`;
        toast.error(msg);
        const id = conversationStore.activeConversationId;
        if (id) conversationStore.markExchangeError(id, requestId, msg);
        return;
      }

      handleResponse(res, socket, toast);

      // Promote pending previews to uploaded metadata and clear the pending
      // attachment state for this conversation.
      if (sid) {
        conversationStore.setUploadedImages(sid, referencedImages);
        clearPendingFilesForConversation(sid, conversationId);
        conversationStore.setFiles(sid, []);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
      const id = conversationStore.activeConversationId;
      if (id) conversationStore.markExchangeError(id, requestId, msg);
    } finally {
      loading.value = false;
    }
  }

  async function submit(text?: string) {
    if (text !== undefined) {
      arguments_.value = text;
    }

    if (isTokenContextFull()) {
      toast.warning(
        'Token context is full (100%). Increase numCtx to send more requests.',
      );
      return;
    }

    ensureConversation();

    appStore.refreshRequestId();
    loading.value = true;

    await submitRest();
  }

  return {
    loading,
    arguments_,
    submit,
    persistArguments,
  };
}
