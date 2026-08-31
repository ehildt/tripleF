import type { DocumentSection } from '../../helpers/documents/document-section.types.js';

/** Cap a document section's text at the given limit. */
export function truncateDocumentSection(
  section: DocumentSection,
  limit: number,
): DocumentSection {
  return {
    ...section,
    text:
      section.text.length > limit ? section.text.slice(0, limit) : section.text,
  };
}
