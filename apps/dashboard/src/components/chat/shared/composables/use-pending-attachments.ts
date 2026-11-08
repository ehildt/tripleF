import { computed, type ComputedRef } from 'vue';

import type {
  AttachedFileEntry,
  AttachedFileKind,
} from '@/stores/chat/attached-files/attached-files.model';
import { useAttachedFilesStore } from '@/stores/chat/attached-files/attached-files.store';
import type { PendingAttachmentScope } from '@/stores/chat/attached-files/attached-files.store.types';
import { useConversationStore } from '@/stores/conversation/conversation.store';
import { createId } from '@/utils/create-id/create-id.helper';

interface PendingAttachments {
  attachedFiles: ComputedRef<AttachedFileEntry[]>;
  selectedFiles: ComputedRef<File[]>;
  addPendingFile: (
    scope: PendingAttachmentScope,
    file: File,
    hash: string,
    kind: AttachedFileKind,
  ) => void;
  removePendingFile: (entryId: string) => void;
  togglePendingFile: (entryId: string) => void;
  clearPendingFiles: (scope: PendingAttachmentScope) => void;
}

/**
 * Resolves the active attachment pair and owns browser object-URL resources.
 * The underlying entries remain in Pinia so they survive Chat unmounts.
 */
export function usePendingAttachments(): PendingAttachments {
  const attachedFilesStore = useAttachedFilesStore();
  const conversationStore = useConversationStore();

  const activeScope = computed<PendingAttachmentScope | null>(() => {
    const parentConversationId = conversationStore.activeConversationId;
    if (!parentConversationId) return null;
    const conversationId =
      conversationStore.getConversationId(parentConversationId);
    if (!conversationId) return null;
    return { parentConversationId, conversationId };
  });

  const attachedFiles = computed<AttachedFileEntry[]>(() => {
    const scope = activeScope.value;
    return scope ? attachedFilesStore.pendingFilesFor(scope) : [];
  });

  const selectedFiles = computed<File[]>(() => {
    const scope = activeScope.value;
    return scope
      ? attachedFilesStore
          .selectedPendingEntriesFor(scope)
          .map((entry) => entry.file)
      : [];
  });

  function addPendingFile(
    scope: PendingAttachmentScope,
    file: File,
    hash: string,
    kind: AttachedFileKind,
  ): void {
    attachedFilesStore.appendPendingFile(scope, {
      id: createId(),
      file,
      isSelected: true,
      objectUrl: kind === 'image' ? URL.createObjectURL(file) : '',
      hash,
      conversationId: scope.conversationId,
      kind,
    });
  }

  function removePendingFile(entryId: string): void {
    const scope = activeScope.value;
    if (!scope) return;
    const entry = attachedFilesStore
      .pendingFilesFor(scope)
      .find((candidate) => candidate.id === entryId);
    if (!entry) return;
    URL.revokeObjectURL(entry.objectUrl);
    attachedFilesStore.removePendingFile(scope, entryId);
  }

  function togglePendingFile(entryId: string): void {
    const scope = activeScope.value;
    if (!scope) return;
    attachedFilesStore.togglePendingFile(scope, entryId);
  }

  function clearPendingFiles(scope: PendingAttachmentScope): void {
    for (const entry of attachedFilesStore.pendingFilesFor(scope)) {
      URL.revokeObjectURL(entry.objectUrl);
    }
    attachedFilesStore.clearPendingFilesForConversation(scope);
  }

  return {
    attachedFiles,
    selectedFiles,
    addPendingFile,
    removePendingFile,
    togglePendingFile,
    clearPendingFiles,
  };
}
