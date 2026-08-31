import type { DocumentSection } from '../../../helpers/documents/document-section.types.js';

/**
 * Project a document section into the encyclopedia index shape — the whole
 * upload delegation: extracted text, the MinIO url (persist key + open
 * link), and the original's metadata (mime, size, content hash).
 */
export function mapDocumentSection(section: DocumentSection) {
  return {
    url: section.url,
    title: section.name,
    content: section.text,
    mimeType: section.mimeType,
    sizeBytes: section.sizeBytes,
    originalHash: section.originalHash,
  };
}
