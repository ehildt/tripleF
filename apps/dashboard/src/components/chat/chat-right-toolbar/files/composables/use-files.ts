import { computed } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { deleteUploadedObject } from '@/api/object-storage.api';
import { useAttachmentList } from '@/components/chat/chat-right-toolbar/composables/use-attachment-list';
import type { AttachmentItem } from '@/components/chat/chat-right-toolbar/composables/use-attachment-list.types';
import { useConversationDocuments } from '@/components/chat/composables/use-conversation-documents';
import { useConversationImages } from '@/components/chat/composables/use-conversation-images';
import { usePendingAttachments } from '@/components/chat/shared/composables/use-pending-attachments';
import { useToast } from '@/composables/use-toast/use-toast';
import { i18n } from '@/i18n/i18n';
import type { AttachedFileEntry } from '@/stores/chat/attached-files/attached-files.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { getUploadedImagesForConversation } from '@/stores/chat/conversation/helpers/get-uploaded-images-for-conversation.helper';
import { hasUploadedImageReference } from '@/stores/chat/conversation/helpers/has-uploaded-image-reference.helper';

/**
 * Component-scoped state for the Files panel: the merged attachment list and
 * the remove/toggle/page actions that operate on it. Lives here — not in a
 * store — because only the Files panel uses it.
 */
export function useFiles() {
  const conversationStore = useConversationStore();
  const images = useConversationImages();
  const documents = useConversationDocuments();
  const { attachedFiles, removePendingFile, togglePendingFile } =
    usePendingAttachments();
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

  const { attachments } = useAttachmentList();

  function previewUrlForHash(hash: string): string {
    const conversation = activeConversation.value;
    if (!conversation?.id) return '';
    return getApiUrl(
      `/api/v1/object-storage/${conversation.id}/${conversation.conversationId}/${hash}`,
    );
  }

  function previewUrl(item: AttachmentItem): string {
    if (!item.isUploaded) return item.previewUrl;
    return previewUrlForHash(item.hash);
  }

  function findPendingEntry(hash: string): AttachedFileEntry | undefined {
    return attachedFiles.value.find((entry) => entry.hash === hash);
  }

  /** Delete a local image object unless another conversation still references it. */
  async function deleteImageObject(hash: string): Promise<boolean> {
    const stillReferenced = hasUploadedImageReference(
      activeConversation.value ?? undefined,
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
    return getUploadedImagesForConversation(
      activeConversation.value ?? undefined,
      conversationId.value,
    ).filter((img) => img.parentHash === parentHash);
  }

  /** Remove the pdf original: the pending entry pre-submit, the uploaded document after. */
  function removeOriginal(parentHash: string) {
    const pendingEntry = findPendingEntry(parentHash);
    if (pendingEntry) {
      removePendingFile(pendingEntry.id);
      return;
    }
    void documents.removeUploadedDocument(
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
    void images.removeUploadedImagesForParent(
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
    void images.setUploadedImagesSelectedForParent(
      activeConversationId.value,
      parentHash,
      !allSelected,
      conversationId.value,
    );
    const pendingEntry = findPendingEntry(parentHash);
    if (pendingEntry) {
      togglePendingFile(pendingEntry.id);
      return;
    }
    void documents.toggleUploadedDocumentSelected(
      activeConversationId.value,
      parentHash,
      conversationId.value,
    );
  }

  async function removeAttachment(id: string) {
    const item = attachments.value.find((a) => a.id === id);
    if (!item) return;

    if (!item.isUploaded) {
      removePendingFile(item.id);
      return;
    }
    if (!activeConversation.value) return;

    if (item.kind === 'gallery') {
      await removeGallery(item.hash);
      return;
    }
    if (item.kind === 'document') {
      void documents.removeUploadedDocument(
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
    void images.removeUploadedImage(
      activeConversationId.value,
      item.hash,
      conversationId.value,
    );
  }

  function toggleAttachment(id: string) {
    const item = attachments.value.find((a) => a.id === id);
    if (!item) return;

    if (!item.isUploaded) {
      togglePendingFile(item.id);
      return;
    }
    if (!activeConversation.value) return;

    if (item.kind === 'gallery') {
      toggleGallery(item.hash);
      return;
    }
    if (item.kind === 'document') {
      void documents.toggleUploadedDocumentSelected(
        activeConversationId.value,
        item.hash,
        conversationId.value,
      );
      return;
    }
    void images.toggleUploadedImageSelected(
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
    void images.removeUploadedImage(
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
