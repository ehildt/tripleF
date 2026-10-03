import { fetchManifest } from './fetch-manifest.helper';
import { fetchOriginalText } from './fetch-original-text.helper';
import type { DocumentPreviewContent } from './load-document-preview-content.helper.types';

/**
 * Load what the preview renders for a document's storage url: pdf is
 * rendered as page-image tiles (never here), docx/pptx read their
 * server-built conversion manifest (sanitized html / slide text), and every
 * other document is rendered as the original file's text.
 */
export async function loadDocumentPreviewContent(
  url: string,
  name: string,
): Promise<DocumentPreviewContent> {
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  if (extension === 'docx' || extension === 'pptx') {
    const manifest = await fetchManifest(url);
    if (!manifest) {
      // Pre-conversion document (or manifest fetch failed): the stored
      // original is binary — surface an error instead of dumping noise.
      throw new Error('preview unavailable');
    }
    return manifest;
  }
  return fetchOriginalText(url);
}
