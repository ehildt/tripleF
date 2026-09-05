import { computed, type Ref } from 'vue';

import { deleteUploadedObject } from '@/api/storage.api';
import type { AttachedFileEntry } from '@/composables/attached-files.state.types';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import type { Conversation } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';

import type { AttachmentItem } from './use-attachment-list.types';

export interface UseAttachmentActionsOptions {
  /** The merged Files-panel items. */
  attachments: Ref<AttachmentItem[]>;
  /** Pending (not yet uploaded) file entries of the active conversation. */
  attachedFiles: Ref<AttachedFileEntry[]>;
  conversation: Ref<Conversation | null>;
  activeConversationId: Ref<string>;
  /** Remove a pending file entry by its index in the pending list. */
  removePendingFile: (index: number) => void;
  /** Toggle a pending file entry's selection by its index. */
  togglePendingFile: (index: number) => void;
}

/**
 * Owns the Files-panel actions: removing and toggling image cards, document
 * rows, and pdf galleries, plus dropping a single page from a gallery. A
 * gallery acts as one unit — its toggle flips every page and the original
 * together, and dropping its last page removes the whole pdf.
 */
export function useAttachmentActions(options: UseAttachmentActionsOptions) {
  const {
    attachments,
    attachedFiles,
    conversation,
    activeConversationId,
    removePendingFile,
    togglePendingFile,
  } = options;
  const conversationStore = useConversationStore();
  const toast = useToast();

  const sessionId = computed(() => conversation.value?.id ?? '');
  const conversationId = computed(() => activeConversationId.value);

  function findPendingIndex(hash: string): number {
    return attachedFiles.value.findIndex((entry) => entry.hash === hash);
  }

  /** Delete a local image object unless another conversation still references it. */
  async function deleteImageObject(hash: string): Promise<boolean> {
    const stillReferenced = conversationStore.hasUploadedImageReference(
      sessionId.value,
      hash,
      conversationId.value,
    );
    if (stillReferenced) return true;
    try {
      await deleteUploadedObject(sessionId.value, conversationId.value, hash);
      return true;
    } catch (e) {
      toast.debug(e instanceof Error ? e.message : String(e));
      toast.error(i18n.global.t('toast.failedRemoveFile'));
      return false;
    }
  }

  function pagesOf(parentHash: string) {
    return conversationStore
      .getUploadedImagesForConversation(sessionId.value, conversationId.value)
      .filter((img) => img.parentHash === parentHash);
  }

  /** Remove the pdf original: the pending entry pre-submit, the uploaded document after. */
  function removeOriginal(parentHash: string) {
    const pendingIndex = findPendingIndex(parentHash);
    if (pendingIndex !== -1) {
      removePendingFile(pendingIndex);
      return;
    }
    conversationStore.removeUploadedDocument(
      sessionId.value,
      parentHash,
      conversationId.value,
    );
  }

  async function removeGallery(parentHash: string) {
    const pages = pagesOf(parentHash);
    for (const page of pages) {
      if (page.source !== 'cloud') {
        const ok = await deleteImageObject(page.hash);
        if (!ok) return;
      }
    }
    conversationStore.removeUploadedImagesForParent(
      sessionId.value,
      parentHash,
      conversationId.value,
    );
    removeOriginal(parentHash);
  }

  function toggleGallery(parentHash: string) {
    const pages = pagesOf(parentHash);
    if (pages.length === 0) return;
    const allSelected = pages.every((p) => p.selected !== false);
    conversationStore.setUploadedImagesSelectedForParent(
      sessionId.value,
      parentHash,
      !allSelected,
      conversationId.value,
    );
    const pendingIndex = findPendingIndex(parentHash);
    if (pendingIndex !== -1) {
      togglePendingFile(pendingIndex);
      return;
    }
    conversationStore.toggleUploadedDocumentSelected(
      sessionId.value,
      parentHash,
      conversationId.value,
    );
  }

  async function removeAttachment(id: string) {
    const item = attachments.value.find((a) => a.id === id);
    if (!item) return;

    if (item.pendingIndex !== null) {
      removePendingFile(item.pendingIndex);
      return;
    }
    if (!conversation.value) return;

    if (item.kind === 'gallery') {
      await removeGallery(item.hash);
      return;
    }
    if (item.kind === 'document') {
      conversationStore.removeUploadedDocument(
        sessionId.value,
        item.hash,
        conversationId.value,
      );
      return;
    }
    if (item.source !== 'cloud') {
      const ok = await deleteImageObject(item.hash);
      if (!ok) return;
    }
    conversationStore.removeUploadedImage(
      sessionId.value,
      item.hash,
      conversationId.value,
    );
  }

  function toggleAttachment(id: string) {
    const item = attachments.value.find((a) => a.id === id);
    if (!item) return;

    if (item.pendingIndex !== null) {
      togglePendingFile(item.pendingIndex);
      return;
    }
    if (!conversation.value) return;

    if (item.kind === 'gallery') {
      toggleGallery(item.hash);
      return;
    }
    if (item.kind === 'document') {
      conversationStore.toggleUploadedDocumentSelected(
        sessionId.value,
        item.hash,
        conversationId.value,
      );
      return;
    }
    conversationStore.toggleUploadedImageSelected(
      sessionId.value,
      item.hash,
      conversationId.value,
    );
  }

  /** Drop one page of a pdf; dropping the last page removes the whole pdf. */
  async function removePage(parentHash: string, pageHash: string) {
    if (!conversation.value) return;
    const page = pagesOf(parentHash).find((img) => img.hash === pageHash);
    if (!page) return;

    if (page.source !== 'cloud') {
      const ok = await deleteImageObject(pageHash);
      if (!ok) return;
    }
    conversationStore.removeUploadedImage(
      sessionId.value,
      pageHash,
      conversationId.value,
    );
    if (pagesOf(parentHash).length === 0) removeOriginal(parentHash);
  }

  return {
    removeAttachment,
    toggleAttachment,
    removePage,
  };
}
