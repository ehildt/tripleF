import { convertDocuments } from '@/api/documents.api';
import { checkObjectExists } from '@/api/object-storage.api';
import { classifyAttachedFile } from '@/components/chat/chat-left-toolbar/shared/helpers/classify-attached-file.helper';
import { mapPageToUploadedImage } from '@/components/chat/chat-left-toolbar/shared/helpers/map-page-to-uploaded-image.helper';
import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationConfiguration } from '@/components/chat/composables/use-conversation-configuration';
import { useConversationDocuments } from '@/components/chat/composables/use-conversation-documents';
import { useConversationImages } from '@/components/chat/composables/use-conversation-images';
import { usePendingAttachments } from '@/components/chat/shared/composables/use-pending-attachments';
import { useToast } from '@/composables/use-toast/use-toast';
import { i18n } from '@/i18n/i18n';
import { useAttachedFilesStore } from '@/stores/chat/attached-files/attached-files.store';
import type { PendingAttachmentScope } from '@/stores/chat/attached-files/attached-files.store.types';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { getUploadedDocumentsForConversation } from '@/stores/chat/conversation/helpers/get-uploaded-documents-for-conversation.helper';
import { getUploadedImagesForConversation } from '@/stores/chat/conversation/helpers/get-uploaded-images-for-conversation.helper';
import { createId } from '@/utils/create-id/create-id.helper';
import { hashFile } from '@/utils/hash-file/hash-file.helper';

interface AttachmentIntake {
  addFiles: (files: File[]) => Promise<void>;
}

/**
 * Coordinates file selection for the active conversation: classification,
 * hashing, storage checks, PDF conversion, metadata writes, and toasts.
 */
export function useAttachmentIntake(): AttachmentIntake {
  const attachedFilesStore = useAttachedFilesStore();
  const conversationStore = useConversationStore();
  const catalog = useConversationCatalog();
  const configuration = useConversationConfiguration();
  const images = useConversationImages();
  const documents = useConversationDocuments();
  const pendingAttachments = usePendingAttachments();
  const toast = useToast();

  function ensureConversation(): string {
    const parentConversationId = conversationStore.activeConversationId;
    if (!parentConversationId) return '';
    if (!conversationStore.getConversationId(parentConversationId))
      void configuration.setConversationId(parentConversationId, createId());
    return conversationStore.getConversationId(parentConversationId);
  }

  async function addImageEntry(
    scope: PendingAttachmentScope,
    file: File,
    currentHashes: Set<string>,
  ): Promise<void> {
    const hash = await hashFile(file).catch((error: unknown) => {
      toast.debug(error instanceof Error ? error.message : String(error));
      toast.error(i18n.global.t('toast.failedReadFile', { name: file.name }));
      return null;
    });

    if (!hash) return;
    if (currentHashes.has(hash)) return;
    currentHashes.add(hash);

    const exists = await checkObjectExists(
      scope.parentConversationId,
      scope.conversationId,
      hash,
    ).catch(() => false);

    if (exists)
      void images.setUploadedImages(scope.parentConversationId, [
        {
          name: file.name,
          hash,
          size: file.size,
          uploadedAt: Date.now(),
          selected: true,
          conversationId: scope.conversationId,
        },
      ]);
    else pendingAttachments.addPendingFile(scope, file, hash, 'image');
  }

  async function addDocumentEntry(
    scope: PendingAttachmentScope,
    file: File,
    currentHashes: Set<string>,
  ): Promise<void> {
    const hash = await hashFile(file).catch((error: unknown) => {
      toast.debug(error instanceof Error ? error.message : String(error));
      toast.error(i18n.global.t('toast.failedReadFile', { name: file.name }));
      return null;
    });
    if (!hash) return;
    currentHashes.add(hash);

    const exists = await checkObjectExists(
      scope.parentConversationId,
      scope.conversationId,
      hash,
    ).catch(() => false);

    if (exists)
      void documents.setUploadedDocuments(scope.parentConversationId, [
        {
          name: file.name,
          hash,
          type: file.type,
          uploadedAt: Date.now(),
          size: file.size,
          selected: true,
          conversationId: scope.conversationId,
        },
      ]);
    else pendingAttachments.addPendingFile(scope, file, hash, 'document');
  }

  async function addPdfToServer(
    scope: PendingAttachmentScope,
    file: File,
    currentHashes: Set<string>,
  ): Promise<void> {
    try {
      const hash = await hashFile(file);
      if (currentHashes.has(hash)) return;
      currentHashes.add(hash);

      // The original is stored immediately; rendered pages become the
      // conversation's image tiles while the original remains pending for
      // the submit's idempotent originals upload and metadata.
      const documents = await convertDocuments(
        scope.parentConversationId,
        scope.conversationId,
        [{ file, hash }],
      );
      const converted = documents.find((document) => document.hash === hash);
      const pageImages = converted?.pageImages ?? [];

      if (pageImages.length > 0) {
        void images.setUploadedImages(
          scope.parentConversationId,
          pageImages.map((page) =>
            mapPageToUploadedImage(page, scope.conversationId, {
              parentHash: hash,
              parentName: file.name,
            }),
          ),
        );
      }

      pendingAttachments.addPendingFile(scope, file, hash, 'document');
    } catch (error: unknown) {
      toast.debug(error instanceof Error ? error.message : String(error));
      toast.error(i18n.global.t('toast.failedReadFile', { name: file.name }));
    }
  }

  async function addFileEntry(
    scope: PendingAttachmentScope,
    file: File,
    currentHashes: Set<string>,
  ): Promise<void> {
    const kind = classifyAttachedFile(file);

    if (!kind) {
      toast.error(
        i18n.global.t('toast.unsupportedFileType', { name: file.name }),
      );
      return;
    }

    if (kind === 'image') {
      await addImageEntry(scope, file, currentHashes);
      return;
    }

    if (kind === 'pdf') {
      await addPdfToServer(scope, file, currentHashes);
      return;
    }

    await addDocumentEntry(scope, file, currentHashes);
  }

  async function addFiles(files: File[]): Promise<void> {
    const parentConversationId =
      conversationStore.activeConversationId || catalog.ensureConversation().id;
    const conversationId = ensureConversation() || createId();
    if (!parentConversationId) return;
    void configuration.setConversationId(parentConversationId, conversationId);
    const scope = { parentConversationId, conversationId };

    const currentHashes = new Set<string>([
      ...attachedFilesStore.pendingFilesFor(scope).map((entry) => entry.hash),
      ...getUploadedImagesForConversation(
        conversationStore.getConversation(parentConversationId),
        conversationId,
      ).map((image) => image.hash),
      ...getUploadedDocumentsForConversation(
        conversationStore.getConversation(parentConversationId),
        conversationId,
      ).map((document) => document.hash),
    ]);

    for (const file of files) await addFileEntry(scope, file, currentHashes);
  }

  return { addFiles };
}
