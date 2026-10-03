import { sanitizeHtml } from '@/utils/sanitize-html.helper';

import type { DocumentPreviewContent } from './load-document-preview-content.helper.types';

/** Fetch the server-built conversion manifest for a docx/pptx document. */
export async function fetchManifest(
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
