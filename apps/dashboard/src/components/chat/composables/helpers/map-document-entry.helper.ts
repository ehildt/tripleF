import type { AttachedFileEntry } from '@/composables/attached-files.state.types';
import type { UploadedDocument } from '@/stores/conversation';

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
