import { computed, ref, watch } from 'vue';

import { convertDocuments } from '../../../../../api/documents.api';
import { checkObjectExists } from '../../../../../api/storage.api';
import {
  clearPendingFilesForConversation,
  makeKey,
  pendingFilesByConversation,
} from '../../../../../composables/attached-files.state';
import type { AttachedFileEntry } from '../../../../../composables/attached-files.state.types';
import { useToast } from '../../../../../composables/use-toast';
import { i18n } from '../../../../../i18n/i18n';
import { useConversationStore } from '../../../../../stores/conversation';
import { hashFile } from '../../../../../utils/hash-file.helper';
import { createId } from '../../../../../utils/id.helper';
import { classifyAttachedFile } from '../helpers/classify-attached-file.helper';
import { mapPageToUploadedImage } from './helpers/map-page-to-uploaded-image.helper';

/**
 * Manages the file attachment lifecycle — selecting, toggling,
 * removing, and syncing to conversation store.
 *
 * Pending file state is kept in a module-level shallowRef map keyed by
 * parentConversationId + conversationId so it survives when the Chat component is
 * unmounted while the user switches to another tab. Documents (pdf included)
 * are attached as-is — the server converts them at submit time.
 */
export function useAttachedFiles() {
  const conversationStore = useConversationStore();
  const toast = useToast();

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

  async function addImageEntry(
    sid: string,
    cid: string,
    file: File,
    currentHashes: Set<string>,
  ) {
    const hash = await hashFile(file).catch((error: unknown) => {
      toast.error(
        i18n.global.t('toast.failedReadFile', {
          name: file.name,
          message: error instanceof Error ? error.message : String(error),
        }),
      );
      return null;
    });
    if (!hash) return;
    if (currentHashes.has(hash)) return;
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
          kind: 'image',
        },
      ]);
    }
  }

  async function addDocumentEntry(
    sid: string,
    cid: string,
    file: File,
    currentHashes: Set<string>,
  ) {
    const hash = await hashFile(file).catch((error) => {
      toast.error(
        i18n.global.t('toast.failedReadFile', {
          name: file.name,
          message: error instanceof Error ? error.message : String(error),
        }),
      );
      return null;
    });
    if (!hash) return;
    currentHashes.add(hash);

    const exists = await checkObjectExists(sid, cid, hash).catch(() => false);
    if (exists) {
      conversationStore.setUploadedDocuments(sid, [
        {
          name: file.name,
          hash,
          type: file.type,
          uploadedAt: Date.now(),
          size: file.size,
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
          objectUrl: '',
          hash,
          conversationId: cid,
          kind: 'document',
        },
      ]);
    }
  }

  async function addPdfToServer(
    sid: string,
    cid: string,
    file: File,
    currentHashes: Set<string>,
  ) {
    try {
      const hash = await hashFile(file);
      if (currentHashes.has(hash)) return;
      currentHashes.add(hash);

      // The server stores the original and renders the pages at select
      // time; the page images become conversation image tiles.
      const documents = await convertDocuments(sid, cid, [{ file, hash }]);
      const converted = documents.find((doc) => doc.hash === hash);
      const pageImages = converted?.pageImages ?? [];

      if (pageImages.length > 0) {
        conversationStore.setUploadedImages(
          sid,
          pageImages.map((page) => mapPageToUploadedImage(page, cid)),
        );
      }

      // Keep the original as a document entry so it rides the submit's
      // originals (idempotent MinIO store) and the originals metadata —
      // the bubble still renders the page images, not a file icon.
      updateMap(sid, cid, (list) => [
        ...list,
        {
          file,
          isSelected: true,
          objectUrl: '',
          hash,
          conversationId: cid,
          kind: 'document',
        },
      ]);
    } catch (error) {
      toast.error(
        i18n.global.t('toast.failedReadFile', {
          name: file.name,
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  async function addFileEntry(
    sid: string,
    cid: string,
    file: File,
    currentHashes: Set<string>,
  ) {
    const kind = classifyAttachedFile(file);
    if (!kind) {
      toast.error(
        i18n.global.t('toast.unsupportedFileType', { name: file.name }),
      );
      return;
    }
    if (kind === 'image') {
      await addImageEntry(sid, cid, file, currentHashes);
      return;
    }
    if (kind === 'pdf') {
      await addPdfToServer(sid, cid, file, currentHashes);
      return;
    }
    await addDocumentEntry(sid, cid, file, currentHashes);
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
      ...conversationStore
        .getUploadedDocumentsForConversation(sid, cid)
        .map((doc) => doc.hash),
    ]);

    for (const file of files) {
      await addFileEntry(sid, cid, file, currentHashes);
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
