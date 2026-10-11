import { computed } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { deleteUploadedObject } from '@/api/storage.api';
import { useAttachmentList } from '@/components/chat/chat-right-toolbar/composables/use-attachment-list';
import type { AttachmentItem } from '@/components/chat/chat-right-toolbar/composables/use-attachment-list.types';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { useAttachedFilesStore } from '@/stores/attached-files';
import { useConversationStore } from '@/stores/conversation';

/**
 * Component-scoped state for the Files panel: the merged attachment list and
 * the remove/toggle/page actions that operate on it. Lives here — not in a
 * store — because only the Files panel uses it.
 */
export function useFiles() {
  const conversationStore = useConversationStore();
  const attachedFilesStore = useAttachedFilesStore();
  const toast = useToast();

  const activeConversationId = computed(
    () => conversationStore.activeConversationId ?? '',
  );
  const activeConversation = computed(
    () => conversationStore.getConversation(activeConversationId.value) ?? null,
  );

  /** The stable server conversationId (mapped from the internal id). */
  const conversationId = computed(() => {
    const conversation = activeConversation.value;
    if (!conversation?.id) return '';
    return conversationStore.getConversationId(conversation.id);
  });

  const attachedFiles = computed(() => attachedFilesStore.attachedFiles);

  const { attachments } = useAttachmentList();

  function previewUrlForHash(hash: string): string {
    const conversation = activeConversation.value;
    if (!conversation?.id) return '';
    return getApiUrl(
      `/api/v1/storage/${conversation.id}/${conversation.conversationId}/${hash}`,
    );
  }

  function previewUrl(item: AttachmentItem): string {
    if (!item.isUploaded) return item.previewUrl;
    return previewUrlForHash(item.hash);
  }

  function findPendingIndex(hash: string): number {
    return attachedFiles.value.findIndex((entry) => entry.hash === hash);
  }

  /** Delete a local image object unless another conversation still references it. */
  async function deleteImageObject(hash: string): Promise<boolean> {
    const stillReferenced = conversationStore.hasUploadedImageReference(
      activeConversationId.value,
      hash,
      conversationId.value,
    );
    if (stillReferenced) return true;
    try {
      await deleteUploadedObject(
        activeConversationId.value,
        conversationId.value,
        hash,
      );
      return true;
    } catch (e) {
      toast.debug(e instanceof Error ? e.message : String(e));
      toast.error(i18n.global.t('toast.failedRemoveFile'));
      return false;
    }
  }

  function pagesOf(parentHash: string) {
    return conversationStore
      .getUploadedImagesForConversation(
        activeConversationId.value,
        conversationId.value,
      )
      .filter((img) => img.parentHash === parentHash);
  }

  /** Remove the pdf original: the pending entry pre-submit, the uploaded document after. */
  function removeOriginal(parentHash: string) {
    const pendingIndex = findPendingIndex(parentHash);
    if (pendingIndex !== -1) {
      attachedFilesStore.removeAttachedFile(pendingIndex);
      return;
    }
    conversationStore.removeUploadedDocument(
      activeConversationId.value,
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
      activeConversationId.value,
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
      activeConversationId.value,
      parentHash,
      !allSelected,
      conversationId.value,
    );
    const pendingIndex = findPendingIndex(parentHash);
    if (pendingIndex !== -1) {
      attachedFilesStore.toggleAttachedFile(pendingIndex);
      return;
    }
    conversationStore.toggleUploadedDocumentSelected(
      activeConversationId.value,
      parentHash,
      conversationId.value,
    );
  }

  async function removeAttachment(id: string) {
    const item = attachments.value.find((a) => a.id === id);
    if (!item) return;

    if (item.pendingIndex !== null) {
      attachedFilesStore.removeAttachedFile(item.pendingIndex);
      return;
    }
    if (!activeConversation.value) return;

    if (item.kind === 'gallery') {
      await removeGallery(item.hash);
      return;
    }
    if (item.kind === 'document') {
      conversationStore.removeUploadedDocument(
        activeConversationId.value,
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
      activeConversationId.value,
      item.hash,
      conversationId.value,
    );
  }

  function toggleAttachment(id: string) {
    const item = attachments.value.find((a) => a.id === id);
    if (!item) return;

    if (item.pendingIndex !== null) {
      attachedFilesStore.toggleAttachedFile(item.pendingIndex);
      return;
    }
    if (!activeConversation.value) return;

    if (item.kind === 'gallery') {
      toggleGallery(item.hash);
      return;
    }
    if (item.kind === 'document') {
      conversationStore.toggleUploadedDocumentSelected(
        activeConversationId.value,
        item.hash,
        conversationId.value,
      );
      return;
    }
    conversationStore.toggleUploadedImageSelected(
      activeConversationId.value,
      item.hash,
      conversationId.value,
    );
  }

  /** Drop one page of a pdf; dropping the last page removes the whole pdf. */
  async function removePage(parentHash: string, pageHash: string) {
    if (!activeConversation.value) return;
    const page = pagesOf(parentHash).find((img) => img.hash === pageHash);
    if (!page) return;

    if (page.source !== 'cloud') {
      const ok = await deleteImageObject(pageHash);
      if (!ok) return;
    }
    conversationStore.removeUploadedImage(
      activeConversationId.value,
      pageHash,
      conversationId.value,
    );
    if (pagesOf(parentHash).length === 0) removeOriginal(parentHash);
  }

  return {
    previewUrl,
    previewUrlForHash,
    removeAttachment,
    toggleAttachment,
    removePage,
  };
}
