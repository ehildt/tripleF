import type { UploadedDocument } from '../../conversation.model';

/** Default an uploaded document to selected when rehydrating. */
export function mapUploadedDocument(doc: UploadedDocument): UploadedDocument {
  return { ...doc, selected: doc.selected ?? true };
}
