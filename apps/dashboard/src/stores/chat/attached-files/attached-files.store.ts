import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

import { buildPendingFilesKey } from './helpers/build-pending-files-key.helper';
import { updatePendingFilesMap } from './helpers/update-pending-files-map.helper';
import type { AttachedFileEntry } from './attached-files.model';
import type { PendingAttachmentScope } from './attached-files.store.types';

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
    return (
      pendingFilesByConversation.value.get(buildPendingFilesKey(scope)) ?? []
    );
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
    const key = buildPendingFilesKey(scope);
    const next = updater(pendingFilesByConversation.value.get(key) ?? []);
    pendingFilesByConversation.value = updatePendingFilesMap(
      pendingFilesByConversation.value,
      key,
      next,
    );
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
    pendingFilesByConversation.value = updatePendingFilesMap(
      pendingFilesByConversation.value,
      buildPendingFilesKey(scope),
      [],
    );
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
