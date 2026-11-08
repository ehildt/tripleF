import type { AttachedFileEntry } from '@/stores/chat/attached-files/attached-files.model';
import type { UploadedDocument } from '@/stores/chat/conversation/conversation.model';

/** Convert a pending document entry into an uploaded document. */
export function mapDocumentEntry(
  entry: AttachedFileEntry,
  conversationId: string,
): UploadedDocument {
  return {
    name: entry.file.name,
    hash: entry.hash,
    type: entry.file.type || 'application/octet-stream',
    uploadedAt: Date.now(),
    size: entry.file.size,
    selected: true,
    conversationId,
  };
}
