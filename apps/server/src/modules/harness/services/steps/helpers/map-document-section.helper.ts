import type { DocumentSection } from '../../../helpers/documents/document-section.types.js';

/** Project a document section into the lexicon index shape. */
export function mapDocumentSection(section: DocumentSection) {
  return {
    url: section.url,
    title: section.name,
    content: section.text,
  };
}
