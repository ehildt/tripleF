import { computed, ref } from 'vue';

import { buildFormData } from '@/components/chat/composables/helpers/build-form-data.helper';
import { requireModel } from '@/components/chat/composables/helpers/require-model.helper';
import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationConfiguration } from '@/components/chat/composables/use-conversation-configuration';
import { useConversationPrompt } from '@/components/chat/composables/use-conversation-prompt';
import { useConversationTurns } from '@/components/chat/composables/use-conversation-turns';
import { useSocketProvider } from '@/components/chat/composables/use-socket-provider';
import { buildConversationMetadata } from '@/components/chat/helpers/build-conversation-metadata.helper';
import { buildMergedPromptContent } from '@/components/chat/helpers/build-merged-prompt.helper';
import { buildSeededExchanges } from '@/components/chat/helpers/build-seeded-exchanges.helper';
import { classifySelectedFiles } from '@/components/chat/helpers/classify-selected-files.helper';
import { hasVisionConflict } from '@/components/chat/helpers/has-vision-conflict.helper';
import { useConversationSession } from '@/components/chat/shared/composables/use-conversation-session';
import { useMergeSelection } from '@/components/chat/shared/composables/use-merge-selection';
import { calcTotalContextPercentage } from '@/components/chat/shared/helpers/calc-total-context-percentage.helper';
import {
  TOAST_KEY_CONTEXT_FULL,
  TOAST_KEY_MODEL_NO_IMAGES,
} from '@/composables/toast-keys.constant';
import { useToast } from '@/composables/use-toast/use-toast';
import { i18n } from '@/i18n/i18n';
import { useAttachedFilesStore } from '@/stores/chat/attached-files/attached-files.store';
import type {
  Exchange,
  UploadedDocument,
} from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { useMergeSelectionStore } from '@/stores/chat/conversation/merge-selection/merge-selection.store';
import { useConversationSettingsStore } from '@/stores/chat/conversation-settings/conversation-settings.store';
import { useMemorySpacesStore } from '@/stores/memory/memory-spaces/memory-spaces.store';
import { useModelsStore } from '@/stores/models/models.store';
import type {
  ConversationMetadataDocument,
  ConversationMetadataImage,
} from '@/types/form-query-params.model';
import { createId } from '@/utils/create-id/create-id.helper';

import { buildSubmitQueryParams } from './helpers/build-submit-query-params.helper';
import { mapDocumentEntry } from './helpers/map-document-entry.helper';
import { mapDocumentToOriginal } from './helpers/map-document-to-original.helper';
import { mapDocumentToPrompt } from './helpers/map-document-to-prompt.helper';
import { useAssistantRequest } from './use-assistant-request';
import { usePromptDraft } from './use-prompt-draft';

export function useSubmit() {
  const { promptDraft, resetPromptDraft } = usePromptDraft();
  const socketProvider = useSocketProvider();

  const conversationSettingsStore = useConversationSettingsStore();
  const memorySpacesStore = useMemorySpacesStore();
  const conversationStore = useConversationStore();
  const conversationSession = useConversationSession();
  const mergeSelectionStore = useMergeSelectionStore();
  const catalog = useConversationCatalog();
  const configuration = useConversationConfiguration();
  const turns = useConversationTurns();
  const conversationPrompt = useConversationPrompt();
  const modelsStore = useModelsStore();
  const attachedFilesStore = useAttachedFilesStore();
  const mergeSelection = useMergeSelection();
  const toast = useToast();
  const { postHarnessRequest } = useAssistantRequest();

  const isSubmitting = ref(false);

  const activeConversation = computed(() => {
    if (!conversationSession.activeConversationId.value) return null;
    return (
      conversationStore.getConversation(
        conversationSession.activeConversationId.value,
      ) ?? null
    );
  });

  const conversationModel = computed(
    () => activeConversation.value?.model || modelsStore.selectedModel || '',
  );

  function isTokenContextFull(): boolean {
    const conversationId = conversationSession.activeConversationId.value;
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

  function ensureActiveConversation(): string {
    if (conversationSession.activeConversationId.value)
      return conversationSession.activeConversationId.value;
    return catalog.ensureConversation().id;
  }

  function ensureSocketSubscription(eventName: string, room: string) {
    if (!socketProvider.connectedEvents.has(eventName)) {
      socketProvider.listenToEvent?.(eventName);
    }
    if (
      room &&
      !(socketProvider.connectedRooms.get(eventName)?.has(room) ?? false)
    ) {
      socketProvider.joinRoom?.(room, eventName);
    }
  }

  async function buildPromptPayload(mergedContent?: string): Promise<string> {
    if (mergedContent) {
      return JSON.stringify([{ role: 'user', content: mergedContent }]);
    }
    const id = conversationSession.activeConversationId.value;
    if (!id)
      return JSON.stringify([
        { role: 'user', content: promptDraft.value.trim() },
      ]);
    return conversationPrompt.buildPrompt(id);
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
    void turns.seedConversationTurn({
      conversationStoreId: sid,
      exchanges: buildSeededExchanges({
        requestId,
        model,
        event,
        roomId: room,
        conversationId,
        userContent,
        images,
        documents,
        mergeOrigin,
      }),
      model,
      numCtx:
        conversationStore.getConversation(sid)?.numCtx ||
        activeConversation.value?.numCtx ||
        modelsStore.maxNumCtxForModel(model) ||
        '',
      think: activeConversation.value?.think ?? 'medium',
      stream: activeConversation.value?.stream ?? true,
      event,
      roomId: room,
      patchConfiguration: true,
      defaultTitle: i18n.global.t('common.newConversation'),
    });
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

      void turns.seedConversationTurn({
        conversationStoreId: s.id,
        exchanges: buildSeededExchanges({
          requestId,
          model,
          event,
          roomId: room,
          conversationId: s.conversationId,
          userContent,
          images,
          documents,
        }),
        model,
        numCtx: s.numCtx,
        think: s.think,
        stream: s.stream,
        event,
        roomId: room,
        patchConfiguration: false,
        defaultTitle: i18n.global.t('common.newConversation'),
      });
    }
  }

  async function buildSubmitContext(requestId: string): Promise<{
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
      return null;
    }

    const model = conversationModel.value;
    const event = (activeConversation.value?.event ?? '').trim();
    const room = (activeConversation.value?.roomId ?? '').trim();
    const userContent = promptDraft.value.trim();
    const sid = conversationSession.activeConversationId.value;
    const conversationId = sid ? conversationStore.getConversationId(sid) : '';

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

  async function submitCurrentPrompt(submitRequestId: string) {
    const ctx = await buildSubmitContext(submitRequestId);
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

    const selectedEntries = attachedFilesStore.selectedPendingEntriesFor({
      parentConversationId: sid ?? '',
      conversationId,
    });
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
    void configuration.setSavedFileInfos(sid!, currentFiles);

    if (
      hasVisionConflict(modelsStore.getModel(model)?.capabilities, currentFiles)
    ) {
      toast.warning(i18n.global.t('toast.modelNoImages', { model }), {
        key: TOAST_KEY_MODEL_NO_IMAGES,
      });
    }

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

    const conv = await buildPromptPayload(mergedPromptContent);

    const formData = buildFormData(newFiles, {
      prompt: conv,
      originals: newDocumentFiles,
      documentTextLimit: conversationSettingsStore.documentTextLimit,
    });

    resetPromptDraft();

    // The selection is NOT consumed by the submit: the source icons keep
    // pulsing while the merged request is in flight. Only when the unified
    // response arrives (or fails) does the conversation store resolve the
    // pending merge — marking the sources as merged respectively leaving
    // them untouched for a retry.
    if (sid && isMergeSubmit) {
      mergeSelectionStore.markMergePending(sid, requestId);
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

    const params = buildSubmitQueryParams({
      requestId,
      sessionId: sid ?? '',
      memoryPartition: memorySpacesStore.memoryPartition,
      memoryCognition: memorySpacesStore.memoryCognition,
      conversationId,
      roomId: room,
      stream: activeConversation.value?.stream,
      event,
      numCtx: activeConversation.value?.numCtx,
      think: activeConversation.value?.think,
      hasNewImages,
      conversationMetadata,
      language: i18n.global.locale.value,
    });

    socketProvider.addPendingMessage(
      event,
      room,
      requestId,
      activeConversation.value?.stream ?? true,
    );

    await postHarnessRequest({
      model,
      requestId,
      sid,
      room,
      event,
      params,
      formData,
      stream: activeConversation.value?.stream ?? true,
      numCtx: activeConversation.value?.numCtx ?? '',
      referencedImages,
      newDocuments,
      conversationId,
    });
  }

  async function submit(text?: string) {
    if (text !== undefined) {
      promptDraft.value = text;
    }

    if (isTokenContextFull()) {
      toast.warning(i18n.global.t('toast.contextFull'), {
        key: TOAST_KEY_CONTEXT_FULL,
      });
      return;
    }

    ensureActiveConversation();

    const requestId = createId();
    isSubmitting.value = true;

    try {
      await submitCurrentPrompt(requestId);
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    isSubmitting,
    submit,
  };
}
