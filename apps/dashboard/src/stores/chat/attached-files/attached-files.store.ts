import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

import type { AttachedFileEntry } from './attached-files.model';
import type { PendingAttachmentScope } from './attached-files.store.types';

function pendingFilesKey(scope: PendingAttachmentScope): string {
  return JSON.stringify([scope.parentConversationId, scope.conversationId]);
}

/**
 * Shared pending attachment data, keyed by explicit conversation identity.
 * Intake, active-conversation resolution, and object-URL effects belong to
 * their Chat composables; this store only owns entries and their mutations.
 */
export const useAttachedFilesStore = defineStore('attachedFiles', () => {
  const pendingFilesByConversation = shallowRef(
    new Map<string, AttachedFileEntry[]>(),
  );

  function pendingFilesFor(scope: PendingAttachmentScope): AttachedFileEntry[] {
    return pendingFilesByConversation.value.get(pendingFilesKey(scope)) ?? [];
  }

  function selectedPendingEntriesFor(
    scope: PendingAttachmentScope,
  ): AttachedFileEntry[] {
    return pendingFilesFor(scope).filter(
      (entry) =>
        entry.isSelected && entry.conversationId === scope.conversationId,
    );
  }

  function updatePendingFiles(
    scope: PendingAttachmentScope,
    updater: (files: AttachedFileEntry[]) => AttachedFileEntry[],
  ): void {
    const key = pendingFilesKey(scope);
    const map = new Map(pendingFilesByConversation.value);
    const next = updater(map.get(key) ?? []);
    if (next.length === 0) {
      map.delete(key);
    } else {
      map.set(key, next);
    }
    pendingFilesByConversation.value = map;
  }

  function appendPendingFile(
    scope: PendingAttachmentScope,
    entry: AttachedFileEntry,
  ): void {
    updatePendingFiles(scope, (entries) => [...entries, entry]);
  }

  function removePendingFile(
    scope: PendingAttachmentScope,
    entryId: string,
  ): void {
    updatePendingFiles(scope, (entries) =>
      entries.filter((entry) => entry.id !== entryId),
    );
  }

  function togglePendingFile(
    scope: PendingAttachmentScope,
    entryId: string,
  ): void {
    updatePendingFiles(scope, (entries) =>
      entries.map((entry) =>
        entry.id === entryId
          ? { ...entry, isSelected: !entry.isSelected }
          : entry,
      ),
    );
  }

  function clearPendingFilesForConversation(
    scope: PendingAttachmentScope,
  ): void {
    const map = new Map(pendingFilesByConversation.value);
    map.delete(pendingFilesKey(scope));
    pendingFilesByConversation.value = map;
  }

  function clearPendingFiles(): void {
    pendingFilesByConversation.value = new Map();
  }

  return {
    pendingFilesByConversation,
    pendingFilesFor,
    selectedPendingEntriesFor,
    appendPendingFile,
    removePendingFile,
    togglePendingFile,
    clearPendingFilesForConversation,
    clearPendingFiles,
  };
});
