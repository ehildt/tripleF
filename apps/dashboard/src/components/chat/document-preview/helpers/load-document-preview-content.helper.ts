import { sanitizeHtml } from '@/utils/sanitize-html.helper';

export interface DocumentPreviewContent {
  html?: string;
  text?: string;
}

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

async function fetchManifest(
  url: string,
): Promise<DocumentPreviewContent | null> {
  try {
    const response = await fetch(`${url}.conv`);
    if (!response.ok) return null;
    const manifest = (await response.json()) as {
      html?: string;
      slides?: string[];
      text?: string;
    };
    if (manifest.html) return { html: sanitizeHtml(manifest.html) };
    if (manifest.slides) return { text: manifest.slides.join('\n\n') };
    return manifest.text ? { text: manifest.text } : null;
  } catch {
    return null;
  }
}

async function fetchOriginalText(url: string): Promise<{ text: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { text: new TextDecoder().decode(await response.arrayBuffer()) };
}
