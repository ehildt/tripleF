import type { UploadedDocument } from '@/stores/conversation';
import type { AttachedFileEntry } from '@/types/attached-files.model';

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
