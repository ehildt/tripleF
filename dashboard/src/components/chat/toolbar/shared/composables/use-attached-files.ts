import { computed, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { checkObjectExists } from '../../../../../api/storage.api';
import {
  clearPendingFilesForConversation,
  makeKey,
  pendingFilesByConversation,
} from '../../../../../composables/attached-files.state';
import type { AttachedFileEntry } from '../../../../../composables/attached-files.state.types';
import { hashFile } from '../../../../../utils/hash-file.helper';
import { createId } from '../../../../../utils/id.helper';

/**
 * Manages the file attachment lifecycle — selecting, toggling,
 * removing, and syncing to conversation store.
 *
 * Pending file state is kept in a module-level shallowRef map keyed by
 * parentConversationId + conversationId so it survives when the Chat component is
 * unmounted while the user switches to another tab.
 */
export function useAttachedFiles() {
  const conversationStore = useConversationStore();

  const activeConversationId = computed(
    () => conversationStore.activeConversationId ?? '',
  );
  const conversationId = computed(() => {
    const sid = activeConversationId.value;
    if (!sid) return '';
    return conversationStore.getConversationId(sid);
  });

  const attachedFiles = computed(() => {
    const sid = activeConversationId.value;
    const cid = conversationId.value;
    if (!sid || !cid) return [];
    return pendingFilesByConversation.value.get(makeKey(sid, cid)) ?? [];
  });

  const fileInputRef = ref<HTMLInputElement | null>(null);

  const selectedFiles = computed(() =>
    attachedFiles.value
      .filter((f) => f.isSelected && f.conversationId === conversationId.value)
      .map((f) => f.file),
  );

  function ensureConversation() {
    const sid = activeConversationId.value;
    if (!sid) return '';
    if (!conversationId.value) {
      conversationStore.setConversationId(sid, createId());
    }
    return conversationStore.getConversationId(sid);
  }

  function updateMap(
    sid: string,
    cid: string,
    updater: (files: AttachedFileEntry[]) => AttachedFileEntry[],
  ) {
    const key = makeKey(sid, cid);
    const map = new Map(pendingFilesByConversation.value);
    const current = map.get(key) ?? [];
    const next = updater(current);
    if (next.length === 0) {
      map.delete(key);
    } else {
      map.set(key, next);
    }
    pendingFilesByConversation.value = map;
  }

  async function onFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    const sid =
      activeConversationId.value || conversationStore.ensureConversation().id;
    const cid = ensureConversation() || createId();
    if (!sid) return;
    conversationStore.setConversationId(sid, cid);

    const currentHashes = new Set<string>([
      ...(pendingFilesByConversation.value.get(makeKey(sid, cid)) ?? []).map(
        (entry) => entry.hash,
      ),
      ...conversationStore
        .getUploadedImagesForConversation(sid, cid)
        .map((img) => img.hash),
    ]);

    for (const file of files) {
      const hash = await hashFile(file);
      if (currentHashes.has(hash)) continue;
      currentHashes.add(hash);

      const exists = await checkObjectExists(sid, cid, hash).catch(() => false);
      if (exists) {
        conversationStore.setUploadedImages(sid, [
          {
            name: file.name,
            hash,
            size: file.size,
            uploadedAt: Date.now(),
            selected: true,
            conversationId: cid,
          },
        ]);
      } else {
        updateMap(sid, cid, (list) => [
          ...list,
          {
            file,
            isSelected: true,
            objectUrl: URL.createObjectURL(file),
            hash,
            conversationId: cid,
          },
        ]);
      }
    }

    input.value = '';
  }

  function removeAttachedFile(index: number) {
    const sid = activeConversationId.value;
    const cid = conversationId.value;
    if (!sid || !cid) return;
    const entry = attachedFiles.value[index];
    if (!entry) return;
    URL.revokeObjectURL(entry.objectUrl);
    updateMap(sid, cid, (list) => {
      const next = [...list];
      next.splice(index, 1);
      return next;
    });
  }

  function toggleAttachedFile(index: number) {
    const sid = activeConversationId.value;
    const cid = conversationId.value;
    if (!sid || !cid) return;
    updateMap(sid, cid, (list) => {
      const next = [...list];
      if (next[index]) {
        next[index] = {
          ...next[index],
          isSelected: !next[index].isSelected,
        };
      }
      return next;
    });
  }

  function revokeAllObjectUrls() {
    for (const entries of pendingFilesByConversation.value.values()) {
      for (const entry of entries) {
        URL.revokeObjectURL(entry.objectUrl);
      }
    }
    pendingFilesByConversation.value = new Map();
  }

  // Sync selected files to conversation store
  watch(
    selectedFiles,
    (files) => {
      conversationStore.setFiles(activeConversationId.value, files);
    },
    { deep: true },
  );

  // Clean up pending files when a conversation is deleted.
  watch(
    () => conversationStore.conversations.length,
    () => {
      const activeIds = new Set(
        conversationStore.conversations.map((s) => s.id),
      );
      const map = new Map<string, AttachedFileEntry[]>();
      for (const [key, entries] of pendingFilesByConversation.value) {
        const sid = key.split(':')[0];
        if (!activeIds.has(sid)) {
          for (const entry of entries) {
            URL.revokeObjectURL(entry.objectUrl);
          }
          continue;
        }
        map.set(key, entries);
      }
      pendingFilesByConversation.value = map;
    },
  );

  function loadSessionFiles() {
    // Nothing to reconstruct from localStorage because File objects cannot be
    // serialized. The module-level map already holds live references if any
    // pending files were kept while Chat was unmounted.
  }

  return {
    attachedFiles,
    fileInputRef,
    selectedFiles,
    conversationId,
    onFileInputChange,
    removeAttachedFile,
    toggleAttachedFile,
    clearPendingFilesForConversation,
    revokeAllObjectUrls,
    loadSessionFiles,
  };
}
