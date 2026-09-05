import { computed, ref } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { useMergeSelection } from '@/components/chat/exchange-list/composables/use-merge-selection';
import { buildConversationMetadata } from '@/components/chat/helpers/build-conversation-metadata.helper';
import { buildMergedPromptContent } from '@/components/chat/helpers/build-merged-prompt.helper';
import { buildModelVisionWarning } from '@/components/chat/helpers/build-model-vision-warning.helper';
import { buildSeededExchanges } from '@/components/chat/helpers/build-seeded-exchanges.helper';
import { classifySelectedFiles } from '@/components/chat/helpers/classify-selected-files.helper';
import { calcTotalContextPercentage } from '@/components/chat/shared/helpers/calc-token-percent.helper';
import {
  clearPendingFilesForConversation,
  makeKey,
  pendingFilesByConversation,
} from '@/composables/attached-files.state';
import { markMergePending } from '@/composables/merge-selection.state';
import {
  TOAST_KEY_CONTEXT_FULL,
  TOAST_KEY_MODEL_NO_IMAGES,
} from '@/composables/toast-keys';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { useAppStore } from '@/stores/app';
import type { Exchange, UploadedDocument } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';
import { useModelsStore } from '@/stores/models';
import type {
  ConversationMetadata,
  ConversationMetadataDocument,
  ConversationMetadataImage,
} from '@/types/form-query-params.model';
import { buildFormData } from '@/utils/build-form-data.helper';
import { buildHeaders } from '@/utils/build-headers.helper';
import { buildQueryParams } from '@/utils/build-query-params.helper';
import { handleResponse } from '@/utils/handle-response.helper';
import { requireModel } from '@/utils/require-model.helper';

import { mapDocumentEntry } from './helpers/map-document-entry.helper';
import { mapDocumentToOriginal } from './helpers/map-document-to-original.helper';
import { mapDocumentToPrompt } from './helpers/map-document-to-prompt.helper';
import type { SendRequestOptions, UseSubmitOptions } from './use-submit.types';

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

  async function buildConversation(mergedContent?: string): Promise<string> {
    if (mergedContent) {
      return JSON.stringify([{ role: 'user', content: mergedContent }]);
    }
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
    documents: ConversationMetadataDocument[],
    mergeOrigin?: string[],
  ) {
    for (const seeded of buildSeededExchanges({
      requestId,
      model,
      event,
      roomId: room,
      conversationId,
      userContent,
      images,
      documents,
      mergeOrigin,
    })) {
      conversationStore.addExchange(sid, seeded);
    }
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
    documents: ConversationMetadataDocument[],
  ) {
    for (const s of conversationStore.conversations) {
      if (s.id === sid) continue;
      if (s.event !== event) continue;

      for (const seeded of buildSeededExchanges({
        requestId,
        model,
        event,
        roomId: room,
        conversationId: s.conversationId,
        userContent,
        images,
        documents,
      })) {
        conversationStore.addExchange(s.id, seeded);
      }
    }
  }

  async function buildSubmitContext(): Promise<{
    sid: string;
    conversationId: string;
    model: string;
    event: string;
    room: string;
    requestId: string;
    userContent: string;
    isMergeSubmit: boolean;
    mergeFromRequestIds: string[];
    selectedForMerge: Exchange[];
  } | null> {
    if (!conversationModel.value) {
      // Cold-start guard: the models catalog may still be loading (or the
      // app-load fetch may have failed). Wait for it before failing with
      // "model required" so a prompt submitted right after reload never
      // hard-fails on the race.
      await modelsStore.whenModelsReady();
    }
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

    const mergeSelection = useMergeSelection();
    const selectedForMerge = sid ? mergeSelection.selectedExchanges(sid) : [];
    const isMergeSubmit = selectedForMerge.length > 0;
    const mergeFromRequestIds =
      sid && isMergeSubmit ? mergeSelection.selectedRequestIds(sid) : [];

    return {
      sid: sid ?? '',
      conversationId,
      model,
      event,
      room,
      requestId,
      userContent,
      isMergeSubmit,
      mergeFromRequestIds,
      selectedForMerge,
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
    return buildQueryParams({
      requestId,
      sessionId: sid ?? '',
      // Memory partition override (settings → system): empty = the session id is the partition.
      memoryPartition: appStore.memoryPartition,
      // Cognition space override (settings → system): empty = cognition lives in the memory partition.
      memoryCognition: appStore.memoryCognition,
      conversationId,
      roomId: room,
      stream: activeConversation.value?.stream ?? true,
      event,
      numCtx: activeConversation.value?.numCtx ?? '',
      think: activeConversation.value?.think ?? 'medium',
      hasNewImages,
      conversationMetadata,
      language: i18n.global.locale.value,
    });
  }

  async function submitRest() {
    const ctx = await buildSubmitContext();
    if (!ctx) return;

    const {
      sid,
      conversationId,
      model,
      event,
      room,
      requestId,
      userContent,
      isMergeSubmit,
      mergeFromRequestIds,
      selectedForMerge,
    } = ctx;

    ensureSocketSubscription(event, room);
    const socket = socketProvider.getSocket();

    const pendingEntries =
      pendingFilesByConversation.value.get(
        makeKey(sid ?? '', conversationId),
      ) ?? [];
    const selectedEntries = pendingEntries.filter(
      (entry) => entry.isSelected && entry.conversationId === conversationId,
    );
    const imageFiles = selectedEntries
      .filter((entry) => entry.kind === 'image')
      .map((entry) => entry.file);
    const documentEntries = selectedEntries.filter(
      (entry) => entry.kind === 'document',
    );
    const currentFiles = [
      ...imageFiles,
      ...documentEntries.map((entry) => entry.file),
    ];
    conversationStore.setFiles(sid!, currentFiles);

    const visionWarning = buildModelVisionWarning(
      model,
      modelsStore.getModel(model)?.capabilities,
      currentFiles,
    );
    if (visionWarning)
      toast.warning(visionWarning, { key: TOAST_KEY_MODEL_NO_IMAGES });

    const conversation = sid ? conversationStore.getConversation(sid) : null;
    const preUploadImages = conversation?.uploadedImages ?? [];
    const { newFiles, referencedImages } = await classifySelectedFiles(
      imageFiles,
      preUploadImages,
      conversationId,
    );

    const preUploadDocuments = conversation?.uploadedDocuments ?? [];
    const persistedSelectedDocuments = preUploadDocuments.filter(
      (doc) => doc.selected !== false,
    );
    const newDocuments: UploadedDocument[] = documentEntries.map((entry) =>
      mapDocumentEntry(entry, conversationId),
    );
    const newDocumentFiles = documentEntries.map((entry) => entry.file);
    const newOriginals = newDocuments.map(mapDocumentToOriginal);
    // Bubble tiles: pdf originals render as their page images (registered as
    // conversation images), never as a document icon.
    const promptDocuments = [...persistedSelectedDocuments, ...newDocuments]
      .filter((doc) => !doc.name.toLowerCase().endsWith('.pdf'))
      .map(mapDocumentToPrompt);

    const hasNewImages = newFiles.length > 0;

    const conversationMetadata = buildConversationMetadata(
      referencedImages,
      preUploadImages,
      conversationId,
      mergeFromRequestIds,
      newOriginals,
    );

    const promptImages = conversationMetadata.images ?? [];

    // A merge submit consolidates the selected exchanges into one user
    // message; the typed prompt text (if any) rides along as an additional
    // instruction. The seeded bubble renders a "Merged | <tags>" row from
    // mergeOrigin instead of the model-facing consolidated document, and the
    // seeded user exchange is kept even without typed text so the merge
    // marker always shows.
    const mergedPromptContent = isMergeSubmit
      ? buildMergedPromptContent(selectedForMerge, {
          extraInstruction: userContent,
        })
      : undefined;

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
        promptDocuments,
        mergeFromRequestIds,
      );
    }

    const conv = await buildConversation(mergedPromptContent);

    const formData = buildFormData(newFiles, {
      prompt: conv,
      originals: newDocumentFiles,
      documentTextLimit: appStore.documentTextLimit,
    });

    arguments_.value = '';
    persistArguments();

    // The selection is NOT consumed by the submit: the source icons keep
    // pulsing while the merged request is in flight. Only when the unified
    // response arrives (or fails) does the conversation store resolve the
    // pending merge — marking the sources as merged respectively leaving
    // them untouched for a retry.
    if (sid && isMergeSubmit) {
      markMergePending(sid, requestId);
    }

    addCrossSessionExchanges(
      sid,
      event,
      room,
      requestId,
      model,
      userContent,
      promptImages,
      promptDocuments,
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
      newDocuments,
      conversationId,
    });
  }

  async function sendRequest(options: SendRequestOptions) {
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
      newDocuments,
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
        toast.debug(msg);
        toast.error(
          i18n.global.t('toast.requestError', { status: res.status }),
        );
        const id = conversationStore.activeConversationId;
        if (id) conversationStore.markExchangeError(id, requestId, msg);
        return;
      }

      handleResponse(res, socket, toast);

      // Promote pending previews to uploaded metadata and clear the pending
      // attachment state for this conversation.
      if (sid) {
        conversationStore.setUploadedImages(sid, referencedImages);
        conversationStore.setUploadedDocuments(sid, newDocuments);
        clearPendingFilesForConversation(sid, conversationId);
        conversationStore.setFiles(sid, []);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.debug(msg);
      toast.error(i18n.global.t('toast.serverUnreachable'));
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
      toast.warning(i18n.global.t('toast.contextFull'), {
        key: TOAST_KEY_CONTEXT_FULL,
      });
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
